import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import criar_access_token, hash_senha
from app.main import app
from app.models.professor import Professor
from app.models.usuario import Perfil, Usuario

# ── Banco de testes isolado ───────────────────────────────────────────────
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


app.dependency_overrides[get_db] = override_get_db


# ── Fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)


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


def _criar_usuario(db, nome, email, perfil: Perfil) -> Usuario:
    u = Usuario(nome=nome, email=email, senha_hash=hash_senha("senha123"), perfil=perfil, ativo=True)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _headers(usuario: Usuario) -> dict:
    token = criar_access_token({"sub": str(usuario.id), "perfil": usuario.perfil.value})
    return {"Authorization": f"Bearer {token}"}


def _payload(**over) -> dict:
    base = {"nome": "Ana Martins", "email": "ana@test.com", "senha": "abc123", "contato": "11987654321"}
    base.update(over)
    return base


# ── POST ──────────────────────────────────────────────────────────────────

class TestCriarProfessor:
    """POST /api/v1/professores"""

    def test_ca1_professor_nao_pode_cadastrar(self, client, db):
        prof = _criar_usuario(db, "Prof", "prof@test.com", Perfil.PROFESSOR)
        resp = client.post("/api/v1/professores", json=_payload(), headers=_headers(prof))
        assert resp.status_code == 403

    def test_ca1_aluno_nao_pode_cadastrar(self, client, db):
        aluno = _criar_usuario(db, "Aluno", "aluno@test.com", Perfil.ALUNO)
        resp = client.post("/api/v1/professores", json=_payload(), headers=_headers(aluno))
        assert resp.status_code == 403

    def test_ca1_sem_token_retorna_401(self, client):
        resp = client.post("/api/v1/professores", json=_payload())
        assert resp.status_code == 401

    def test_ca2_coordenacao_cria_professor_ativo(self, client, db):
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        resp = client.post("/api/v1/professores", json=_payload(), headers=_headers(coord))

        assert resp.status_code == 201
        data = resp.json()
        assert data["situacao"] == "ATIVO"
        assert data["nome"] == "Ana Martins"
        assert data["email"] == "ana@test.com"
        assert data["contato"] == "11987654321"
        assert "id" in data and "usuario_id" in data
        assert "senha" not in data and "senha_hash" not in data

    def test_ca2_cria_usuario_com_perfil_professor(self, client, db):
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        resp = client.post("/api/v1/professores", json=_payload(), headers=_headers(coord))
        assert resp.status_code == 201

        usuario = db.query(Usuario).filter(Usuario.email == "ana@test.com").one()
        assert usuario.perfil == Perfil.PROFESSOR
        assert usuario.ativo is True
        assert db.query(Professor).filter(Professor.usuario_id == usuario.id).count() == 1

    def test_ca2_professor_criado_consegue_logar(self, client, db):
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        client.post("/api/v1/professores", json=_payload(), headers=_headers(coord))

        login = client.post("/api/v1/auth/login", json={"email": "ana@test.com", "senha": "abc123"})
        assert login.status_code == 200
        assert login.json()["perfil"] == "PROFESSOR"

    def test_ca3a_email_duplicado_retorna_409(self, client, db):
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        headers = _headers(coord)
        client.post("/api/v1/professores", json=_payload(), headers=headers)
        resp = client.post("/api/v1/professores", json=_payload(), headers=headers)
        assert resp.status_code == 409

    def test_ca3a_email_de_outro_perfil_tambem_retorna_409(self, client, db):
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        resp = client.post(
            "/api/v1/professores",
            json=_payload(email="coord@test.com"),
            headers=_headers(coord),
        )
        assert resp.status_code == 409

    def test_ca3b_email_invalido_retorna_400(self, client, db):
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        resp = client.post(
            "/api/v1/professores", json=_payload(email="nao-e-email"), headers=_headers(coord)
        )
        assert resp.status_code == 400
        body = resp.json()
        assert body["code"] == "VALIDATION_ERROR"
        assert "email" in body["fields"]

    def test_ca3b_nome_vazio_retorna_400(self, client, db):
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        resp = client.post("/api/v1/professores", json=_payload(nome="   "), headers=_headers(coord))
        assert resp.status_code == 400

    def test_ca3b_senha_curta_retorna_400(self, client, db):
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        resp = client.post("/api/v1/professores", json=_payload(senha="123"), headers=_headers(coord))
        assert resp.status_code == 400

    def test_ca3b_campo_obrigatorio_ausente_retorna_400(self, client, db):
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        resp = client.post(
            "/api/v1/professores",
            json={"nome": "Sem e-mail", "senha": "abc123"},
            headers=_headers(coord),
        )
        assert resp.status_code == 400


# ── GET ───────────────────────────────────────────────────────────────────

class TestListarProfessores:
    """GET /api/v1/professores"""

    def test_ca4_coordenacao_lista_professores(self, client, db):
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        headers = _headers(coord)
        client.post("/api/v1/professores", json=_payload(nome="Zélia", email="z@test.com"), headers=headers)
        client.post("/api/v1/professores", json=_payload(nome="Alberto", email="a@test.com"), headers=headers)

        resp = client.get("/api/v1/professores", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert all({"id", "nome", "email", "situacao"} <= set(p) for p in data)
        assert [p["nome"] for p in data] == ["Alberto", "Zélia"]  # ordem alfabética

    def test_ca4_nao_lista_coordenacao_nem_alunos(self, client, db):
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        _criar_usuario(db, "Aluno", "aluno@test.com", Perfil.ALUNO)
        resp = client.get("/api/v1/professores", headers=_headers(coord))
        assert resp.json() == []

    def test_ca4_professor_nao_lista(self, client, db):
        prof = _criar_usuario(db, "Prof", "prof@test.com", Perfil.PROFESSOR)
        resp = client.get("/api/v1/professores", headers=_headers(prof))
        assert resp.status_code == 403

    def test_ca4_sem_token_retorna_401(self, client):
        assert client.get("/api/v1/professores").status_code == 401

    def test_ca4_lista_vazia_quando_nenhum_professor(self, client, db):
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        resp = client.get("/api/v1/professores", headers=_headers(coord))
        assert resp.status_code == 200
        assert resp.json() == []