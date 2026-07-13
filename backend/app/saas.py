"""
SaaS Phase 1 — comptes & accès (baseline spec v2.1, étapes 1→5).

Tables : User, UserRole, Entitlement, DailyUsage.
Resolver : effective_plan(user) — PREMIUM s'il existe un entitlement premium actif.

Principes non négociables (spec §1) :
- User n'a NI `role` NI `account_type` figés. L'accès est calculé.
- effective_plan n'est jamais stocké : toujours résolu.
- Cloisonnement côté serveur (les filtres de périmètre vivent dans main.py).

Tout est additif : ces tables s'ajoutent sans toucher aux tables du moteur.
"""
from typing import Optional
from datetime import datetime, date, timedelta

from sqlmodel import SQLModel, Field, Session, select


# ---------- 1. User ----------
class User(SQLModel, table=True):
    """Un utilisateur est toujours juste un utilisateur. Aucun rôle ni plan figé ici."""
    id: Optional[int] = Field(default=None, primary_key=True)
    # learner_id historique = slug ; on garde un identifiant public stable.
    public_id: str = Field(index=True, unique=True)      # ex. slug "a-benali" ou "u1699…"
    name: str = ""
    email: Optional[str] = Field(default=None, index=True)   # unique en pratique ; nullable (comptes code-only)
    access_code: Optional[str] = Field(default=None)         # onboarding classe rapide
    created_from: str = "public"                             # public | invitation | admin_created
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # v41 — droit à l'effacement. Non nul = suppression demandée : le délai de
    # grâce court, le compte est désactivé, mais rien n'est encore effacé.
    # Nullable + défaut = migration additive (les comptes existants ne bougent pas).
    deletion_requested_at: Optional[datetime] = Field(default=None)


# ---------- 2. UserRole (rôle à scope) ----------
class UserRole(SQLModel, table=True):
    """Un rôle DANS un périmètre. Une personne peut cumuler plusieurs lignes."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    role: str = "learner"                 # learner | trainer | admin | super
    scope_type: str = "platform"          # platform | organization | cohort
    scope_id: Optional[int] = Field(default=None)   # null si platform


# ---------- 3. Entitlement (source unique du plan) ----------
class Entitlement(SQLModel, table=True):
    """Chaque droit d'accès premium est une ligne. Le plan effectif en découle."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    source: str = "personal"              # personal | institution | grace | admin_grant
    plan: str = "free"                    # free | premium | institution
    starts_at: datetime = Field(default_factory=datetime.utcnow)
    ends_at: Optional[datetime] = Field(default=None)       # null = sans échéance
    status: str = "active"                # active | expired | cancelled
    org_id: Optional[int] = Field(default=None)
    cohort_id: Optional[int] = Field(default=None)


# ---------- 5. DailyUsage (limite freemium) ----------
class DailyUsage(SQLModel, table=True):
    """Compteur de questions gratuites par jour calendrier (spec §2.9c)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    usage_day: date = Field(index=True)                    # jour calendrier
    questions_answered: int = 0


# ======================================================================
# PHASE 2 — Institution : Organization, Cohort, CohortMembership
# ======================================================================
# Le cloisonnement B2B repose sur ces trois tables. Une organisation contient
# des cohortes ; une cohorte contient des membres (apprenants + formateurs) via
# CohortMembership (le pivot identité <-> appartenance de la spec §2.4).

class Organization(SQLModel, table=True):
    """Un client institutionnel. Frontière de cloisonnement : aucune donnée ne
    traverse une organisation (spec §1.2)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = ""
    status: str = "active"                # active | suspended | trial
    seats: int = 0                         # quota de licences
    renewal_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Cohort(SQLModel, table=True):
    """Une promo, identifiée par un code générique (ex. PMP-2026-A)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True)          # ex. "PMP-2026-A"
    org_id: int = Field(index=True, foreign_key="organization.id")
    name: str = ""
    exam_date: Optional[date] = Field(default=None)
    status: str = "active"                 # active | archived
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CohortMembership(SQLModel, table=True):
    """Le pivot identité <-> appartenance (spec §2.4, Option A).
    Le rôle formateur dans une cohorte est porté par role_in_cohort='trainer'."""
    id: Optional[int] = Field(default=None, primary_key=True)
    cohort_id: int = Field(index=True, foreign_key="cohort.id")
    user_id: int = Field(index=True, foreign_key="user.id")
    role_in_cohort: str = "learner"        # learner | assistant | trainer
    status: str = "active"                 # active | invited | removed
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    removed_at: Optional[datetime] = Field(default=None)


# ======================================================================
# 4. Resolver — effective_plan
# ======================================================================
PREMIUM_PLANS = ("premium", "institution")
# DailyUsage is now only an anti-abuse ceiling, NOT the freemium model.
# The freemium model is feature-based (see FeatureGate below). This ceiling is
# high enough to never hit in normal use; it just protects against abuse/cost.
FREE_LIMIT_PER_DAY = 50


def effective_plan(session: Session, user_id: int, now: Optional[datetime] = None) -> str:
    """Retourne 'premium' s'il existe un entitlement premium actif, sinon 'free'.
    Ne stocke jamais le résultat : toujours calculé (spec §3)."""
    now = now or datetime.utcnow()
    ents = session.exec(select(Entitlement).where(Entitlement.user_id == user_id)).all()
    for e in ents:
        if (e.status == "active"
                and e.plan in PREMIUM_PLANS
                and e.starts_at <= now
                and (e.ends_at is None or e.ends_at > now)):
            return "premium"
    return "free"


def roles_for(session: Session, user_id: int) -> list[dict]:
    rows = session.exec(select(UserRole).where(UserRole.user_id == user_id)).all()
    return [{"role": r.role, "scope_type": r.scope_type, "scope_id": r.scope_id} for r in rows]


# ======================================================================
# DailyUsage helpers (freemium gate)
# ======================================================================
def usage_today(session: Session, user_id: int, today: Optional[date] = None) -> DailyUsage:
    """Récupère (ou crée) la ligne d'usage du jour pour cet utilisateur."""
    today = today or datetime.utcnow().date()
    row = session.exec(
        select(DailyUsage).where(DailyUsage.user_id == user_id, DailyUsage.usage_day == today)
    ).first()
    if not row:
        row = DailyUsage(user_id=user_id, usage_day=today, questions_answered=0)
        session.add(row)
        session.commit()
        session.refresh(row)
    return row


def can_answer(session: Session, user_id: int, today: Optional[date] = None) -> bool:
    """True si l'utilisateur peut répondre à une question de plus aujourd'hui.
    Premium → illimité. Free → borné par FREE_LIMIT_PER_DAY."""
    if effective_plan(session, user_id) == "premium":
        return True
    row = usage_today(session, user_id, today)
    return row.questions_answered < FREE_LIMIT_PER_DAY


