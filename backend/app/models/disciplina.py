import enum

from sqlalchemy import Column, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class SituacaoDisciplina(str, enum.Enum):
    ATIVA = "ATIVA"
    INATIVA = "INATIVA"


class Disciplina(Base):
    __tablename__ = "disciplinas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False, index=True)
    situacao = Column(
        Enum(SituacaoDisciplina),
        default=SituacaoDisciplina.ATIVA,
        nullable=False,
    )

    curso = relationship("Curso", lazy="joined")