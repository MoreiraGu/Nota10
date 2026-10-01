import enum

from sqlalchemy import Column, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class SituacaoTurma(str, enum.Enum):
    ATIVA = "ATIVA"
    ENCERRADA = "ENCERRADA"


class Turma(Base):
    __tablename__ = "turmas"

    id = Column(Integer, primary_key=True, index=True)

    disciplina_id = Column(
        Integer,
        ForeignKey("disciplinas.id"),
        nullable=False,
        index=True,
    )

    periodo_letivo = Column(String(20), nullable=False)

    situacao = Column(
        Enum(SituacaoTurma),
        default=SituacaoTurma.ATIVA,
        nullable=False,
    )

    disciplina = relationship("Disciplina", lazy="joined")