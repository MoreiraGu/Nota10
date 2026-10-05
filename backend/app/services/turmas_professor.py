"""Consultas compartilhadas para as turmas do professor autenticado."""

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.matricula import Matricula
from app.models.professor import Professor
from app.models.turma import Turma
from app.models.turma_professor import TurmaProfessor
from app.schemas.turma import MinhaTurmaResponse


def listar_turmas_do_professor(
    db: Session,
    usuario_id: int,
) -> list[MinhaTurmaResponse]:
    professor = (
        db.query(Professor)
        .filter(Professor.usuario_id == usuario_id)
        .first()
    )

    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário não possui cadastro de professor",
        )

    vinculos = (
        db.query(TurmaProfessor)
        .filter(TurmaProfessor.professor_id == professor.id)
        .order_by(TurmaProfessor.turma_id)
        .all()
    )

    resultado = []

    for vinculo in vinculos:
        turma = vinculo.turma

        total_alunos = (
            db.query(func.count(Matricula.id))
            .filter(Matricula.turma_id == turma.id)
            .scalar()
        )

        resultado.append(
            MinhaTurmaResponse(
                turma_id=turma.id,
                nome=turma.disciplina.nome,
                total_alunos=total_alunos,
            )
        )

    return resultado