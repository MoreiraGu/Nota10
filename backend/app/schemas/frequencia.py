from pydantic import BaseModel


# ── Request ──────────────────────────────────────────────────────────────────

class FrequenciaCreate(BaseModel):
    aluno_id: int
    total_aulas: int
    presencas: int


# ── Response ─────────────────────────────────────────────────────────────────

class FrequenciaResponse(BaseModel):
    turma_id: int
    aluno_id: int
    total_aulas: int
    presencas: int
    percentual: float

class AlunoTurmaResponse(BaseModel):
    aluno_id: int
    nome: str
    email: str


class TurmaAlunosResponse(BaseModel):
    turma_id: int
    nome: str
    alunos: list[AlunoTurmaResponse]