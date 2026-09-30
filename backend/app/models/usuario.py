import enum

from sqlalchemy import Boolean, Column, Enum, Integer, String
from app.core.database import Base


class Perfil(str, enum.Enum):
    COORDENACAO = "COORDENACAO"
    PROFESSOR = "PROFESSOR"
    ALUNO = "ALUNO"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    perfil = Column(Enum(Perfil), nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
