"""Ouverture de test : un compte sans entitlement voit tout (décision 16/07).
Re-verrouillable en une ligne (OPEN_ACCESS_FOR_TESTING = False).

Teste l'unité réelle : la résolution de plan et la matrice d'accès. Les modèles
d'auth (User, Entitlement) vivent dans saas.py."""
import pytest
pytest.importorskip("sqlmodel")
from sqlmodel import Session
from app import saas
from app.saas import User, SQLModel as SaasالبModel  # noqa
from app.models import engine, init_db


def _fresh_user():
    import uuid
    init_db()
    saas.SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        u = saas.User(public_id=f"anon-{uuid.uuid4().hex[:8]}", name="anon-open")
        s.add(u); s.commit(); s.refresh(u)
        return u.id


def test_ouverture_active():
    assert saas.OPEN_ACCESS_FOR_TESTING is True


def test_compte_sans_entitlement_est_premium():
    uid = _fresh_user()
    with Session(engine) as s:
        assert saas._plan_for_features(s, uid) == "premium"
        assert saas.feature_access(s, uid, "full_map") == "full"
        assert saas.feature_access(s, uid, "adaptive_session") == "full"
        assert saas.feature_access(s, uid, "recommendations") == "full"
        assert saas.features_for(s, uid)["full_map"]["access"] == "full"


def test_fonctions_institution_restent_reservees():
    """Ouvrir le premium ne transforme pas un apprenant en formateur."""
    uid = _fresh_user()
    with Session(engine) as s:
        assert saas.feature_access(s, uid, "trainer_dashboard") == "none"
        assert saas.feature_access(s, uid, "cohort_heatmap") == "none"


def test_matrice_free_preservee_pour_le_verrouillage():
    """La matrice free d'origine reste intacte : au verrouillage, basculer
    l'interrupteur restaure exactement le bridage prévu."""
    assert saas.FEATURE_MATRIX["free"]["full_map"] == "preview"
    assert saas.FEATURE_MATRIX["free"]["adaptive_session"] == "preview"
    assert saas.FEATURE_MATRIX["free"]["exam_simulator"] == "none"
