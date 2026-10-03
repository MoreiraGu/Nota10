from pydantic import BaseModel


class NotaBoletimResponse(BaseModel):
    tipo: str
    valor: float | None


class ItemBoletimResponse(BaseModel):
    turma_id: int
    disciplina: str
    notas: list[NotaBoletimResponse]
    media: float | None
    frequencia: float | None