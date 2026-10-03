from sqlalchemy import Column, ForeignKey, Integer, String

from app.core.database import Base


class Turma(Base):
    __tablename__ = "turmas"

    id = Column(Integer, primary_key=True, index=True)

    nome = Column(
        String(200),
        nullable=False,
    )

    professor_id = Column(
        Integer,
        ForeignKey("professores.id"),
        nullable=False,
        index=True,
    )