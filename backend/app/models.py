from typing import Optional
from datetime import datetime, timezone

from sqlmodel import SQLModel, Field, create_engine, Session, text

from .config import settings


class Item(SQLModel, table=True):
    """A curated question (bilingual). Loaded from app/data/*.json bank files."""
    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: str = Field(index=True)        # e.g. "int-d2-01" (stable id for upsert)
    type: str = "mcq"                            # mcq | scenario
    knowledge_area: str = Field(index=True)
    process_group: str = ""
    pmbok_ref: str = ""
    competency: str = ""
    difficulty: int = 1                          # 1..3
    prompt_fr: str = ""
    prompt_en: str = ""
    options_fr: str = "[]"                        # JSON-encoded list[str]
    options_en: str = "[]"                        # JSON-encoded list[str]
    answer_index: int = 0
    rationale_fr: str = ""
    rationale_en: str = ""
    source_note: str = ""


class Attempt(SQLModel, table=True):
    """One graded answer by one learner."""
    id: Optional[int] = Field(default=None, primary_key=True)
    learner_id: str = Field(index=True)
    knowledge_area: str = Field(index=True)
    item_external_id: Optional[str] = Field(default=None, index=True)
    result: str                                   # correct | partial | incorrect
    mode: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Mastery(SQLModel, table=True):
    """Rolled-up mastery per learner x knowledge area (EWMA)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    learner_id: str = Field(index=True)
    knowledge_area: str = Field(index=True)
    score: float = 0.0
    attempts: int = 0
    # last_practiced_at feeds the non-punitive freshness / maintenance logic.
    # Nullable + defaulted so existing rows keep working (additive migration).
    last_practiced_at: Optional[datetime] = Field(default=None)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MissedQueue(SQLModel, table=True):
    """Spaced-repetition queue for items a learner got wrong.
    review_stage 0->1->2->3, intervals 1d, 3d, 7d, then resolved."""
    id: Optional[int] = Field(default=None, primary_key=True)
    learner_id: str = Field(index=True)
    item_external_id: str = Field(index=True)
    knowledge_area: str = Field(index=True)
    miss_count: int = 1
    review_stage: int = 0
    next_review_at: datetime = Field(default_factory=datetime.utcnow)
    resolved: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProcessMastery(SQLModel, table=True):
    """Rolled-up mastery per learner x process (PMBOK ref, e.g. '4.1'), EWMA."""
    id: Optional[int] = Field(default=None, primary_key=True)
    learner_id: str = Field(index=True)
    pmbok_ref: str = Field(index=True)
    knowledge_area: str = Field(index=True)
    score: float = 0.0
    attempts: int = 0
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ReadinessSnapshot(SQLModel, table=True):
    """v40 — Instantané de la préparation, au plus un par jour et par apprenant.

    Alimente la trajectoire et la projection du portrait d'apprentissage.
    Table ajoutée (migration additive) : les données existantes ne bougent pas.
    Sans historique, le portrait affiche simplement « la trajectoire se dessine ».
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    learner_id: str = Field(index=True)
    readiness: float = 0.0
    day: str = Field(index=True, default="")   # YYYY-MM-DD — une entrée par jour
    at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Reflexe(SQLModel, table=True):
    """A transferable judgement heuristic the learner saved from a Cas réel session."""
    id: Optional[int] = Field(default=None, primary_key=True)
    learner_id: str = Field(index=True)
    seat: str = ""          # moa | moe | both
    text: str = ""
    case_excerpt: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Flag(SQLModel, table=True):
    """A learner-reported issue on a question (quality review loop)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    learner_id: str = Field(index=True)
    item_external_id: str = Field(index=True)
    reason: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Database engine -------------------------------------------------------
# Normalize the scheme: SQLAlchemy 2.x rejects the old "postgres://" form that
# some providers still hand out; rewrite it to "postgresql://".
_db_url = settings.database_url
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

if _db_url.startswith("sqlite"):
    engine = create_engine(
        _db_url, echo=False, connect_args={"check_same_thread": False}
    )
else:
    # Postgres (e.g. Supabase). On a host that sleeps (Render free tier) the
    # pooler drops idle connections, so verify each connection before use and
    # recycle periodically; require TLS (Supabase enforces it).
    engine = create_engine(
        _db_url,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=1800,
        connect_args={"sslmode": "require", "connect_timeout": 10},
    )


def _ensure_columns() -> None:
    """Additive, idempotent migrations for columns that create_all() won't add to
    tables that already exist (e.g. last_practiced_at on a pre-existing `mastery`).
    Safe to run on every startup; does nothing if the column is already there."""
    # (table, column, type) — keep types portable between Postgres and sqlite.
    additive = [("mastery", "last_practiced_at", "TIMESTAMP"),
                ("targetedsession", "selected_items", "TEXT"),
                ("user", "deletion_requested_at", "TIMESTAMP")]   # v41 — droit à l'effacement
    is_sqlite = _db_url.startswith("sqlite")
    with engine.begin() as conn:
        for table, col, coltype in additive:
            # ⚠️ "user" est un MOT RÉSERVÉ en PostgreSQL : sans guillemets,
            # `ALTER TABLE user …` échoue. On cite systématiquement le nom de
            # table (valide en Postgres ET en SQLite).
            q = f'"{table}"'
            try:
                if is_sqlite:
                    cols = [r[1] for r in conn.exec_driver_sql(
                        f"PRAGMA table_info({table})").fetchall()]
                    if col not in cols:
                        conn.exec_driver_sql(
                            f'ALTER TABLE {q} ADD COLUMN {col} {coltype}')
                else:
                    # Postgres supports IF NOT EXISTS -> naturally idempotent.
                    conn.exec_driver_sql(
                        f'ALTER TABLE {q} ADD COLUMN IF NOT EXISTS {col} {coltype}')
            except Exception as e:
                # Une table absente (base neuve) est gérée par create_all.
                # On ne laisse jamais une sonde de migration casser le démarrage —
                # mais on TRACE, sinon un échec reste invisible (leçon v41).
                print(f"[migration] {table}.{col} : {type(e).__name__} — {e}")


def init_db() -> None:
    # Register SaaS Phase 1 tables (User, UserRole, Entitlement, DailyUsage) so
    # create_all picks them up. Import here to avoid a circular import at module load.
    from . import saas  # noqa: F401
    SQLModel.metadata.create_all(engine)
    _ensure_columns()


def get_session():
    with Session(engine) as session:
        yield session