def record_answer(session: Session, user_id: int, today: Optional[date] = None) -> None:
    """Incrémente le compteur du jour (à appeler quand une question gratuite est servie)."""
    row = usage_today(session, user_id, today)
    row.questions_answered += 1
    session.add(row)
    session.commit()


# ======================================================================
# Migration : learner_id existants -> User (idempotent)
# ======================================================================
def migrate_learners(session: Session) -> dict:
    """Pour chaque learner_id distinct présent dans le moteur, créer un User
    (public_id = learner_id) + un UserRole(learner, platform) s'il n'existe pas.
    Idempotent : relançable sans créer de doublon. La progression reste attachée
    aux tables existantes via learner_id = User.public_id."""
    from .models import Mastery, Attempt  # local import (avoid cycle)

    # collecte des learner_id distincts (Mastery couvre l'essentiel ; Attempt en filet)
    ids = set()
    for lid in session.exec(select(Mastery.learner_id).distinct()).all():
        if lid:
            ids.add(lid)
    for lid in session.exec(select(Attempt.learner_id).distinct()).all():
        if lid:
            ids.add(lid)

    created_users = 0
    created_roles = 0
    for lid in sorted(ids):
        user = session.exec(select(User).where(User.public_id == lid)).first()
        if not user:
            # nom lisible : partie après "cohort:" si présent, sinon l'id
            disp = lid.split(":", 1)[1] if ":" in lid else lid
            user = User(public_id=lid, name=disp, created_from="public")
            session.add(user)
            session.commit()
            session.refresh(user)
            created_users += 1
        # rôle learner/platform s'il manque
        has_role = session.exec(
            select(UserRole).where(UserRole.user_id == user.id,
                                   UserRole.role == "learner",
                                   UserRole.scope_type == "platform")
        ).first()
        if not has_role:
            session.add(UserRole(user_id=user.id, role="learner", scope_type="platform"))
            session.commit()
            created_roles += 1

    return {"learners_seen": len(ids), "users_created": created_users, "roles_created": created_roles}


def get_or_create_user(session: Session, public_id: str, name: Optional[str] = None) -> "User":
    """Resolve a User by public_id (= learner_id). Create it lazily if missing,
    with a default learner/platform role. Keeps every learner_id backed by a User."""
    u = session.exec(select(User).where(User.public_id == public_id)).first()
    if u:
        return u
    disp = name or (public_id.split(":", 1)[1] if ":" in public_id else public_id)
    u = User(public_id=public_id, name=disp, created_from="public")
    session.add(u); session.commit(); session.refresh(u)
    session.add(UserRole(user_id=u.id, role="learner", scope_type="platform")); session.commit()
    return u


# ======================================================================
# FeatureGate — le cœur du modèle freemium (par fonctionnalité, pas par usage)
# ======================================================================
# Principe (décidé produit) : le gratuit reste UTILE, le premium devient
# INTELLIGENT. Trois niveaux d'accès par fonction :
#   "full"    : accès complet
#   "preview" : aperçu bridé (goûter la fonction, donne envie du premium)
#   "none"    : pas d'accès
#
# Le gratuit n'est jamais "puni" : il pratique, voit sa carte de base, et a un
# APERÇU des fonctions intelligentes (3 zones faibles, chemin critique partiel…).
FEATURES = [
    "basic_practice",     # pratiquer des questions
    "basic_map",          # carte PMP de base
    "basic_readiness",    # score de préparation simple
    "weak_area_preview",  # zones faibles
    "adaptive_session",   # moteur adaptatif complet
    "full_critical_path", # chemin critique personnel complet
    "spaced_repetition",  # révision adaptative des erreurs (libellé UI: apprentissage adaptatif)
    "refresh_decay",      # logique de fraîcheur / entretien
    "exam_simulator",     # simulateur d'examen
    "full_history",       # historique de progression complet
    "full_map",           # carte mentale détaillée complète
    "recommendations",    # recommandations avancées
    "trainer_dashboard",  # cockpit formateur
    "targeted_sessions",  # séances ciblées assignées
    "cohort_heatmap",     # heatmap cohorte
]

# Matrice d'accès par plan. Valeurs : "full" | "preview" | "none".
FEATURE_MATRIX = {
    "free": {
        "basic_practice": "full",
        "basic_map": "full",
        "basic_readiness": "full",
        "weak_area_preview": "preview",   # 3 zones au lieu de toutes
        "adaptive_session": "preview",    # aperçu du moteur, pas la session complète
        "full_critical_path": "preview",  # aperçu du chemin, pas le détail
        "spaced_repetition": "none",
        "refresh_decay": "none",
        "exam_simulator": "none",
        "full_history": "preview",        # historique limité
        "full_map": "preview",            # carte simplifiée
        "recommendations": "preview",     # recommandations limitées
        "trainer_dashboard": "none",
        "targeted_sessions": "none",
        "cohort_heatmap": "none",
    },
    "premium": {
        # tout l'intelligent en "full" ; les fonctions institution restent "none"
        **{f: "full" for f in FEATURES},
        "trainer_dashboard": "none",
        "targeted_sessions": "none",
        "cohort_heatmap": "none",
    },
    "institution": {
        # premium + fonctions cohorte
        **{f: "full" for f in FEATURES},
    },
}

# Nombre d'éléments montrés en mode "preview" (bridage).
PREVIEW_LIMITS = {
    "weak_area_preview": 3,   # 3 zones faibles visibles
    "full_critical_path": 2,  # 2 étapes du chemin critique
    "full_history": 5,        # 5 derniers éléments d'historique
}


def _plan_for_features(session: Session, user_id: int) -> str:
    """Plan utilisé pour la matrice de features. Aujourd'hui, premium personnel
    ou institutionnel → on distingue via la source de l'entitlement actif."""
    now = datetime.utcnow()
    ents = session.exec(select(Entitlement).where(Entitlement.user_id == user_id)).all()
    has_institution = False
    has_premium = False
    for e in ents:
        active = (e.status == "active" and e.starts_at <= now
                  and (e.ends_at is None or e.ends_at > now))
        if not active:
            continue
        if e.plan == "institution" or e.source == "institution":
            has_institution = True
        elif e.plan == "premium":
            has_premium = True
    if has_institution:
        return "institution"
    if has_premium:
        return "premium"
    return "free"


def feature_access(session: Session, user_id: int, feature_key: str) -> str:
    """Retourne 'full' | 'preview' | 'none' pour une fonction donnée."""
    plan = _plan_for_features(session, user_id)
    return FEATURE_MATRIX.get(plan, FEATURE_MATRIX["free"]).get(feature_key, "none")


def can_use_feature(session: Session, user_id: int, feature_key: str) -> bool:
    """True si l'utilisateur a un accès (full ou preview) à la fonction."""
    return feature_access(session, user_id, feature_key) != "none"


