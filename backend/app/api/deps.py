from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decodificar_token
from app.models.usuario import Perfil, Usuario
from app.models.professor import Professor
from app.models.turma import Turma

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token ausente, inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decodificar_token(token)

        usuario_id_raw = payload.get("sub")
        if usuario_id_raw is None:
            raise credentials_exception

        usuario_id = int(usuario_id_raw)

    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if usuario is None:
        raise credentials_exception
    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )
    return usuario


def require_perfil(*perfis: Perfil):
    def _check(current_user: Annotated[Usuario, Depends(get_current_user)]) -> Usuario:
        if current_user.perfil not in perfis:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso não autorizado para este perfil",
            )
        return current_user

    return _check

def requires_vinculo_turma(
    turma_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        Usuario,
        Depends(require_perfil(Perfil.PROFESSOR)),
    ],
) -> Turma:
    professor = (
        db.query(Professor)
        .filter(Professor.usuario_id == current_user.id)
        .first()
    )

    if professor is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário não possui cadastro de professor",
        )

    turma = (
        db.query(Turma)
        .filter(Turma.id == turma_id)
        .first()
    )

    if turma is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada",
        )

    if turma.professor_id != professor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Professor não possui vínculo com esta turma",
        )

    return turma
