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

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
