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
from datetime import datetime, date

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
                            objective: str = "", item_ids: Optional[list] = None) -> dict:
    """Crée une séance ciblée et l'assigne à tous les apprenants actifs de la cohorte.
    Si item_ids est fourni (validé en aperçu par le formateur), la sélection est FIGÉE :
    l'apprenant recevra exactement ces questions. Cloisonnement vérifié."""
    import json as _json
    tu = session.exec(select(User).where(User.public_id == trainer_public_id)).first()
    if not tu:
        return {"error": "unknown_trainer"}
    if cohort_id not in cohorts_where_trainer(session, tu.id):
        return {"error": "not_your_cohort"}   # server-side scoping, spec §1.5
    ts = TargetedSession(cohort_id=cohort_id, created_by=tu.id, title=title[:200],
                         objective=(objective or "")[:400],
                         selected_concepts=_json.dumps(list(concepts or [])),
                         selected_items=_json.dumps(list(item_ids or [])),
                         question_count=int(question_count or 10),
                         assigned_to="cohort", status="assigned")
    session.add(ts); session.commit(); session.refresh(ts)
    learner_ids = cohort_learner_user_ids(session, cohort_id)
    for uid in learner_ids:
        session.add(TargetedSessionAssignment(session_id=ts.id, learner_id=uid))
    session.commit()
    return {"session_id": ts.id, "title": ts.title, "concepts": list(concepts or []),
            "question_count": ts.question_count, "assigned_count": len(learner_ids)}


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
