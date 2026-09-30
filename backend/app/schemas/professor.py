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