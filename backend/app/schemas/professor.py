from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


# ── Request ──────────────────────────────────────────────────────────────

class ProfessorCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    contato: str = ""

    @field_validator("nome")
    @classmethod
    def nome_nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("nome não pode ser vazio")
        return v.strip()

    @field_validator("senha")
    @classmethod
    def senha_minima(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("senha deve ter pelo menos 6 caracteres")
        return v


class ProfessorUpdate(BaseModel):
    """Todos os campos são opcionais: só o que for enviado é alterado."""

    nome: str | None = None
    email: EmailStr | None = None
    senha: str | None = None
    contato: str | None = None
    situacao: Literal["ATIVO", "INATIVO"] | None = None

    @field_validator("nome")
    @classmethod
    def nome_nao_vazio(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not v.strip():
            raise ValueError("nome não pode ser vazio")
        return v.strip()

    @field_validator("senha")
    @classmethod
    def senha_minima(cls, v: str | None) -> str | None:
        # Senha em branco significa "manter a atual"
        if v is None or v == "":
            return None
        if len(v) < 6:
            raise ValueError("senha deve ter pelo menos 6 caracteres")
        return v

    @field_validator("situacao", mode="before")
    @classmethod
    def situacao_maiuscula(cls, v):
        return v.upper() if isinstance(v, str) else v


# ── Response ─────────────────────────────────────────────────────────────

class ProfessorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    nome: str
    email: str
    contato: str = ""
    situacao: str


class ProfessorListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str
    contato: str = ""
    situacao: str