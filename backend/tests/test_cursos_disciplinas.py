"""
Testes de integração — EP.4: cadastro de curso e disciplina.

Critérios de aceite:
  [CA-1] Coordenação cadastra e lista cursos.
  [CA-2] Coordenação cadastra e lista disciplinas; disciplina vinculada a curso nasce ATIVA.
  [CA-3] Curso inexistente ao cadastrar disciplina retorna 404.
  [CA-4] Perfil diferente de Coordenação recebe 403.
"""

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import criar_access_token, hash_senha
from app.main import app
from app.models.curso import Curso
from app.models.disciplina import Disciplina, SituacaoDisciplina
from app.models.usuario import Perfil, Usuario

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")
is_sqlite = TEST_DATABASE_URL.startswith("sqlite")
_connect_args = {"check_same_thread": False} if is_sqlite else {}
_pool_kwargs = {"poolclass": StaticPool} if is_sqlite else {}

engine_test = create_engine(TEST_DATABASE_URL, connect_args=_connect_args, **_pool_kwargs)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    anterior = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)
    if anterior is None:
        app.dependency_overrides.pop(get_db, None)
    else:
        app.dependency_overrides[get_db] = anterior


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def _criar_usuario(db, perfil: Perfil, email: str) -> Usuario:
    usuario = Usuario(
        nome=perfil.value.title(),
        email=email,
        senha_hash=hash_senha("senha123"),
        perfil=perfil,
        ativo=True,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def _headers(usuario: Usuario) -> dict[str, str]:
    token = criar_access_token({"sub": str(usuario.id), "perfil": usuario.perfil.value})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def coord(db):
    return _criar_usuario(db, Perfil.COORDENACAO, "coord@test.com")


@pytest.fixture(params=[Perfil.PROFESSOR, Perfil.ALUNO])
def outro_perfil(request, db):
    perfil = request.param
    return _criar_usuario(db, perfil, f"{perfil.value.lower()}@test.com")


class TestCursos:
    def test_coordenacao_cadastra_e_lista_cursos(self, client, coord, db):
        primeiro = client.post(
            "/api/v1/cursos",
            json={"nome": "Sistemas de Informação"},
            headers=_headers(coord),
        )
        segundo = client.post(
            "/api/v1/cursos",
            json={"nome": "Ciência de Dados"},
            headers=_headers(coord),
        )

        assert primeiro.status_code == 201, primeiro.text
        assert segundo.status_code == 201, segundo.text
        assert primeiro.json()["nome"] == "Sistemas de Informação"
        assert db.query(Curso).count() == 2

        resposta = client.get("/api/v1/cursos", headers=_headers(coord))
        assert resposta.status_code == 200
        assert [curso["nome"] for curso in resposta.json()] == [
            "Ciência de Dados",
            "Sistemas de Informação",
        ]

    def test_nome_vazio_retorna_400(self, client, coord):
        resposta = client.post(
            "/api/v1/cursos",
            json={"nome": "   "},
            headers=_headers(coord),
        )
        assert resposta.status_code == 400

    def test_perfil_diferente_nao_cadastra_curso(self, client, outro_perfil):
        resposta = client.post(
            "/api/v1/cursos",
            json={"nome": "Curso Bloqueado"},
            headers=_headers(outro_perfil),
        )
        assert resposta.status_code == 403

    def test_perfil_diferente_nao_lista_cursos(self, client, outro_perfil):
        resposta = client.get("/api/v1/cursos", headers=_headers(outro_perfil))
        assert resposta.status_code == 403


class TestDisciplinas:
    def test_coordenacao_cadastra_disciplina_vinculada_e_ativa(self, client, coord, db):
        curso = client.post(
            "/api/v1/cursos",
            json={"nome": "Sistemas de Informação"},
            headers=_headers(coord),
        ).json()

        resposta = client.post(
            "/api/v1/disciplinas",
            json={"nome": "Programação Web", "curso_id": curso["id"]},
            headers=_headers(coord),
        )

        assert resposta.status_code == 201, resposta.text
        data = resposta.json()
        assert data["nome"] == "Programação Web"
        assert data["curso_id"] == curso["id"]
        assert data["curso"] == "Sistemas de Informação"
        assert data["situacao"] == "ATIVA"

        disciplina = db.query(Disciplina).one()
        assert disciplina.curso_id == curso["id"]
        assert disciplina.situacao == SituacaoDisciplina.ATIVA

    def test_coordenacao_lista_disciplinas(self, client, coord):
        curso = client.post(
            "/api/v1/cursos",
            json={"nome": "Sistemas de Informação"},
            headers=_headers(coord),
        ).json()
        for nome in ["Programação Web", "Banco de Dados"]:
            criada = client.post(
                "/api/v1/disciplinas",
                json={"nome": nome, "curso_id": curso["id"]},
                headers=_headers(coord),
            )
            assert criada.status_code == 201, criada.text

        resposta = client.get("/api/v1/disciplinas", headers=_headers(coord))
        assert resposta.status_code == 200
        data = resposta.json()
        assert [disciplina["nome"] for disciplina in data] == [
            "Banco de Dados",
            "Programação Web",
        ]
        assert all(disciplina["situacao"] == "ATIVA" for disciplina in data)
        assert all(disciplina["curso"] == "Sistemas de Informação" for disciplina in data)

    def test_curso_inexistente_retorna_404(self, client, coord):
        resposta = client.post(
            "/api/v1/disciplinas",
            json={"nome": "Programação Web", "curso_id": 9999},
            headers=_headers(coord),
        )
        assert resposta.status_code == 404
        assert resposta.json()["detail"] == "Curso 9999 não encontrado"

    def test_nome_vazio_retorna_400(self, client, coord):
        curso = client.post(
            "/api/v1/cursos",
            json={"nome": "Sistemas de Informação"},
            headers=_headers(coord),
        ).json()
        resposta = client.post(
            "/api/v1/disciplinas",
            json={"nome": "  ", "curso_id": curso["id"]},
            headers=_headers(coord),
        )
        assert resposta.status_code == 400

    def test_perfil_diferente_nao_cadastra_disciplina(self, client, outro_perfil):
        resposta = client.post(
            "/api/v1/disciplinas",
            json={"nome": "Disciplina Bloqueada", "curso_id": 1},
            headers=_headers(outro_perfil),
        )
        assert resposta.status_code == 403

    def test_perfil_diferente_nao_lista_disciplinas(self, client, outro_perfil):
        resposta = client.get("/api/v1/disciplinas", headers=_headers(outro_perfil))
        assert resposta.status_code == 403
