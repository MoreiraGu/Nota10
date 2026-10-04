from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Nota(Base):
    """Nota lançada pelo professor. Vincula aluno + turma + disciplina.
    Professor lançador é sempre registrado para rastreabilidade (spec seção 23)."""

    __tablename__ = "notas"

    id = Column(Integer, primary_key=True, index=True)

    aluno_id = Column(
        Integer,
        ForeignKey("estudantes.id"),
        nullable=False,
        index=True,
    )

    disciplina_id = Column(
        Integer,
        ForeignKey("disciplinas.id"),
        nullable=False,
        index=True,
    )

    turma_id = Column(
        Integer,
        ForeignKey("turmas.id"),
        nullable=False,
        index=True,
    )

    professor_lancador_id = Column(
        Integer,
        ForeignKey("professores.id"),
        nullable=False,
    )

    tipo_avaliacao = Column(String(100), nullable=False)

    peso = Column(Float, nullable=False, default=1.0)

    valor = Column(Float, nullable=True)

    data_lancamento = Column(DateTime, default=datetime.utcnow, nullable=False)

    aluno = relationship("Estudante", lazy="joined")
    disciplina = relationship("Disciplina", lazy="joined")
    turma = relationship("Turma")
    professor_lancador = relationship("Professor")