"""Router de turmas — ACAD-6 (Task 1) e ACAD-7 (Task 2).

Task 1 (Coordenação):
  POST   /turmas                              → criar turma
  GET    /turmas/{turma_id}                   → detalhe com professores e alunos
  POST   /turmas/{turma_id}/professores       → vincular professor
  POST   /turmas/{turma_id}/matriculas        → matricular aluno

Task 2 (Professor vinculado):
  POST   /turmas/{turma_id}/notas             → lançar nota
  GET    /turmas/{turma_id}/alunos/{id}/media → média calculada pelo backend

Task ACAD-8 (já existente, mantido):
  POST   /turmas/{turma_id}/frequencia
  GET    /turmas/{turma_id}/alunos/{id}/frequencia
  GET    /turmas/{turma_id}/alunos            → lista para o professor

Task ACAD-10 (já existente, mantido):
  GET    /turmas/minhas                       → turmas do professor logado
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, require_perfil, requires_vinculo_turma
from app.models.disciplina import Disciplina
from app.models.estudante import Estudante, SituacaoEstudante
from app.models.frequencia import Frequencia
from app.models.matricula import Matricula
from app.models.nota import Nota
from app.models.professor import Professor, SituacaoProfessor
from app.models.turma import Turma
from app.models.turma_professor import TurmaProfessor
from app.models.usuario import Perfil, Usuario
from app.schemas.frequencia import (
    AlunoTurmaResponse,
    FrequenciaCreate,
    FrequenciaResponse,
    TurmaAlunosResponse,
)
from app.schemas.nota import MediaResponse, NotaCreate, NotaMediaItem, NotaResponse
from app.schemas.turma import (
    AlunoMatriculaResponse,
    MatricularAlunoRequest,
    MatriculaResponse,
    ProfessorVinculoResponse,
    TurmaCreate,
    TurmaDetalheResponse,
    TurmaResponse,
    TurmaProfessorResponse,
    VincularProfessorRequest,
    MinhaTurmaResponse,
)
from app.services.turmas_professor import listar_turmas_do_professor
from app.services.calculo_media import calculadora_padrao

router = APIRouter(prefix="/turmas", tags=["Turmas"])

_somente_coordenacao = Depends(require_perfil(Perfil.COORDENACAO))
_somente_professor = Depends(require_perfil(Perfil.PROFESSOR))


# ─────────────────────────────────────────────────────────────────────────────
# ACAD-6 — Task 1
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=TurmaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma nova turma",
    description="Cria turma vinculada a uma disciplina e período letivo. Restrito à Coordenação.",
)
def criar_turma(
    body: TurmaCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> TurmaResponse:
    disciplina = db.query(Disciplina).filter(Disciplina.id == body.disciplina_id).first()
    if not disciplina:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disciplina {body.disciplina_id} não encontrada",
        )

    turma = Turma(
        disciplina_id=disciplina.id,
        periodo_letivo=body.periodo_letivo,
    )
    db.add(turma)
    db.commit()
    db.refresh(turma)

    return TurmaResponse(
        id=turma.id,
        disciplina_id=turma.disciplina_id,
        periodo_letivo=turma.periodo_letivo,
        situacao=turma.situacao.value,
    )

@router.get(
    "",
    response_model=list[TurmaResponse],
    status_code=status.HTTP_200_OK,
    summary="Lista todas as turmas",
    description="Lista todas as turmas cadastradas. Restrito à Coordenação.",
)
def listar_turmas(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> list[TurmaResponse]:
    turmas = (
        db.query(Turma)
        .order_by(Turma.id.desc())
        .all()
    )

    return [
        TurmaResponse(
            id=turma.id,
            disciplina_id=turma.disciplina_id,
            periodo_letivo=turma.periodo_letivo,
            situacao=turma.situacao.value,
        )
        for turma in turmas
    ]

@router.get(
    "/minhas",
    response_model=list[MinhaTurmaResponse],
    status_code=status.HTTP_200_OK,
    summary="Lista as turmas do professor autenticado",
    deprecated=True,
    description=(
        "Alias mantido por compatibilidade. "
        "Prefira GET /professores/me/turmas."
    ),
)
def listar_minhas_turmas_alias(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[Usuario, _somente_professor],
) -> list[MinhaTurmaResponse]:
    return listar_turmas_do_professor(db, current_user.id)



@router.get(
    "/{turma_id}",
    response_model=TurmaDetalheResponse,
    status_code=status.HTTP_200_OK,
    summary="Detalhe da turma",
    description="Retorna turma com disciplina, período letivo, professores vinculados e alunos matriculados.",
)
def obter_turma(
    turma_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> TurmaDetalheResponse:
    turma = db.query(Turma).filter(Turma.id == turma_id).first()
    if not turma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada",
        )

    vinculos = (
        db.query(TurmaProfessor)
        .filter(TurmaProfessor.turma_id == turma_id)
        .all()
    )
    professores = [
        ProfessorVinculoResponse(
            id=v.professor.id,
            nome=v.professor.usuario.nome,
        )
        for v in vinculos
    ]

    matriculas = (
        db.query(Matricula)
        .filter(Matricula.turma_id == turma_id)
        .order_by(Matricula.data_matricula)
        .all()
    )
    alunos = [
        AlunoMatriculaResponse(
            id=m.estudante.id,
            nome=m.estudante.usuario.nome,
        )
        for m in matriculas
    ]

    return TurmaDetalheResponse(
        id=turma.id,
        disciplina_id=turma.disciplina_id,
        periodo_letivo=turma.periodo_letivo,
        situacao=turma.situacao.value,
        professores=professores,
        alunos=alunos,
    )


@router.post(
    "/{turma_id}/professores",
    response_model=TurmaProfessorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Vincula professor à turma",
    description="Vincula um professor ativo à turma. Retorna 422 se inativo, 409 se já vinculado.",
)
def vincular_professor(
    turma_id: int,
    body: VincularProfessorRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> TurmaProfessorResponse:
    turma = db.query(Turma).filter(Turma.id == turma_id).first()
    if not turma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada",
        )

    professor = db.query(Professor).filter(Professor.id == body.professor_id).first()
    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Professor {body.professor_id} não encontrado",
        )

    if professor.situacao == SituacaoProfessor.INATIVO:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Professor inativo não pode ser vinculado a uma turma",
        )

    existente = (
        db.query(TurmaProfessor)
        .filter(
            TurmaProfessor.turma_id == turma_id,
            TurmaProfessor.professor_id == body.professor_id,
        )
        .first()
    )
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Professor já está vinculado a esta turma",
        )

    vinculo = TurmaProfessor(turma_id=turma_id, professor_id=body.professor_id)
    db.add(vinculo)
    db.commit()
    db.refresh(vinculo)

    return TurmaProfessorResponse(
        id=vinculo.id,
        turma_id=vinculo.turma_id,
        professor_id=vinculo.professor_id,
    )


@router.post(
    "/{turma_id}/matriculas",
    response_model=MatriculaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Matricula aluno na turma",
    description="Matricula um aluno ativo na turma. Retorna 422 se inativo, 409 se já matriculado.",
)
def matricular_aluno(
    turma_id: int,
    body: MatricularAlunoRequest,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Usuario, _somente_coordenacao],
) -> MatriculaResponse:
    turma = db.query(Turma).filter(Turma.id == turma_id).first()
    if not turma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada",
        )

    estudante = db.query(Estudante).filter(Estudante.id == body.aluno_id).first()
    if not estudante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudante {body.aluno_id} não encontrado",
        )

    if estudante.situacao == SituacaoEstudante.INATIVO:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Aluno inativo não pode ser matriculado em uma turma",
        )

    existente = (
        db.query(Matricula)
        .filter(
            Matricula.turma_id == turma_id,
            Matricula.estudante_id == body.aluno_id,
        )
        .first()
    )
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Aluno já está matriculado nesta turma",
        )

    matricula = Matricula(turma_id=turma_id, estudante_id=body.aluno_id)
    db.add(matricula)
    db.commit()
    db.refresh(matricula)

    return MatriculaResponse(
        id=matricula.id,
        turma_id=matricula.turma_id,
        aluno_id=matricula.estudante_id,
        data_matricula=matricula.data_matricula,
    )


# ─────────────────────────────────────────────────────────────────────────────
# ACAD-7 — Task 2 (lançamento de notas e média)
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/{turma_id}/notas",
    response_model=NotaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Lança nota de um aluno",
    description=(
        "Professor vinculado à turma lança nota de um aluno matriculado. "
        "Retorna 403 se não vinculado, 404 se aluno não matriculado, 400 se valor fora do intervalo."
    ),
)
def lancar_nota(
    turma_id: int,
    body: NotaCreate,
    db: Annotated[Session, Depends(get_db)],
    turma: Annotated[Turma, Depends(requires_vinculo_turma)],
    current_user: Annotated[Usuario, _somente_professor],
) -> NotaResponse:
    # Validações de regra de negócio (spec seção 3.4 → 422)
    if body.valor is not None and (body.valor < 0 or body.valor > 10):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nota deve estar entre 0 e 10",
        )
    if body.peso <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Peso deve ser maior que zero",
        )

    professor = (
        db.query(Professor)
        .filter(Professor.usuario_id == current_user.id)
        .first()
    )

    matricula = (
        db.query(Matricula)
        .filter(
            Matricula.turma_id == turma_id,
            Matricula.estudante_id == body.aluno_id,
        )
        .first()
    )
    if not matricula:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não está matriculado nesta turma",
        )

    nota = Nota(
        aluno_id=body.aluno_id,
        disciplina_id=turma.disciplina_id,
        turma_id=turma_id,
        professor_lancador_id=professor.id,
        tipo_avaliacao=body.tipo_avaliacao,
        peso=body.peso,
        valor=body.valor,
    )
    db.add(nota)
    db.commit()
    db.refresh(nota)

    return NotaResponse(
        id=nota.id,
        aluno_id=nota.aluno_id,
        disciplina_id=nota.disciplina_id,
        turma_id=nota.turma_id,
        tipo_avaliacao=nota.tipo_avaliacao,
        peso=nota.peso,
        valor=nota.valor,
        professor_lancador_id=nota.professor_lancador_id,
        data_lancamento=nota.data_lancamento,
    )


@router.get(
    "/{turma_id}/alunos/{aluno_id}/media",
    response_model=MediaResponse,
    status_code=status.HTTP_200_OK,
    summary="Média calculada do aluno na turma",
    description=(
        "Retorna notas do aluno e a média final calculada pelo backend (Template Method). "
        "Restrito ao professor vinculado à turma."
    ),
)
def obter_media(
    turma_id: int,
    aluno_id: int,
    db: Annotated[Session, Depends(get_db)],
    turma: Annotated[Turma, Depends(requires_vinculo_turma)],
) -> MediaResponse:
    matricula = (
        db.query(Matricula)
        .filter(
            Matricula.turma_id == turma_id,
            Matricula.estudante_id == aluno_id,
        )
        .first()
    )
    if not matricula:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não está matriculado nesta turma",
        )

    notas = (
        db.query(Nota)
        .filter(
            Nota.turma_id == turma_id,
            Nota.aluno_id == aluno_id,
        )
        .order_by(Nota.id)
        .all()
    )

    media_final = calculadora_padrao.calcular(notas)

    return MediaResponse(
        aluno_id=aluno_id,
        disciplina_id=turma.disciplina_id,
        notas=[
            NotaMediaItem(
                tipo_avaliacao=n.tipo_avaliacao,
                peso=n.peso,
                valor=n.valor,
            )
            for n in notas
        ],
        media_final=media_final,
    )


# ─────────────────────────────────────────────────────────────────────────────
# ACAD-8 — Frequência (mantido e corrigido)
# ─────────────────────────────────────────────────────────────────────────────

def _calcular_percentual(total_aulas: int, presencas: int) -> float:
    if total_aulas == 0:
        return 0.0
    return round((presencas / total_aulas) * 100, 2)


@router.post(
    "/{turma_id}/frequencia",
    response_model=FrequenciaResponse,
    status_code=status.HTTP_200_OK,
    summary="Lança frequência de um aluno",
    description="Professor vinculado lança ou atualiza a frequência. Percentual calculado pelo backend.",
)
def lancar_frequencia(
    turma_id: int,
    body: FrequenciaCreate,
    db: Annotated[Session, Depends(get_db)],
    turma: Annotated[Turma, Depends(requires_vinculo_turma)],
) -> FrequenciaResponse:
    if body.total_aulas < 0 or body.presencas < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total de aulas e presenças não podem ser negativos",
        )

    if body.presencas > body.total_aulas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Presenças não podem ser maiores que o total de aulas",
        )

    matricula = (
        db.query(Matricula)
        .filter(
            Matricula.turma_id == turma_id,
            Matricula.estudante_id == body.aluno_id,
        )
        .first()
    )
    if not matricula:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não matriculado nesta turma",
        )

    frequencia = (
        db.query(Frequencia)
        .filter(
            Frequencia.turma_id == turma_id,
            Frequencia.estudante_id == body.aluno_id,
        )
        .first()
    )

    if frequencia:
        frequencia.total_aulas = body.total_aulas
        frequencia.presencas = body.presencas
    else:
        frequencia = Frequencia(
            turma_id=turma_id,
            estudante_id=body.aluno_id,
            total_aulas=body.total_aulas,
            presencas=body.presencas,
        )
        db.add(frequencia)

    db.commit()
    db.refresh(frequencia)

    return FrequenciaResponse(
        turma_id=frequencia.turma_id,
        aluno_id=frequencia.estudante_id,
        total_aulas=frequencia.total_aulas,
        presencas=frequencia.presencas,
        percentual=_calcular_percentual(frequencia.total_aulas, frequencia.presencas),
    )


@router.get(
    "/{turma_id}/alunos/{aluno_id}/frequencia",
    response_model=FrequenciaResponse,
    status_code=status.HTTP_200_OK,
    summary="Consulta frequência de um aluno",
)
def obter_frequencia(
    turma_id: int,
    aluno_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[Turma, Depends(requires_vinculo_turma)],
) -> FrequenciaResponse:
    matricula = (
        db.query(Matricula)
        .filter(
            Matricula.turma_id == turma_id,
            Matricula.estudante_id == aluno_id,
        )
        .first()
    )
    if not matricula:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não matriculado nesta turma",
        )

    frequencia = (
        db.query(Frequencia)
        .filter(
            Frequencia.turma_id == turma_id,
            Frequencia.estudante_id == aluno_id,
        )
        .first()
    )
    if not frequencia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Frequência não encontrada para este aluno",
        )

    return FrequenciaResponse(
        turma_id=frequencia.turma_id,
        aluno_id=frequencia.estudante_id,
        total_aulas=frequencia.total_aulas,
        presencas=frequencia.presencas,
        percentual=_calcular_percentual(frequencia.total_aulas, frequencia.presencas),
    )


@router.get(
    "/{turma_id}/alunos",
    response_model=TurmaAlunosResponse,
    status_code=status.HTTP_200_OK,
    summary="Lista alunos matriculados na turma",
)
def listar_alunos_turma(
    turma_id: int,
    db: Annotated[Session, Depends(get_db)],
    turma: Annotated[Turma, Depends(requires_vinculo_turma)],
) -> TurmaAlunosResponse:
    estudantes = (
        db.query(Estudante)
        .join(Matricula, Matricula.estudante_id == Estudante.id)
        .filter(Matricula.turma_id == turma_id)
        .all()
    )

    alunos = [
        AlunoTurmaResponse(
            aluno_id=e.id,
            nome=e.usuario.nome,
            email=e.usuario.email,
        )
        for e in estudantes
    ]

    return TurmaAlunosResponse(
        turma_id=turma.id,
        nome=turma.disciplina.nome,
        alunos=alunos,
    )