def features_for(session: Session, user_id: int) -> dict:
    """Carte complète des accès (pour /api/me → le frontend sait quoi afficher)."""
    plan = _plan_for_features(session, user_id)
    matrix = FEATURE_MATRIX.get(plan, FEATURE_MATRIX["free"])
    out = {}
    for f in FEATURES:
        access = matrix.get(f, "none")
        entry = {"access": access, "label": FEATURE_LABELS.get(f, {"fr": f, "en": f}),
                 "intelligent": f in PREMIUM_INTELLIGENT}
        if access == "preview" and f in PREVIEW_LIMITS:
            entry["preview_limit"] = PREVIEW_LIMITS[f]
        out[f] = entry
    return out


# User-facing labels (plain language, NO jargon like "répétition espacée").
# The frontend reads these so wording stays consistent and professional.
FEATURE_LABELS = {
    "basic_practice":     {"fr": "Pratique des questions",        "en": "Question practice"},
    "basic_map":          {"fr": "Carte PMP de base",             "en": "Basic PMP map"},
    "basic_readiness":    {"fr": "Score de préparation",          "en": "Readiness score"},
    "weak_area_preview":  {"fr": "Vos zones à renforcer",         "en": "Your weak areas"},
    "adaptive_session":   {"fr": "Séances adaptatives",           "en": "Adaptive sessions"},
    "full_critical_path": {"fr": "Chemin critique personnel",     "en": "Personal critical path"},
    # "apprentissage adaptatif" — plain language instead of "répétition espacée"
    "spaced_repetition":  {"fr": "Apprentissage adaptatif de vos erreurs", "en": "Adaptive learning from your mistakes"},
    "refresh_decay":      {"fr": "Révision d'entretien",          "en": "Maintenance review"},
    "exam_simulator":     {"fr": "Simulateur d'examen",           "en": "Exam simulator"},
    "full_history":       {"fr": "Historique de progression",     "en": "Progress history"},
    "full_map":           {"fr": "Carte mentale détaillée",       "en": "Detailed mind map"},
    "recommendations":    {"fr": "Recommandations",               "en": "Recommendations"},
    "trainer_dashboard":  {"fr": "Cockpit formateur",             "en": "Trainer cockpit"},
    "targeted_sessions":  {"fr": "Séances ciblées",               "en": "Targeted sessions"},
    "cohort_heatmap":     {"fr": "Heatmap cohorte",               "en": "Cohort heatmap"},
}

# The "premium intelligent" layer — features that define why premium is worth it.
# Chemin critique fait explicitement partie de cette couche intelligente.
PREMIUM_INTELLIGENT = [
    "adaptive_session", "full_critical_path", "spaced_repetition",
    "refresh_decay", "exam_simulator", "recommendations",
]


# ======================================================================
# PHASE 2 — Cloisonnement : résolution des périmètres (server-side)
# ======================================================================
def cohorts_where_trainer(session: Session, user_id: int) -> list[int]:
    """IDs des cohortes où l'utilisateur est formateur actif (filtre de périmètre)."""
    rows = session.exec(
        select(CohortMembership.cohort_id).where(
            CohortMembership.user_id == user_id,
            CohortMembership.role_in_cohort == "trainer",
            CohortMembership.status == "active",
        )
    ).all()
    return sorted(set(rows))


def cohort_learner_user_ids(session: Session, cohort_id: int) -> list[int]:
    """User IDs des apprenants actifs d'une cohorte."""
    rows = session.exec(
        select(CohortMembership.user_id).where(
            CohortMembership.cohort_id == cohort_id,
            CohortMembership.role_in_cohort == "learner",
            CohortMembership.status == "active",
        )
    ).all()
    return sorted(set(rows))


def org_of_cohort(session: Session, cohort_id: int) -> Optional[int]:
    c = session.exec(select(Cohort).where(Cohort.id == cohort_id)).first()
    return c.org_id if c else None


def cohorts_in_org(session: Session, org_id: int) -> list[int]:
    rows = session.exec(select(Cohort.id).where(Cohort.org_id == org_id,
                                                Cohort.status == "active")).all()
    return sorted(set(rows))


def learner_public_ids_for_cohort(session: Session, cohort_id: int) -> list[str]:
    """public_id (= learner_id) des apprenants d'une cohorte — pour brancher
    l'agrégation cockpit existante, qui travaille sur des learner_id."""
    uids = cohort_learner_user_ids(session, cohort_id)
    if not uids:
        return []
    users = session.exec(select(User).where(User.id.in_(uids))).all()
    return sorted(u.public_id for u in users)


# ======================================================================
# PHASE 2 — Seed de démonstration (Option A)
# ======================================================================
def seed_demo_cohort(session: Session, trainer_public_id: str = "formateur") -> dict:
    """Met en place une démo cloisonnée, idempotente :
    - une Organization "Démo"
    - une Cohort "PMP-2026-A"
    - y rattache TOUS les apprenants existants (learner_id non réservés) comme membres
    - rattache un formateur (public_id=trainer_public_id) comme trainer
    Permet de voir le cockpit cloisonné fonctionner sans écrans de gestion."""
    from .models import Mastery  # local import
    reserved = {"demo", "formateur", "trainer", "coach", trainer_public_id}

    # 1) organization
    org = session.exec(select(Organization).where(Organization.name == "Démo")).first()
    if not org:
        org = Organization(name="Démo", seats=100, status="active")
        session.add(org); session.commit(); session.refresh(org)

    # 2) cohort
    coh = session.exec(select(Cohort).where(Cohort.code == "PMP-2026-A")).first()
    if not coh:
        coh = Cohort(code="PMP-2026-A", org_id=org.id, name="Promotion de démonstration")
        session.add(coh); session.commit(); session.refresh(coh)

    # 3) trainer
    tu = get_or_create_user(session, trainer_public_id, "Formateur")
    has = session.exec(select(CohortMembership).where(
        CohortMembership.cohort_id == coh.id, CohortMembership.user_id == tu.id,
        CohortMembership.role_in_cohort == "trainer")).first()
    if not has:
        session.add(CohortMembership(cohort_id=coh.id, user_id=tu.id, role_in_cohort="trainer"))
        session.commit()

    # 4) learners = every existing non-reserved learner_id
    lids = set(r for r in session.exec(select(Mastery.learner_id).distinct()).all()
               if r and r not in reserved)
    added = 0
    for lid in sorted(lids):
        u = get_or_create_user(session, lid)
        exists = session.exec(select(CohortMembership).where(
            CohortMembership.cohort_id == coh.id, CohortMembership.user_id == u.id,
            CohortMembership.role_in_cohort == "learner")).first()
        if not exists:
            session.add(CohortMembership(cohort_id=coh.id, user_id=u.id, role_in_cohort="learner"))
            added += 1
    session.commit()
    return {"org_id": org.id, "cohort_id": coh.id, "cohort_code": coh.code,
            "trainer": trainer_public_id, "learners_linked": added, "learners_total": len(lids)}


