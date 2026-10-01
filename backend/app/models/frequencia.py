from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.core.database import Base


class Frequencia(Base):
    __tablename__ = "frequencias"

    __table_args__ = (
        CheckConstraint(
            "total_aulas >= 0",
            name="ck_frequencia_total_aulas_nao_negativo",
        ),
        CheckConstraint(
            "total_presencas >= 0",
            name="ck_frequencia_presencas_nao_negativo",
        ),
        CheckConstraint(
            "total_presencas <= total_aulas",
            name="ck_frequencia_presencas_limite",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    matricula_id = Column(
        Integer,
        ForeignKey("matriculas.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    total_aulas = Column(
        Integer,
        default=0,
        nullable=False,
    )

    total_presencas = Column(
        Integer,
        default=0,
        nullable=False,
    )

    professor_id = Column(
        Integer,
        ForeignKey("professores.id"),
        nullable=True,
    )

    matricula = relationship("Matricula")
    professor = relationship("Professor")