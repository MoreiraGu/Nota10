from pydantic import BaseModel, ConfigDict
from app.models.usuario import Perfil


class TokenData(BaseModel):
    usuario_id: int
    perfil: Perfil


class LoginRequest(BaseModel):
    email: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario_id: int
    nome: str
    perfil: Perfil


class UsuarioLogado(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    usuario_id: int
    nome: str
    perfil: Perfil
