from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Nota(Base):
    __tablename__ = "notas"

    id = Column(Integer, primary_key=True, index=True)

    matricula_id = Column(
        Integer,
        ForeignKey("matriculas.id"),
        nullable=False,
        index=True,
    )

    tipo_avaliacao = Column(
        String(100),
        nullable=False,
    )

    peso = Column(
        Float,
        default=1.0,
        nullable=False,
    )

    valor = Column(
        Float,
        nullable=True,
    )

    professor_id = Column(
        Integer,
        ForeignKey("professores.id"),
        nullable=True,
    )

    matricula = relationship("Matricula")
    professor = relationship("Professor")