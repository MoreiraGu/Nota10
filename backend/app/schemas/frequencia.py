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