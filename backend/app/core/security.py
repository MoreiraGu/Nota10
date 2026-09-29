from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_senha(senha: str) -> str:
    """Retorna o hash bcrypt da senha."""
    senha_bytes = senha.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(senha_bytes, salt).decode("utf-8")


def verificar_senha(senha_plain: str, senha_hash: str) -> bool:
    """Verifica se a senha plaintext confere com o hash armazenado."""
    return bcrypt.checkpw(senha_plain.encode("utf-8"), senha_hash.encode("utf-8"))


def criar_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Assina e retorna um JWT com os dados fornecidos."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decodificar_token(token: str) -> dict[str, Any]:
    """Decodifica e valida o JWT. Lança JWTError se inválido/expirado."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
