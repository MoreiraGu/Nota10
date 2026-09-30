from sqlalchemy import Column, Integer, String
from app.core.database import Base


class Curso(Base):
    __tablename__ = "cursos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
