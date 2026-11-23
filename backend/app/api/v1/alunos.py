from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_perfil
from app.models.estudante import Estudante
from app.models.frequencia import Frequencia
from app.models.matricula import Matricula
from app.models.nota import Nota
from app.models.usuario import Perfil, Usuario
from app.schemas.boletim import ItemBoletimResponse, NotaBoletimResponse
from app.services.calculo_media import calculadora_padrao
from app.services.situacao_academica import avaliar_situacao_disciplina


router = APIRouter(
    prefix="/alunos",
    tags=["Alunos"],
)

_somente_aluno = Depends(require_perfil(Perfil.ALUNO))


@router.get(
    "/me/boletim",
    response_model=list[ItemBoletimResponse],
    summary="Consulta o boletim do aluno autenticado",
    description=(
        "Retorna notas, média, frequência e situação acadêmica das turmas em que "
        "o aluno autenticado está matriculado. Cálculos realizados pelo backend."
    ),
)
def obter_meu_boletim(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[Usuario, _somente_aluno],
) -> list[ItemBoletimResponse]:
    estudante = (
        db.query(Estudante)
        .filter(Estudante.usuario_id == current_user.id)
        .first()
    )

    if not estudante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado",
        )

    matriculas = (
        db.query(Matricula)
        .filter(Matricula.estudante_id == estudante.id)
        .order_by(Matricula.id)
        .all()
    )

    boletim: list[ItemBoletimResponse] = []

    for matricula in matriculas:
        notas_db = (
            db.query(Nota)
            .filter(
                Nota.turma_id == matricula.turma_id,
                Nota.aluno_id == matricula.estudante_id,
            )
            .order_by(Nota.id)
            .all()
        )

        notas = [
            NotaBoletimResponse(
                tipo=nota.tipo_avaliacao,
                valor=nota.valor,
            )
            for nota in notas_db
        ]

        possui_avaliacao_pendente = any(nota.valor is None for nota in notas_db)

        # Média calculada pelo backend via Template Method
        media = calculadora_padrao.calcular(notas_db)

        frequencia_db = (
            db.query(Frequencia)
            .filter(
                Frequencia.turma_id == matricula.turma_id,
                Frequencia.estudante_id == matricula.estudante_id,
            )
            .first()
        )

        if frequencia_db and frequencia_db.total_aulas > 0:
            total_aulas = frequencia_db.total_aulas
            presencas = frequencia_db.presencas
            faltas = total_aulas - presencas
            frequencia = round((presencas / total_aulas) * 100, 1)
        else:
            total_aulas = None
            presencas = None
            faltas = None
            frequencia = None

        resultado_situacao = avaliar_situacao_disciplina(
            media=media,
            frequencia=frequencia,
            possui_avaliacao_pendente=possui_avaliacao_pendente,
        )

        boletim.append(
            ItemBoletimResponse(
                turma_id=matricula.turma_id,
                disciplina=matricula.turma.disciplina.nome,
                periodo_letivo=getattr(matricula.turma, "periodo_letivo", None),
                notas=notas,
                media=media,
                frequencia=frequencia,
                total_aulas=total_aulas,
                presencas=presencas,
                faltas=faltas,
                situacao=resultado_situacao.codigo,
                situacao_label=resultado_situacao.label,
                situacao_detalhe=resultado_situacao.detalhe,
            )
        )

    return boletim