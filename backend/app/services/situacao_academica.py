from dataclasses import dataclass
from enum import Enum


MEDIA_MINIMA_APROVACAO = 6.0
MEDIA_MINIMA_RECUPERACAO = 4.0
FREQUENCIA_MINIMA_PERCENTUAL = 75.0


class SituacaoAcademica(str, Enum):
    APROVADO = "APROVADO"
    RECUPERACAO = "RECUPERACAO"
    REPROVADO = "REPROVADO"
    EM_ANDAMENTO = "EM_ANDAMENTO"


@dataclass(frozen=True)
class ResultadoSituacao:
    codigo: SituacaoAcademica
    label: str
    detalhe: str


def avaliar_situacao_disciplina(
    media: float | None,
    frequencia: float | None,
    possui_avaliacao_pendente: bool = False,
) -> ResultadoSituacao:
    """Determina a situação oficial da disciplina com base em média e frequência."""
    if media is None:
        return ResultadoSituacao(
            codigo=SituacaoAcademica.EM_ANDAMENTO,
            label="Em andamento",
            detalhe="Aguardando lançamento de notas pelo professor.",
        )

    if frequencia is not None and frequencia < FREQUENCIA_MINIMA_PERCENTUAL:
        return ResultadoSituacao(
            codigo=SituacaoAcademica.REPROVADO,
            label="Reprovado por falta",
            detalhe=f"Frequência de {frequencia:.1f}% abaixo do mínimo exigido ({FREQUENCIA_MINIMA_PERCENTUAL:.0f}%).",
        )

    if possui_avaliacao_pendente:
        return ResultadoSituacao(
            codigo=SituacaoAcademica.EM_ANDAMENTO,
            label="Em andamento",
            detalhe="Média parcial calculada; há avaliações pendentes de lançamento.",
        )

    if frequencia is None:
        return ResultadoSituacao(
            codigo=SituacaoAcademica.EM_ANDAMENTO,
            label="Em andamento",
            detalhe="Notas lançadas; aguardando registro de frequência.",
        )

    if media >= MEDIA_MINIMA_APROVACAO:
        return ResultadoSituacao(
            codigo=SituacaoAcademica.APROVADO,
            label="Aprovado",
            detalhe=f"Média {media:.2f} e frequência {frequencia:.1f}% atingiram os critérios mínimos.",
        )

    if media >= MEDIA_MINIMA_RECUPERACAO:
        return ResultadoSituacao(
            codigo=SituacaoAcademica.RECUPERACAO,
            label="Em recuperação",
            detalhe=f"Média {media:.2f} abaixo de {MEDIA_MINIMA_APROVACAO:.1f}; elegível para recuperação.",
        )

    return ResultadoSituacao(
        codigo=SituacaoAcademica.REPROVADO,
        label="Reprovado por média",
        detalhe=f"Média {media:.2f} abaixo do mínimo para recuperação ({MEDIA_MINIMA_RECUPERACAO:.1f}).",
    )