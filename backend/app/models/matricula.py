from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Matricula(Base):
    __tablename__ = "matriculas"

    __table_args__ = (
        UniqueConstraint(
            "estudante_id",
            "turma_id",
            name="uq_matricula_estudante_turma",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    estudante_id = Column(
        Integer,
        ForeignKey("estudantes.id"),
        nullable=False,
        index=True,
    )

    turma_id = Column(
        Integer,
        ForeignKey("turmas.id"),
        nullable=False,
        index=True,
    )

    data_matricula = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    estudante = relationship("Estudante", lazy="joined")
    turma = relationship("Turma", back_populates="matriculas", lazy="joined")
