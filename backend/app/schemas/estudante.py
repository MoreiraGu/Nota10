from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


# ── Request ──────────────────────────────────────────────────────────────────

class EstudanteCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    contato: str
    curso_id: int

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


class EstudanteUpdate(BaseModel):
    nome: str | None = None
    email: EmailStr | None = None
    senha: str | None = None
    contato: str | None = None
    curso_id: int | None = None
    situacao: str | None = None


# ── Response ─────────────────────────────────────────────────────────────────

class EstudanteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    nome: str
    email: str
    contato: str = ""
    curso_id: int
    curso: str = ""
    situacao: str


class EstudanteListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str
    curso_id: int
    curso: str = ""
    situacao: str
