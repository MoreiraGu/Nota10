from datetime import timedelta
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import criar_access_token
from app.main import app
from app.models.curso import Curso
from app.models.usuario import Perfil, Usuario


# ── Banco isolado ────────────────────────────────────────────────────────

TEST_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine_test,
)


def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Fixtures ─────────────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def setup_db():
    override_anterior = app.dependency_overrides.get(get_db)

    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine_test)

    yield

    Base.metadata.drop_all(bind=engine_test)

    if override_anterior is None:
        app.dependency_overrides.pop(get_db, None)
    else:
        app.dependency_overrides[get_db] = override_anterior


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()


# ── Helpers ──────────────────────────────────────────────────────────────


def criar_usuario(
    db: Session,
    nome: str,
    email: str,
    perfil: Perfil,
) -> Usuario:
    usuario = Usuario(
        nome=nome,
        email=email,
        senha_hash="nao-utilizado-neste-teste",
        perfil=perfil,
        ativo=True,
    )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return usuario


def criar_token(usuario: Usuario) -> str:
    return criar_access_token(
        {
            "sub": str(usuario.id),
            "perfil": usuario.perfil.value,
        }
    )


def headers(usuario: Usuario) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {criar_token(usuario)}"
    }


# ── GET /auth/me ────────────────────────────────────────────────────────


class TestAuthMe:

    @pytest.mark.parametrize(
        "perfil",
        [
            Perfil.COORDENACAO,
            Perfil.PROFESSOR,
            Perfil.ALUNO,
        ],
    )
    def test_retorna_dados_do_usuario_logado(
        self,
        client,
        db,
        perfil,
    ):
        usuario = criar_usuario(
            db,
            nome=f"Usuário {perfil.value}",
            email=f"{perfil.value.lower()}@test.com",
            perfil=perfil,
        )

        response = client.get(
            "/api/v1/auth/me",
            headers=headers(usuario),
        )

        assert response.status_code == 200

        data = response.json()

        assert data["usuario_id"] == usuario.id
        assert data["nome"] == usuario.nome
        assert data["perfil"] == perfil.value


    def test_sem_token_retorna_401(self, client):
        response = client.get("/api/v1/auth/me")

        assert response.status_code == 401


    def test_token_invalido_retorna_401(self, client):
        response = client.get(
            "/api/v1/auth/me",
            headers={
                "Authorization": "Bearer token-totalmente-invalido"
            },
        )

        assert response.status_code == 401


    def test_token_expirado_retorna_401(
        self,
        client,
        db,
    ):
        usuario = criar_usuario(
            db,
            "Usuário Expirado",
            "expirado@test.com",
            Perfil.COORDENACAO,
        )

        token = criar_access_token(
            {
                "sub": str(usuario.id),
                "perfil": usuario.perfil.value,
            },
            expires_delta=timedelta(seconds=-1),
        )

        response = client.get(
            "/api/v1/auth/me",
            headers={
                "Authorization": f"Bearer {token}"
            },
        )

        assert response.status_code == 401


    def test_token_com_sub_invalido_retorna_401(
        self,
        client,
    ):
        token = criar_access_token(
            {
                "sub": "abc",
                "perfil": Perfil.COORDENACAO.value,
            }
        )

        response = client.get(
            "/api/v1/auth/me",
            headers={
                "Authorization": f"Bearer {token}"
            },
        )

        assert response.status_code == 401


# ── RBAC / Cursos ────────────────────────────────────────────────────────


class TestRBACCursos:

    def test_coordenacao_pode_listar_cursos(
        self,
        client,
        db,
    ):
        coordenacao = criar_usuario(
            db,
            "Coordenação",
            "coord@test.com",
            Perfil.COORDENACAO,
        )

        curso = Curso(nome="ADS")
        db.add(curso)
        db.commit()

        response = client.get(
            "/api/v1/cursos",
            headers=headers(coordenacao),
        )

        assert response.status_code == 200

        data = response.json()

        assert len(data) == 1
        assert data[0]["nome"] == "ADS"


    def test_professor_nao_pode_listar_cursos(
        self,
        client,
        db,
    ):
        professor = criar_usuario(
            db,
            "Professor",
            "professor@test.com",
            Perfil.PROFESSOR,
        )

        response = client.get(
            "/api/v1/cursos",
            headers=headers(professor),
        )

        assert response.status_code == 403


    def test_aluno_nao_pode_listar_cursos(
        self,
        client,
        db,
    ):
        aluno = criar_usuario(
            db,
            "Aluno",
            "aluno@test.com",
            Perfil.ALUNO,
        )

        response = client.get(
            "/api/v1/cursos",
            headers=headers(aluno),
        )

        assert response.status_code == 403


    def test_sem_token_retorna_401(
        self,
        client,
    ):
        response = client.get("/api/v1/cursos")

        assert response.status_code == 401


    def test_token_invalido_retorna_401(
        self,
        client,
    ):
        response = client.get(
            "/api/v1/cursos",
            headers={
                "Authorization": "Bearer token-invalido"
            },
        )

        assert response.status_code == 401