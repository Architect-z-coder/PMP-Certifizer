"""Base de test unique pour toute la suite.

L'engine SQLModel se lie à DATABASE_URL au PREMIER import de app.models ;
sans ce conftest, deux modules de test posant des URLs différentes entrent
en collision (le second hérite silencieusement de l'engine du premier).
"""
import os

_DB = os.path.join(os.path.dirname(__file__), "..", "_suite_test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.abspath(_DB)}"
if os.path.exists(_DB):
    os.remove(_DB)
