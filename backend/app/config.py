from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    llm_provider: str = "gemini"

    gemini_api_key: str = ""
    # gemini-2.0-flash a été arrêté par Google — Gemini 2.5 Flash est le fournisseur requis.
    gemini_model: str = "gemini-2.5-flash"

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"

    database_url: str = "sqlite:///./certifizer.db"
    cors_origins: str = "http://localhost:5173"

    # v38 — Email transactionnel (Brevo). Clé posée en variable d'env sur Render.
    # Tant que brevo_api_key est vide, l'app ne tente aucun envoi (dégradation propre).
    brevo_api_key: str = ""
    brevo_sender_email: str = ""          # expéditeur par défaut au pilote ; domaine propre plus tard
    brevo_sender_name: str = "Certifizer"
    # URL publique du front, pour construire les liens magiques et d'invitation.
    public_app_url: str = "https://pmp-certifizer.vercel.app"
    # Secret de signature des jetons de lien magique (posé en env ; défaut dev only).
    magic_link_secret: str = "dev-magic-secret-change-me"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
