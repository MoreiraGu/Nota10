import enum

from sqlalchemy import Column, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class SituacaoProfessor(str, enum.Enum):
    ATIVO = "ATIVO"
    INATIVO = "INATIVO"


class Professor(Base):
    __tablename__ = "professores"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, unique=True)
    contato = Column(String(50), nullable=True, default="")
    situacao = Column(Enum(SituacaoProfessor), default=SituacaoProfessor.ATIVO, nullable=False)

    usuario = relationship("Usuario", lazy="joined")