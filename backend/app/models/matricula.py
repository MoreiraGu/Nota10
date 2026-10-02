from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint

from app.core.database import Base


class Matricula(Base):
    __tablename__ = "matriculas"

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

    __table_args__ = (
        UniqueConstraint(
            "turma_id",
            "estudante_id",
            name="uq_matricula_turma_estudante",
        ),
    )