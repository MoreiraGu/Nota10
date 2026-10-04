from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class TurmaProfessor(Base):
    """Tabela de vínculo professor↔turma. É ela que o RBAC consulta para
    autorizar lançamento de nota/frequência por turma (spec seção 19)."""

    __tablename__ = "turma_professores"

    __table_args__ = (
        UniqueConstraint(
            "turma_id",
            "professor_id",
            name="uq_turma_professor",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    turma_id = Column(
        Integer,
        ForeignKey("turmas.id"),
        nullable=False,
        index=True,
    )

    professor_id = Column(
        Integer,
        ForeignKey("professores.id"),
        nullable=False,
        index=True,
    )

    turma = relationship("Turma", back_populates="turma_professores")
    professor = relationship("Professor", lazy="joined")
