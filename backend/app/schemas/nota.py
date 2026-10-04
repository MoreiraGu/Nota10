from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotaCreate(BaseModel):
    aluno_id: int
    tipo_avaliacao: str
    peso: float
    valor: float


class NotaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    aluno_id: int
    disciplina_id: int
    turma_id: int
    tipo_avaliacao: str
    peso: float
    valor: float | None
    professor_lancador_id: int
    data_lancamento: datetime


class NotaMediaItem(BaseModel):
    tipo_avaliacao: str
    peso: float
    valor: float | None


class MediaResponse(BaseModel):
    aluno_id: int
    disciplina_id: int
    notas: list[NotaMediaItem]
    media_final: float | None
