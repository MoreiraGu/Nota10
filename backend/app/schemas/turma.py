from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ── Turma ─────────────────────────────────────────────────────────────────────

class TurmaCreate(BaseModel):
    disciplina_id: int
    periodo_letivo: str


class TurmaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    disciplina_id: int
    periodo_letivo: str
    situacao: str


class ProfessorVinculoResponse(BaseModel):
    id: int
    nome: str


class AlunoMatriculaResponse(BaseModel):
    id: int
    nome: str


class TurmaDetalheResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    disciplina_id: int
    periodo_letivo: str
    situacao: str
    professores: list[ProfessorVinculoResponse]
    alunos: list[AlunoMatriculaResponse]


# ── Vínculo professor ─────────────────────────────────────────────────────────

class VincularProfessorRequest(BaseModel):
    professor_id: int


class TurmaProfessorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    turma_id: int
    professor_id: int


# ── Matrícula ─────────────────────────────────────────────────────────────────

class MatricularAlunoRequest(BaseModel):
    aluno_id: int


class MatriculaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    turma_id: int
    aluno_id: int
    data_matricula: datetime