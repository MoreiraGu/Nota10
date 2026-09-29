from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Nota 10 - Sistema de Gestao Academica"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "chave_secreta_jwt_para_desenvolvimento"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite:///./nota10.db"

    model_config = ConfigDict(env_file=".env")


settings = Settings()