# ======================================================================
# PHASE 2 — Étape 10 : TargetedSession + TargetedSessionAssignment (spec §2.9/2.9b)
# ======================================================================
class TargetedSession(SQLModel, table=True):
    """Une séance ciblée composée par un formateur pour sa cohorte."""
    id: Optional[int] = Field(default=None, primary_key=True)
    cohort_id: int = Field(index=True, foreign_key="cohort.id")
    created_by: int = Field(index=True, foreign_key="user.id")   # le formateur
    title: str = ""
    objective: str = ""
    selected_concepts: str = "[]"          # JSON list[str] d'areas (portable)
    selected_items: str = "[]"             # JSON list[str] d'external_id — la sélection FIGÉE vue en aperçu
    question_count: int = 10
    assigned_to: str = "cohort"            # cohort | group | selected_learners
    status: str = "assigned"               # draft | assigned | completed
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TargetedSessionAssignment(SQLModel, table=True):
    """Qui doit faire la séance — et qui l'a terminée (spec §2.9b)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(index=True, foreign_key="targetedsession.id")
    learner_id: int = Field(index=True, foreign_key="user.id")
    status: str = "assigned"               # assigned | started | completed
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)


def create_targeted_session(session: Session, trainer_public_id: str, cohort_id: int,
                            title: str, concepts: list, question_count: int = 10,
                            objective: str = "", item_ids: Optional[list] = None,
                            learner_public_ids: Optional[list] = None) -> dict:
    """Crée une séance ciblée et l'assigne aux apprenants actifs de la cohorte.
    Si learner_public_ids est fourni (v36), seuls CES apprenants la reçoivent —
    chaque id est validé côté serveur comme membre actif de la cohorte
    (cloisonnement : impossible d'assigner hors de sa cohorte).
    Si item_ids est fourni (validé en aperçu par le formateur), la sélection est FIGÉE :
    l'apprenant recevra exactement ces questions. Cloisonnement vérifié."""
    import json as _json
    tu = session.exec(select(User).where(User.public_id == trainer_public_id)).first()
    if not tu:
        return {"error": "unknown_trainer"}
    if cohort_id not in cohorts_where_trainer(session, tu.id):
        return {"error": "not_your_cohort"}   # server-side scoping, spec §1.5
    member_ids = cohort_learner_user_ids(session, cohort_id)
    target_ids = member_ids
    assigned_to = "cohort"
    if learner_public_ids:
        wanted = {str(p) for p in learner_public_ids if p}
        users = session.exec(select(User).where(User.public_id.in_(wanted))).all() if wanted else []
        member_set = set(member_ids)
        target_ids = sorted(u.id for u in users if u.id in member_set)
        if not target_ids:
            return {"error": "no_valid_learners",
                    "message_fr": "Aucun des destinataires sélectionnés n'appartient à votre cohorte.",
                    "message_en": "None of the selected recipients belong to your cohort."}
        assigned_to = "selected_learners"
    ts = TargetedSession(cohort_id=cohort_id, created_by=tu.id, title=title[:200],
                         objective=(objective or "")[:400],
                         selected_concepts=_json.dumps(list(concepts or [])),
                         selected_items=_json.dumps(list(item_ids or [])),
                         question_count=int(question_count or 10),
                         assigned_to=assigned_to, status="assigned")
    session.add(ts); session.commit(); session.refresh(ts)
    for uid in target_ids:
        session.add(TargetedSessionAssignment(session_id=ts.id, learner_id=uid))
    session.commit()
    return {"session_id": ts.id, "title": ts.title, "concepts": list(concepts or []),
            "question_count": ts.question_count, "assigned_count": len(target_ids),
            "assigned_to": assigned_to}


def sessions_for_cohort(session: Session, cohort_id: int) -> list[dict]:
    """Les séances ciblées d'une cohorte, avec l'avancement (X/N terminées)."""
    import json as _json
    out = []
    rows = session.exec(select(TargetedSession).where(TargetedSession.cohort_id == cohort_id)
                        .order_by(TargetedSession.created_at.desc())).all()
    for ts in rows:
        asg = session.exec(select(TargetedSessionAssignment)
                           .where(TargetedSessionAssignment.session_id == ts.id)).all()
        done = sum(1 for a in asg if a.status == "completed")
        out.append({"id": ts.id, "title": ts.title,
                    "concepts": _json.loads(ts.selected_concepts or "[]"),
                    "question_count": ts.question_count, "status": ts.status,
                    "assigned": len(asg), "completed": done,
                    "created_at": ts.created_at.isoformat()})
    return out


# ======================================================================
# v34 — TrainerItem : questions créées par les formateurs (boîte à outils d'édition)
# ======================================================================
# Périmètre VOLONTAIREMENT limité (décision produit v34) :
# - Les questions formateur vivent UNIQUEMENT dans les séances ciblées et la
#   banque de leurs cohortes. Elles n'entrent JAMAIS dans le moteur adaptatif
#   global ni dans le contenu servi aux autres organisations (cloisonnement).
# - Pas de traduction imposée : le formateur écrit dans sa langue.
# - Un vrai outil d'auteur (brouillons, versions, relecture) viendra plus tard
#   si le besoin se confirme — ne pas sur-construire maintenant.
TRAINER_ITEM_PREFIX = "trainer-"


class TrainerItem(SQLModel, table=True):
    """Une question rédigée par un formateur, cloisonnée à son organisation."""
    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: str = Field(index=True)            # "trainer-<hex>" — espace de noms distinct de la banque
    org_id: int = Field(index=True, foreign_key="organization.id")
    created_by: int = Field(index=True, foreign_key="user.id")
    knowledge_area: str = Field(index=True)
    difficulty: int = 2                              # 1..3
    prompt: str = ""
    options: str = "[]"                              # JSON list[str] (4 réponses)
    answer_index: int = 0
    rationale: str = ""
    lang: str = "fr"                                 # langue d'écriture (pas de traduction imposée)
    status: str = "active"                           # active | archived
    created_at: datetime = Field(default_factory=datetime.utcnow)


def trainer_org_ids(session: Session, user_id: int) -> list[int]:
    """Organisations où l'utilisateur est formateur actif (via ses cohortes)."""
    orgs = set()
    for cid in cohorts_where_trainer(session, user_id):
        oid = org_of_cohort(session, cid)
        if oid:
            orgs.add(oid)
    return sorted(orgs)


def create_trainer_item(session: Session, trainer_public_id: str, *, knowledge_area: str,
                        prompt: str, options: list, answer_index: int,
                        rationale: str = "", difficulty: int = 2, lang: str = "fr") -> dict:
    """Crée une question formateur, cloisonnée à SON organisation. Validation stricte."""
    import json as _json, uuid as _uuid
    tu = session.exec(select(User).where(User.public_id == trainer_public_id)).first()
    if not tu:
        return {"error": "unknown_trainer"}
    orgs = trainer_org_ids(session, tu.id)
    if not orgs:
        return {"error": "no_cohort"}
    prompt = (prompt or "").strip()
    opts = [str(o or "").strip() for o in (options or [])]
    if not prompt or len(opts) != 4 or any(not o for o in opts):
        return {"error": "invalid_question",
                "message_fr": "L'énoncé et les quatre réponses sont requis.",
                "message_en": "The statement and all four answers are required."}
    try:
        ai = int(answer_index)
    except (TypeError, ValueError):
        ai = -1
    if ai not in (0, 1, 2, 3):
        return {"error": "invalid_answer_index",
                "message_fr": "Veuillez indiquer la bonne réponse.",
                "message_en": "Please mark the correct answer."}
    diff = int(difficulty) if str(difficulty) in ("1", "2", "3") else 2
    ti = TrainerItem(external_id=TRAINER_ITEM_PREFIX + _uuid.uuid4().hex[:12],
                     org_id=orgs[0], created_by=tu.id,
                     knowledge_area=(knowledge_area or "").strip() or "integration",
                     difficulty=diff, prompt=prompt[:2000],
                     options=_json.dumps(opts), answer_index=ai,
                     rationale=(rationale or "").strip()[:2000],
                     lang=(lang if lang in ("fr", "en") else "fr"))
    session.add(ti); session.commit(); session.refresh(ti)
    return {"item": trainer_item_public(session, ti)}


def trainer_item_public(session: Session, ti: TrainerItem) -> dict:
    """Forme publique d'une question formateur — même contrat que les items de la
    banque (prompt/options bilingues : le texte d'auteur sert les deux langues)."""
    import json as _json
    opts = _json.loads(ti.options or "[]")
    author = session.exec(select(User).where(User.id == ti.created_by)).first()
    return {"external_id": ti.external_id, "area": ti.knowledge_area,
            "type": "mcq", "difficulty": ti.difficulty,
            "prompt": {"fr": ti.prompt, "en": ti.prompt},
            "options": {"fr": opts, "en": opts},
            "trainer_authored": True, "author": (author.name if author else ""),
            "lang": ti.lang}


def trainer_items_for_orgs(session: Session, org_ids: list[int]) -> list[TrainerItem]:
    if not org_ids:
        return []
    return session.exec(select(TrainerItem).where(TrainerItem.org_id.in_(org_ids),
                                                  TrainerItem.status == "active")).all()


def trainer_items_by_external_ids(session: Session, ids: list[str]) -> dict:
    """Résolution des identifiants 'trainer-…' (pour la sélection figée d'une séance)."""
    wanted = [i for i in (ids or []) if isinstance(i, str) and i.startswith(TRAINER_ITEM_PREFIX)]
    if not wanted:
        return {}
    rows = session.exec(select(TrainerItem).where(TrainerItem.external_id.in_(wanted))).all()
    return {r.external_id: r for r in rows}


# ======================================================================
# v35 — Étape 11 : Invitations par lien (spec §2.5, option A sans envoi d'email)
# ======================================================================
# Chaque invitation = UN lien personnel, unique et à usage unique.
# Le formateur crée les liens (en lot : noms et/ou emails collés tels quels)
# et les envoie lui-même par le canal de son choix. L'email est stocké :
# quand l'auth lien magique arrivera, l'envoi automatique se branchera dessus.
import secrets as _secrets


class Invitation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(index=True, unique=True)          # secret d'URL, usage unique
    cohort_id: int = Field(index=True, foreign_key="cohort.id")
    org_id: int = Field(index=True)
    role: str = "learner"                                 # learner | trainer
    name: str = ""                                        # nom suggéré (facultatif)
    email: str = ""                                       # facultatif (option A)
    status: str = "pending"                               # pending | accepted | revoked
    created_by: int = Field(index=True, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    accepted_at: Optional[datetime] = Field(default=None)
    accepted_by: Optional[int] = Field(default=None)      # User.id une fois acceptée


def _invitation_public(inv: Invitation, cohort_code: str) -> dict:
    return {"id": inv.id, "token": inv.token, "cohort_code": cohort_code,
            "role": inv.role, "name": inv.name, "email": inv.email,
            "status": inv.status,
            "created_at": inv.created_at.isoformat(),
            "accepted_at": inv.accepted_at.isoformat() if inv.accepted_at else None}


def create_invitations(session: Session, trainer_public_id: str, entries: list) -> dict:
    """Crée une invitation PAR entrée {name?, email?, role?} — cloisonné à la
    première cohorte du formateur (même convention MVP que les séances ciblées)."""
    tu = session.exec(select(User).where(User.public_id == trainer_public_id)).first()
    if not tu:
        return {"error": "unknown_trainer"}
    cohorts = cohorts_where_trainer(session, tu.id)
    if not cohorts:
        return {"error": "no_cohort"}
    cohort_id = cohorts[0]
    coh = session.exec(select(Cohort).where(Cohort.id == cohort_id)).first()
    created = []
    for e in (entries or [])[:200]:                        # garde-fou anti-abus
        name = str((e or {}).get("name", "") or "").strip()[:120]
        email = str((e or {}).get("email", "") or "").strip()[:200]
        role = (e or {}).get("role", "learner")
        role = role if role in ("learner", "trainer") else "learner"
        if not name and not email and created:
            continue                                       # entrées vides ignorées (sauf 1re volontaire)
        inv = Invitation(token=_secrets.token_urlsafe(9), cohort_id=cohort_id,
                         org_id=coh.org_id, role=role, name=name, email=email,
                         created_by=tu.id)
        session.add(inv); session.commit(); session.refresh(inv)
        created.append(_invitation_public(inv, coh.code))
    return {"created": created, "cohort_code": coh.code}


def invitations_for_trainer(session: Session, trainer_public_id: str) -> list:
    """Les invitations des cohortes du formateur (cloisonné), récentes d'abord."""
    tu = session.exec(select(User).where(User.public_id == trainer_public_id)).first()
    if not tu:
        return []
    out = []
    for cid in cohorts_where_trainer(session, tu.id):
        coh = session.exec(select(Cohort).where(Cohort.id == cid)).first()
        rows = session.exec(select(Invitation).where(Invitation.cohort_id == cid)
                            .order_by(Invitation.created_at.desc())).all()
        out.extend(_invitation_public(r, coh.code if coh else "") for r in rows)
    return out


def revoke_invitation(session: Session, trainer_public_id: str, invitation_id: int) -> dict:
    """Révoque une invitation EN ATTENTE d'une de SES cohortes (cloisonné)."""
    tu = session.exec(select(User).where(User.public_id == trainer_public_id)).first()
    if not tu:
        return {"error": "unknown_trainer"}
    inv = session.exec(select(Invitation).where(Invitation.id == invitation_id)).first()
    if not inv or inv.cohort_id not in cohorts_where_trainer(session, tu.id):
        return {"error": "not_your_invitation"}
    if inv.status != "pending":
        return {"error": "not_pending"}
    inv.status = "revoked"
    session.add(inv); session.commit()
    return {"ok": True, "id": inv.id, "status": inv.status}


def invitation_info(session: Session, token: str) -> dict:
    """Consultation publique d'un lien : ne révèle QUE le code cohorte, le nom
    suggéré et l'état — jamais l'organisation ni les autres invités."""
    inv = session.exec(select(Invitation).where(Invitation.token == token)).first()
    if not inv:
        return {"error": "invalid_invitation"}
    coh = session.exec(select(Cohort).where(Cohort.id == inv.cohort_id)).first()
    return {"cohort_code": coh.code if coh else "", "name": inv.name,
            "role": inv.role, "status": inv.status}


def _free_public_id(session: Session, base: str) -> str:
    """Slug libre : base, base-2, base-3… (ne réutilise jamais un id existant)."""
    import re as _re
    slug = _re.sub(r"[^a-z0-9]+", "-", (base or "").lower()).strip("-")[:40] or ("u%d" % int(datetime.utcnow().timestamp()))
    cand, n = slug, 1
    while session.exec(select(User).where(User.public_id == cand)).first():
        n += 1
        cand = f"{slug}-{n}"
    return cand


def accept_invitation(session: Session, token: str, name: str = "",
                      existing_public_id: str = "") -> dict:
    """Accepte un lien : usage unique. Crée l'identité (ou rattache le profil
    existant, progression conservée) + l'appartenance à la cohorte. Vérifie le
    quota de licences de l'organisation (souple : seulement si seats > 0)."""
    inv = session.exec(select(Invitation).where(Invitation.token == token)).first()
    if not inv:
        return {"error": "invalid_invitation"}
    if inv.status == "revoked":
        return {"error": "revoked"}
    if inv.status == "accepted":
        return {"error": "already_used"}
    coh = session.exec(select(Cohort).where(Cohort.id == inv.cohort_id)).first()
    org = session.exec(select(Organization).where(Organization.id == inv.org_id)).first()

    # quota de licences (souple) — uniquement pour les apprenants
    if inv.role == "learner" and org and org.seats and org.seats > 0:
        used = set()
        for cid in cohorts_in_org(session, org.id):
            used.update(cohort_learner_user_ids(session, cid))
        if len(used) >= org.seats:
            return {"error": "seats_exhausted",
                    "message_fr": "Toutes les places de cette organisation sont utilisées. Veuillez contacter votre formateur.",
                    "message_en": "All seats for this organisation are in use. Please contact your trainer."}

    # identité : profil existant (progression conservée) ou nouveau
    u = None
    if existing_public_id:
        u = session.exec(select(User).where(User.public_id == existing_public_id)).first()
    if u is None:
        display = (name or inv.name or "").strip()
        if not display:
            return {"error": "name_required",
                    "message_fr": "Veuillez saisir votre nom pour rejoindre la cohorte.",
                    "message_en": "Please enter your name to join the cohort."}
        pid = _free_public_id(session, display)
        u = User(public_id=pid, name=display[:120],
                 email=inv.email or None, created_from="invitation")
        session.add(u); session.commit(); session.refresh(u)
        session.add(UserRole(user_id=u.id, role="learner", scope_type="platform"))
        session.commit()

    # appartenance (idempotente) au rôle porté par l'invitation
    has = session.exec(select(CohortMembership).where(
        CohortMembership.cohort_id == inv.cohort_id, CohortMembership.user_id == u.id,
        CohortMembership.role_in_cohort == inv.role)).first()
    if not has:
        session.add(CohortMembership(cohort_id=inv.cohort_id, user_id=u.id,
                                     role_in_cohort=inv.role))
        session.commit()

    inv.status = "accepted"
    inv.accepted_at = datetime.utcnow()
    inv.accepted_by = u.id
    if not inv.name:
        inv.name = u.name
    session.add(inv); session.commit()
    return {"ok": True, "learner_id": u.public_id, "name": u.name,
            "cohort_code": coh.code if coh else "", "role": inv.role}


# ======================================================================
# v37 — Code de classe (rejoindre une cohorte en libre-service) + email de récupération
# ======================================================================
# Décisions verrouillées : le code de classe EST le code de cohorte (ex. PMP-2026-A) ;
# une cohorte active est rejoignable en permanence (pas d'interrupteur formateur).
# L'email est FACULTATIF : le nom reste l'identité de départ, l'email est un
# rattachement de récupération (multi-appareils, lien magique v38). Stocké dès v37.
def cohort_by_code(session: Session, code: str) -> Optional["Cohort"]:
    """Résout un code de classe (insensible à la casse/espaces) vers une cohorte active."""
    c = (code or "").strip().upper()
    if not c:
        return None
    for coh in session.exec(select(Cohort).where(Cohort.status == "active")).all():
        if (coh.code or "").strip().upper() == c:
            return coh
    return None


def class_code_info(session: Session, code: str) -> dict:
    """Consultation publique d'un code de classe : ne révèle QUE le code normalisé
    et son existence — jamais l'organisation ni la liste des membres."""
    coh = cohort_by_code(session, code)
    if not coh:
        return {"error": "invalid_code"}
    return {"cohort_code": coh.code, "found": True}


def join_by_class_code(session: Session, code: str, name: str = "",
                       existing_public_id: str = "", email: str = "") -> dict:
    """Rejoindre une cohorte via son code de classe (libre-service, permanent).
    Crée l'identité (ou rattache un profil existant → progression conservée) et
    l'appartenance apprenant. Respecte le quota de licences (souple)."""
    coh = cohort_by_code(session, code)
    if not coh:
        return {"error": "invalid_code",
                "message_fr": "Ce code de classe est introuvable. Vérifiez auprès de votre formateur.",
                "message_en": "This class code was not found. Please check with your trainer."}
    org = session.exec(select(Organization).where(Organization.id == coh.org_id)).first()

    # profil existant (progression conservée) ou nouveau
    u = None
    if existing_public_id:
        u = session.exec(select(User).where(User.public_id == existing_public_id)).first()
    if u is None:
        display = (name or "").strip()
        if not display:
            return {"error": "name_required",
                    "message_fr": "Veuillez saisir votre nom pour rejoindre la classe.",
                    "message_en": "Please enter your name to join the class."}

    # quota de licences (souple) — seulement si l'apprenant n'est pas déjà membre
    already = False
    if u is not None:
        already = u.id in cohort_learner_user_ids(session, coh.id)
    if not already and org and org.seats and org.seats > 0:
        used = set()
        for cid in cohorts_in_org(session, org.id):
            used.update(cohort_learner_user_ids(session, cid))
        if len(used) >= org.seats:
            return {"error": "seats_exhausted",
                    "message_fr": "Toutes les places de cette organisation sont utilisées. Veuillez contacter votre formateur.",
                    "message_en": "All seats for this organisation are in use. Please contact your trainer."}

    if u is None:
        pid = _free_public_id(session, display)
        u = User(public_id=pid, name=display[:120],
                 email=(email.strip() or None), created_from="class_code")
        session.add(u); session.commit(); session.refresh(u)
        session.add(UserRole(user_id=u.id, role="learner", scope_type="platform"))
        session.commit()
    elif email and not u.email:
        u.email = email.strip()
        session.add(u); session.commit()

    # appartenance apprenant (idempotente)
    has = session.exec(select(CohortMembership).where(
        CohortMembership.cohort_id == coh.id, CohortMembership.user_id == u.id,
        CohortMembership.role_in_cohort == "learner")).first()
    if not has:
        session.add(CohortMembership(cohort_id=coh.id, user_id=u.id,
                                     role_in_cohort="learner"))
        session.commit()

    return {"ok": True, "learner_id": u.public_id, "name": u.name,
            "cohort_code": coh.code}


def link_email(session: Session, public_id: str, email: str) -> dict:
    """Lie un email de récupération à un profil (facultatif). Un même email ne
    peut pas être rattaché à deux profils différents (source de confusion)."""
    e = (email or "").strip()
    if not _valid_email(e):
        return {"error": "invalid_email",
                "message_fr": "Veuillez saisir une adresse email valide.",
                "message_en": "Please enter a valid email address."}
    u = session.exec(select(User).where(User.public_id == public_id)).first()
    if not u:
        return {"error": "unknown_user"}
    clash = session.exec(select(User).where(User.email == e)).first()
    if clash and clash.id != u.id:
        return {"error": "email_taken",
                "message_fr": "Cet email est déjà lié à un autre profil.",
                "message_en": "This email is already linked to another profile."}
    u.email = e
    session.add(u); session.commit()
    return {"ok": True, "email": e}


def _valid_email(e: str) -> bool:
    import re as _re
    return bool(_re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", (e or "").strip()))


# ======================================================================
# v38 — Lien magique (reconnexion par email, sans mot de passe)
# ======================================================================
# Jeton signé HMAC (public_id + expiration), sans table dédiée. À usage unique
# de fait : l'action côté client remplace l'identité locale ; le jeton expire vite.
import hmac as _hmac, hashlib as _hashlib, base64 as _b64, time as _time, json as _json2

_MAGIC_TTL = 30 * 60   # 30 minutes


def _b64e(raw: bytes) -> str:
    return _b64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64d(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return _b64.urlsafe_b64decode(s + pad)


def _sign(payload_b64: str) -> str:
    from .config import settings as _st
    secret = (_st.magic_link_secret or "dev").encode()
    sig = _hmac.new(secret, payload_b64.encode(), _hashlib.sha256).digest()
    return _b64e(sig)


def make_magic_token(public_id: str) -> str:
    payload = {"pid": public_id, "exp": int(_time.time()) + _MAGIC_TTL}
    payload_b64 = _b64e(_json2.dumps(payload, separators=(",", ":")).encode())
    return f"{payload_b64}.{_sign(payload_b64)}"


def verify_magic_token(token: str) -> dict:
    """Vérifie la signature + l'expiration. Renvoie {ok, public_id} ou {error}."""
    try:
        payload_b64, sig = (token or "").split(".", 1)
    except ValueError:
        return {"error": "invalid_token"}
    if not _hmac.compare_digest(sig, _sign(payload_b64)):
        return {"error": "invalid_token"}
    try:
        payload = _json2.loads(_b64d(payload_b64))
    except Exception:
        return {"error": "invalid_token"}
    if int(payload.get("exp", 0)) < int(_time.time()):
        return {"error": "expired"}
    return {"ok": True, "public_id": payload.get("pid", "")}


def user_by_email(session: Session, email: str) -> Optional["User"]:
    e = (email or "").strip()
    if not e:
        return None
    return session.exec(select(User).where(User.email == e)).first()


def resolve_magic_token(session: Session, token: str) -> dict:
    """Résout un jeton magique en identité, si l'utilisateur existe toujours."""
    v = verify_magic_token(token)
    if v.get("error"):
        return v
    u = session.exec(select(User).where(User.public_id == v["public_id"])).first()
    if not u:
        return {"error": "invalid_token"}
    return {"ok": True, "learner_id": u.public_id, "name": u.name,
            "role": _primary_role(session, u.id)}


def _primary_role(session: Session, user_id: int) -> str:
    """Renvoie 'trainer' si l'utilisateur est formateur d'au moins une cohorte."""
    return "trainer" if cohorts_where_trainer(session, user_id) else "learner"


# ======================================================================
# v41 — Bascule de plan pour les tests (RÉSERVÉE AUX FORMATEURS)
# ======================================================================
# Pourquoi restreinte : l'app est déjà en production. Une bascule libre
# laisserait n'importe quel apprenant se donner le premium — et ruinerait la
# crédibilité du modèle devant un client institutionnel.
# Le formateur (et plus tard le super-admin) peut basculer SON PROPRE profil,
# pour vérifier les fonctions premium. Jamais celui d'un autre.
def is_trainer(session: Session, public_id: str) -> bool:
    u = session.exec(select(User).where(User.public_id == public_id)).first()
    if not u:
        return False
    return bool(cohorts_where_trainer(session, u.id))


def set_test_plan(session: Session, public_id: str, plan: str) -> dict:
    """Bascule le plan effectif de SON PROPRE profil (formateur uniquement).

    'premium' → crée un entitlement admin_grant sans échéance.
    'free'    → annule les entitlements admin_grant (laisse intacts les droits
                réels : institution, achat…, qu'on ne touche jamais).
    """
    if plan not in ("free", "premium"):
        return {"error": "bad_plan"}
    u = session.exec(select(User).where(User.public_id == public_id)).first()
    if not u:
        return {"error": "unknown_user"}
    if not is_trainer(session, public_id):
        # Un apprenant ne peut pas s'auto-promouvoir. Réponse volontairement sobre.
        return {"error": "forbidden",
                "message_fr": "Cette action est réservée au formateur.",
                "message_en": "This action is restricted to trainers."}

    grants = session.exec(select(Entitlement).where(
        Entitlement.user_id == u.id, Entitlement.source == "admin_grant")).all()

    if plan == "premium":
        active = [e for e in grants if e.status == "active"]
        if not active:
            session.add(Entitlement(user_id=u.id, source="admin_grant",
                                    plan="premium", status="active"))
            session.commit()
    else:
        for e in grants:
            if e.status == "active":
                e.status = "cancelled"
                session.add(e)
        session.commit()

    return {"ok": True, "effective_plan": effective_plan(session, u.id)}


# ======================================================================
# v41 — Suppression de compte : droit à l'effacement (RGPD art. 17 / loi 18-07)
# ======================================================================
# Modèle retenu (validé par Zoubir) :
#   1. l'apprenant télécharge ses données (portabilité) — géré côté API export ;
#   2. il confirme (saisie du mot SUPPRIMER, côté UI) ;
#   3. le compte est DÉSACTIVÉ, pas encore effacé → délai de grâce de 30 jours,
#      pendant lequel il peut TOUT récupérer d'un clic ;
#   4. passé le délai, effacement définitif et irréversible.
# Le délai de grâce n'entrave pas le droit à l'effacement : il le sécurise contre
# l'erreur. Un effacement immédiat reste possible sur demande (contact@certifizer.app).
#
# Seul l'apprenant peut supprimer son compte. Un formateur ne peut effacer personne.
GRACE_DAYS = 30


def request_deletion(session: Session, public_id: str) -> dict:
    """Marque le compte pour suppression. Le compte devient inutilisable et
    invisible du formateur, mais rien n'est encore effacé."""
    u = session.exec(select(User).where(User.public_id == public_id)).first()
    if not u:
        return {"error": "unknown_user"}
    if u.deletion_requested_at:
        return {"ok": True, "already": True,
                "deletion_requested_at": u.deletion_requested_at.isoformat(),
                "purge_at": (u.deletion_requested_at + timedelta(days=GRACE_DAYS)).isoformat()}
    now = datetime.utcnow()
    u.deletion_requested_at = now
    session.add(u)
    session.commit()
    return {"ok": True,
            "deletion_requested_at": now.isoformat(),
            "purge_at": (now + timedelta(days=GRACE_DAYS)).isoformat(),
            "grace_days": GRACE_DAYS}


def cancel_deletion(session: Session, public_id: str) -> dict:
    """Annule la suppression pendant le délai de grâce — tout est récupéré."""
    u = session.exec(select(User).where(User.public_id == public_id)).first()
    if not u:
        return {"error": "unknown_user"}
    u.deletion_requested_at = None
    session.add(u)
    session.commit()
    return {"ok": True, "restored": True}


def deletion_status(session: Session, public_id: str) -> dict:
    """L'état de suppression d'un compte : ni demandée, en grâce, ou à purger."""
    u = session.exec(select(User).where(User.public_id == public_id)).first()
    if not u:
        return {"error": "unknown_user"}
    if not u.deletion_requested_at:
        return {"pending": False}
    purge_at = u.deletion_requested_at + timedelta(days=GRACE_DAYS)
    days_left = max(0, (purge_at - datetime.utcnow()).days)
    return {"pending": True,
            "deletion_requested_at": u.deletion_requested_at.isoformat(),
            "purge_at": purge_at.isoformat(),
            "days_left": days_left,
            "grace_days": GRACE_DAYS}


def purge_account(session: Session, public_id: str) -> dict:
    """EFFACEMENT DÉFINITIF. Supprime réellement toutes les données de la personne.

    Appelé (a) automatiquement après le délai de grâce, (b) sur demande explicite
    d'effacement immédiat. Irréversible — d'où la double barrière en amont.
    """
    from .models import (Mastery, ProcessMastery, Attempt, Reflexe, Flag,
                         MissedQueue, ReadinessSnapshot)

    u = session.exec(select(User).where(User.public_id == public_id)).first()
    if not u:
        return {"error": "unknown_user"}
    uid, pid = u.id, u.public_id
    erased = {}

    # 1) données d'apprentissage (indexées par public_id)
    for model, label in ((Mastery, "mastery"), (ProcessMastery, "process_mastery"),
                         (Attempt, "attempts"), (Reflexe, "reflexes"),
                         (Flag, "flags"), (MissedQueue, "missed"),
                         (ReadinessSnapshot, "snapshots")):
        rows = session.exec(select(model).where(model.learner_id == pid)).all()
        for r in rows:
            session.delete(r)
        erased[label] = len(rows)

    # 2) données de compte (indexées par user.id)
    for model, label in ((CohortMembership, "memberships"), (UserRole, "roles"),
                         (Entitlement, "entitlements"), (DailyUsage, "usage")):
        rows = session.exec(select(model).where(model.user_id == uid)).all()
        for r in rows:
            session.delete(r)
        erased[label] = len(rows)

    # 2b) séances qui lui étaient assignées (ici learner_id est un User.id)
    assigns = session.exec(select(TargetedSessionAssignment).where(
        TargetedSessionAssignment.learner_id == uid)).all()
    for a in assigns:
        session.delete(a)
    erased["assignments"] = len(assigns)

    # 3) invitations le concernant — elles portent son nom et son email
    invs = session.exec(select(Invitation).where(Invitation.accepted_by == uid)).all()
    if u.email:
        by_mail = session.exec(select(Invitation).where(Invitation.email == u.email)).all()
        seen = {i.id for i in invs}
        invs += [i for i in by_mail if i.id not in seen]
    for i in invs:
        session.delete(i)
    erased["invitations"] = len(invs)

    # 4) l'identité elle-même — en dernier
    session.delete(u)
    session.commit()
    return {"ok": True, "erased": erased, "public_id": pid}


def purge_expired_accounts(session: Session) -> dict:
    """Efface les comptes dont le délai de grâce est écoulé. Idempotent."""
    cutoff = datetime.utcnow() - timedelta(days=GRACE_DAYS)
    due = session.exec(select(User).where(
        User.deletion_requested_at != None,          # noqa: E711
        User.deletion_requested_at <= cutoff)).all()
    purged = []
    for u in due:
        pid = u.public_id
        purge_account(session, pid)
        purged.append(pid)
    return {"ok": True, "purged": purged, "count": len(purged)}


def unlink_email(session: Session, public_id: str) -> dict:
    """Retire l'email de récupération. L'email est FACULTATIF (décision verrouillée) :
    on doit donc pouvoir le retirer, pas seulement l'ajouter. Conséquence assumée :
    plus de lien magique possible — l'apprenant en est averti côté interface."""
    u = session.exec(select(User).where(User.public_id == public_id)).first()
    if not u:
        return {"error": "unknown_user"}
    u.email = None
    session.add(u); session.commit()
    return {"ok": True, "email": None}
