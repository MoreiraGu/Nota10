import enum

from sqlalchemy import Boolean, Column, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class SituacaoEstudante(str, enum.Enum):
    ATIVO = "ATIVO"
    INATIVO = "INATIVO"


class Estudante(Base):
    __tablename__ = "estudantes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, unique=True)
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False)
    contato = Column(String(50), nullable=True, default="")
    situacao = Column(Enum(SituacaoEstudante), default=SituacaoEstudante.ATIVO, nullable=False)

    usuario = relationship("Usuario", lazy="joined")
    curso = relationship("Curso", lazy="joined")
