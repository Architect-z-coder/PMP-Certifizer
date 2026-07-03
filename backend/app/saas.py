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
