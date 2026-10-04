from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Frequencia(Base):
    __tablename__ = "frequencias"

    __table_args__ = (
        UniqueConstraint(
            "turma_id",
            "estudante_id",
            name="uq_frequencia_turma_estudante",
        ),
        CheckConstraint(
            "total_aulas >= 0",
            name="ck_frequencia_total_aulas_nao_negativo",
        ),
        CheckConstraint(
            "presencas >= 0",
            name="ck_frequencia_presencas_nao_negativo",
        ),
        CheckConstraint(
            "presencas <= total_aulas",
            name="ck_frequencia_presencas_limite",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    turma_id = Column(
        Integer,
        ForeignKey("turmas.id"),
        nullable=False,
        index=True,
    )

    estudante_id = Column(
        Integer,
        ForeignKey("estudantes.id"),
        nullable=False,
        index=True,
    )

    professor_id = Column(
        Integer,
        ForeignKey("professores.id"),
        nullable=True,
    )

    total_aulas = Column(Integer, nullable=False, default=0)
    presencas = Column(Integer, nullable=False, default=0)

    estudante = relationship("Estudante", lazy="joined")
    professor = relationship("Professor")
