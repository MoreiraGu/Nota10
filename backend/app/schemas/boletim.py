from pydantic import BaseModel

from app.services.situacao_academica import SituacaoAcademica


class NotaBoletimResponse(BaseModel):
    tipo: str
    valor: float | None


class ItemBoletimResponse(BaseModel):
    turma_id: int
    disciplina: str
    periodo_letivo: str | None = None
    notas: list[NotaBoletimResponse]
    media: float | None
    frequencia: float | None
    total_aulas: int | None = None
    presencas: int | None = None
    faltas: int | None = None
    situacao: SituacaoAcademica
    situacao_label: str
    situacao_detalhe: str