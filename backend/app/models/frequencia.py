from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint

from app.core.database import Base


class Frequencia(Base):
    __tablename__ = "frequencias"

    id = Column(Integer, primary_key=True, index=True)

    turma_id = Column(
        Integer,
        ForeignKey("turmas.id"),
        nullable=False,
    )

    estudante_id = Column(
        Integer,
        ForeignKey("estudantes.id"),
        nullable=False,
    )

    total_aulas = Column(
        Integer,
        nullable=False,
    )

    presencas = Column(
        Integer,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "turma_id",
            "estudante_id",
            name="uq_frequencia_turma_estudante",
        ),
    )