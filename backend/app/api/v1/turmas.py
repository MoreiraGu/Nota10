from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, require_perfil
from app.models.frequencia import Frequencia
from app.models.matricula import Matricula
from app.models.professor import Professor
from app.models.turma import Turma
from app.models.usuario import Perfil, Usuario
from app.schemas.frequencia import (AlunoTurmaResponse,FrequenciaCreate,FrequenciaResponse,TurmaAlunosResponse, MinhaTurmaResponse)
from app.models.estudante import Estudante


router = APIRouter(prefix="/turmas", tags=["Turmas"])

_somente_professor = Depends(require_perfil(Perfil.PROFESSOR))


def _calcular_percentual(total_aulas: int, presencas: int) -> float:
    if total_aulas == 0:
        return 0.0

    return round((presencas / total_aulas) * 100, 2)


@router.post(
    "/{turma_id}/frequencia",
    response_model=FrequenciaResponse,
    status_code=status.HTTP_200_OK,
    summary="Lança frequência de um aluno",
    description=(
        "Permite ao professor lançar ou atualizar a frequência de um aluno "
        "em uma turma vinculada a ele. O percentual é calculado pelo backend."
    ),
)
def lancar_frequencia(
    turma_id: int,
    body: FrequenciaCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[Usuario, _somente_professor],
) -> FrequenciaResponse:

    # Localiza o Professor associado ao usuário autenticado
    professor = (
        db.query(Professor)
        .filter(Professor.usuario_id == current_user.id)
        .first()
    )

    if not professor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professor não encontrado para o usuário autenticado",
        )

    # O professor só pode lançar frequência em turma vinculada a ele
    turma = (
        db.query(Turma)
        .filter(
            Turma.id == turma_id,
            Turma.professor_id == professor.id,
        )
        .first()
    )

    if not turma:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professor não possui acesso a esta turma",
        )

    # Valores negativos não fazem sentido para frequência
    if body.total_aulas < 0 or body.presencas < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total de aulas e presenças não podem ser negativos",
        )

    # Regra explícita do critério de aceite
    if body.presencas > body.total_aulas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Presenças não podem ser maiores que o total de aulas",
        )

    # O aluno precisa estar matriculado na turma
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

    # Procura uma frequência já lançada para esse aluno na turma
    frequencia = (
        db.query(Frequencia)
        .filter(
            Frequencia.turma_id == turma_id,
            Frequencia.estudante_id == body.aluno_id,
        )
        .first()
    )

    # Se já existe, atualiza.
    if frequencia:
        frequencia.total_aulas = body.total_aulas
        frequencia.presencas = body.presencas

    # Caso contrário, cria.
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

    percentual = _calcular_percentual(
        frequencia.total_aulas,
        frequencia.presencas,
    )

    return FrequenciaResponse(
        turma_id=frequencia.turma_id,
        aluno_id=frequencia.estudante_id,
        total_aulas=frequencia.total_aulas,
        presencas=frequencia.presencas,
        percentual=percentual,
    )

@router.get(
    "/{turma_id}/alunos/{aluno_id}/frequencia",
    response_model=FrequenciaResponse,
    status_code=status.HTTP_200_OK,
    summary="Consulta a frequência de um aluno",
    description=(
        "Permite ao professor consultar a frequência de um aluno "
        "em uma turma vinculada a ele."
    ),
)
def obter_frequencia(
    turma_id: int,
    aluno_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[Usuario, _somente_professor],
) -> FrequenciaResponse:

    professor = (
        db.query(Professor)
        .filter(Professor.usuario_id == current_user.id)
        .first()
    )

    if not professor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professor não encontrado para o usuário autenticado",
        )

    # Confirma que a turma pertence ao professor autenticado
    turma = (
        db.query(Turma)
        .filter(
            Turma.id == turma_id,
            Turma.professor_id == professor.id,
        )
        .first()
    )

    if not turma:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professor não possui acesso a esta turma",
        )

    # O aluno precisa estar matriculado na turma
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

    percentual = _calcular_percentual(
        frequencia.total_aulas,
        frequencia.presencas,
    )

    return FrequenciaResponse(
        turma_id=frequencia.turma_id,
        aluno_id=frequencia.estudante_id,
        total_aulas=frequencia.total_aulas,
        presencas=frequencia.presencas,
        percentual=percentual,
    )

@router.get(
    "/{turma_id}/alunos",
    response_model=TurmaAlunosResponse,
    status_code=status.HTTP_200_OK,
    summary="Lista alunos matriculados na turma",
    description=(
        "Lista os alunos matriculados em uma turma vinculada "
        "ao professor autenticado."
    ),
)
def listar_alunos_turma(
    turma_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[Usuario, _somente_professor],
) -> TurmaAlunosResponse:

    professor = (
        db.query(Professor)
        .filter(Professor.usuario_id == current_user.id)
        .first()
    )

    if not professor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professor não encontrado para o usuário autenticado",
        )

    turma = (
        db.query(Turma)
        .filter(
            Turma.id == turma_id,
            Turma.professor_id == professor.id,
        )
        .first()
    )

    if not turma:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professor não possui acesso a esta turma",
        )

    estudantes = (
        db.query(Estudante)
        .join(
            Matricula,
            Matricula.estudante_id == Estudante.id,
        )
        .filter(Matricula.turma_id == turma_id)
        .all()
    )

    alunos = [
        AlunoTurmaResponse(
            aluno_id=estudante.id,
            nome=estudante.usuario.nome,
            email=estudante.usuario.email,
        )
        for estudante in estudantes
    ]

    return TurmaAlunosResponse(
        turma_id=turma.id,
        nome=turma.nome,
        alunos=alunos,
    )

@router.get(
    "/minhas",
    response_model=list[MinhaTurmaResponse],
    status_code=status.HTTP_200_OK,
    summary="Lista as turmas do professor autenticado",
)
def listar_minhas_turmas(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[Usuario, _somente_professor],
) -> list[MinhaTurmaResponse]:

    professor = (
        db.query(Professor)
        .filter(Professor.usuario_id == current_user.id)
        .first()
    )

    if not professor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professor não encontrado para o usuário autenticado",
        )

    turmas = (
        db.query(
            Turma,
            func.count(Matricula.id).label("total_alunos"),
        )
        .outerjoin(
            Matricula,
            Matricula.turma_id == Turma.id,
        )
        .filter(Turma.professor_id == professor.id)
        .group_by(Turma.id)
        .order_by(Turma.nome)
        .all()
    )

    return [
        MinhaTurmaResponse(
            turma_id=turma.id,
            nome=turma.nome,
            total_alunos=total_alunos,
        )
        for turma, total_alunos in turmas
    ]