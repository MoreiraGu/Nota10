from pydantic import BaseModel, ConfigDict, field_validator


class DisciplinaCreate(BaseModel):
    nome: str
    curso_id: int

    @field_validator("nome")
    @classmethod
    def nome_nao_vazio(cls, value: str) -> str:
        nome = value.strip()
        if not nome:
            raise ValueError("nome não pode ser vazio")
        return nome


class DisciplinaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    curso_id: int
    curso: str
    situacao: str
