"""
Testes de integração — ACAD-3: POST e GET /api/v1/estudantes

Critérios de aceite verificados:
  [CA-1] Somente Coordenação cadastra estudante (outro perfil → 403)
  [CA-2] Estudante nasce com situação ATIVO; cria usuário + estudante
  [CA-3a] E-mail duplicado → 409
  [CA-3b] Curso inexistente → 404
  [CA-3c] Campos inválidos → 400
  [CA-4] Coordenação lista os estudantes cadastrados
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import criar_access_token, hash_senha
from app.main import app
from app.models.usuario import Perfil, Usuario
from app.models.curso import Curso

from app.core.config import settings

# ── Banco de testes (isolado para não apagar o banco de desenvolvimento) ───
import os

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")
is_sqlite = TEST_DATABASE_URL.startswith("sqlite")
_connect_args = {"check_same_thread": False} if is_sqlite else {}
_pool_kwargs = {"poolclass": StaticPool} if is_sqlite else {}

engine_test = create_engine(
    TEST_DATABASE_URL,
    connect_args=_connect_args,
    **_pool_kwargs,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ── Fixtures ───────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def setup_db():
    """Recria o schema antes de cada teste e apaga após."""
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


def _token(usuario: Usuario) -> str:
    return criar_access_token({"sub": str(usuario.id), "perfil": usuario.perfil.value})


def _criar_curso(db, nome="Engenharia") -> Curso:
    c = Curso(nome=nome)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


# ── Testes ─────────────────────────────────────────────────────────────────

class TestCriarEstudante:
    """POST /api/v1/estudantes"""

    def test_ca1_professor_nao_pode_cadastrar(self, client, db):
        """[CA-1] Professor recebe 403."""
        professor = _criar_usuario(db, "Prof", "prof@test.com", Perfil.PROFESSOR)
        curso = _criar_curso(db)
        resp = client.post(
            "/api/v1/estudantes",
            json={"nome": "Aluno X", "email": "aluno@test.com", "senha": "abc123", "contato": "11999", "curso_id": curso.id},
            headers={"Authorization": f"Bearer {_token(professor)}"},
        )
        assert resp.status_code == 403

    def test_ca1_aluno_nao_pode_cadastrar(self, client, db):
        """[CA-1] Aluno recebe 403."""
        aluno_u = _criar_usuario(db, "Aluno", "aluno2@test.com", Perfil.ALUNO)
        curso = _criar_curso(db)
        resp = client.post(
            "/api/v1/estudantes",
            json={"nome": "Aluno Y", "email": "novo@test.com", "senha": "abc123", "contato": "11999", "curso_id": curso.id},
            headers={"Authorization": f"Bearer {_token(aluno_u)}"},
        )
        assert resp.status_code == 403

    def test_ca1_sem_token_retorna_401(self, client, db):
        """[CA-1] Sem autenticação recebe 401."""
        curso = _criar_curso(db)
        resp = client.post(
            "/api/v1/estudantes",
            json={"nome": "X", "email": "x@test.com", "senha": "abc123", "contato": "9", "curso_id": curso.id},
        )
        assert resp.status_code == 401

    def test_ca2_coordenacao_cria_estudante_ativo(self, client, db):
        """[CA-2] Coordenação cadastra estudante; nasce ATIVO; retorna 201."""
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        curso = _criar_curso(db)
        resp = client.post(
            "/api/v1/estudantes",
            json={"nome": "Maria Silva", "email": "maria@test.com", "senha": "abc123", "contato": "11987", "curso_id": curso.id},
            headers={"Authorization": f"Bearer {_token(coord)}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["situacao"] == "ATIVO"
        assert data["nome"] == "Maria Silva"
        assert data["email"] == "maria@test.com"
        assert data["curso_id"] == curso.id
        assert "id" in data
        assert "usuario_id" in data

    def test_ca3a_email_duplicado_retorna_409(self, client, db):
        """[CA-3a] E-mail duplicado → 409."""
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        curso = _criar_curso(db)
        payload = {"nome": "A", "email": "dup@test.com", "senha": "abc123", "contato": "9", "curso_id": curso.id}
        headers = {"Authorization": f"Bearer {_token(coord)}"}
        client.post("/api/v1/estudantes", json=payload, headers=headers)
        resp = client.post("/api/v1/estudantes", json=payload, headers=headers)
        assert resp.status_code == 409

    def test_ca3b_curso_inexistente_retorna_404(self, client, db):
        """[CA-3b] curso_id inexistente → 404."""
        coord = _criar_usuario(db, "Coord", "coord2@test.com", Perfil.COORDENACAO)
        resp = client.post(
            "/api/v1/estudantes",
            json={"nome": "B", "email": "b@test.com", "senha": "abc123", "contato": "9", "curso_id": 9999},
            headers={"Authorization": f"Bearer {_token(coord)}"},
        )
        assert resp.status_code == 404

    def test_ca3c_campos_invalidos_retorna_400(self, client, db):
        """[CA-3c] Campos faltando/inválidos → 400."""
        coord = _criar_usuario(db, "Coord", "coord3@test.com", Perfil.COORDENACAO)
        # email inválido
        resp = client.post(
            "/api/v1/estudantes",
            json={"nome": "C", "email": "nao-e-email", "senha": "abc123", "contato": "9", "curso_id": 1},
            headers={"Authorization": f"Bearer {_token(coord)}"},
        )
        assert resp.status_code == 400

    def test_ca3c_nome_vazio_retorna_400(self, client, db):
        """[CA-3c] Nome vazio → 400."""
        coord = _criar_usuario(db, "Coord", "coord4@test.com", Perfil.COORDENACAO)
        curso = _criar_curso(db)
        resp = client.post(
            "/api/v1/estudantes",
            json={"nome": "   ", "email": "d@test.com", "senha": "abc123", "contato": "9", "curso_id": curso.id},
            headers={"Authorization": f"Bearer {_token(coord)}"},
        )
        assert resp.status_code == 400

    def test_ca3c_senha_curta_retorna_400(self, client, db):
        """[CA-3c] Senha < 6 chars → 400."""
        coord = _criar_usuario(db, "Coord", "coord5@test.com", Perfil.COORDENACAO)
        curso = _criar_curso(db)
        resp = client.post(
            "/api/v1/estudantes",
            json={"nome": "E", "email": "e@test.com", "senha": "123", "contato": "9", "curso_id": curso.id},
            headers={"Authorization": f"Bearer {_token(coord)}"},
        )
        assert resp.status_code == 400


class TestListarEstudantes:
    """GET /api/v1/estudantes"""

    def test_ca4_coordenacao_lista_estudantes(self, client, db):
        """[CA-4] Coordenação lista os estudantes cadastrados."""
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        curso = _criar_curso(db)
        headers = {"Authorization": f"Bearer {_token(coord)}"}

        # Cria dois estudantes
        client.post("/api/v1/estudantes",
                    json={"nome": "A1", "email": "a1@test.com", "senha": "abc123", "contato": "1", "curso_id": curso.id},
                    headers=headers)
        client.post("/api/v1/estudantes",
                    json={"nome": "A2", "email": "a2@test.com", "senha": "abc123", "contato": "2", "curso_id": curso.id},
                    headers=headers)

        resp = client.get("/api/v1/estudantes", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert all("id" in e and "nome" in e and "email" in e and "situacao" in e for e in data)

    def test_ca4_professor_nao_lista(self, client, db):
        """[CA-4] Professor não tem acesso à listagem → 403."""
        professor = _criar_usuario(db, "Prof", "prof@test.com", Perfil.PROFESSOR)
        resp = client.get(
            "/api/v1/estudantes",
            headers={"Authorization": f"Bearer {_token(professor)}"},
        )
        assert resp.status_code == 403

    def test_ca4_lista_vazia_quando_nenhum_estudante(self, client, db):
        """[CA-4] Lista retorna array vazio quando não há estudantes."""
        coord = _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        resp = client.get(
            "/api/v1/estudantes",
            headers={"Authorization": f"Bearer {_token(coord)}"},
        )
        assert resp.status_code == 200
        assert resp.json() == []
