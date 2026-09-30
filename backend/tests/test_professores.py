"""
Testes de integração — professores

ACAD-4 (cadastro e listagem):
  [CA-1] Somente Coordenação cadastra professor (outro perfil → 403)
  [CA-2] Professor nasce ATIVO; cria usuário (perfil PROFESSOR) + professor
  [CA-3] E-mail duplicado → 409; campos inválidos → 400
  [CA-4] Coordenação lista os professores cadastrados

Edição (backlog #12):
  GET /professores/{id}, PUT /professores/{id}, PATCH /professores/{id}/inativar
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


# ── Fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def setup_db():
    """Aplica o override do banco só durante cada teste deste módulo e restaura depois,
    para não interferir em outros arquivos de teste que usam outro engine em memória."""
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


@pytest.fixture
def coord(db):
    return _criar_usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)


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


def _cadastrar(client, coord, **over) -> dict:
    resp = client.post("/api/v1/professores", json=_payload(**over), headers=_headers(coord))
    assert resp.status_code == 201, resp.text
    return resp.json()


def _login(client, email, senha):
    return client.post("/api/v1/auth/login", json={"email": email, "senha": senha})


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

    def test_ca2_coordenacao_cria_professor_ativo(self, client, coord):
        resp = client.post("/api/v1/professores", json=_payload(), headers=_headers(coord))

        assert resp.status_code == 201
        data = resp.json()
        assert data["situacao"] == "ATIVO"
        assert data["nome"] == "Ana Martins"
        assert data["email"] == "ana@test.com"
        assert data["contato"] == "11987654321"
        assert "id" in data and "usuario_id" in data
        assert "senha" not in data and "senha_hash" not in data

    def test_ca2_cria_usuario_com_perfil_professor(self, client, db, coord):
        _cadastrar(client, coord)

        usuario = db.query(Usuario).filter(Usuario.email == "ana@test.com").one()
        assert usuario.perfil == Perfil.PROFESSOR
        assert usuario.ativo is True
        assert db.query(Professor).filter(Professor.usuario_id == usuario.id).count() == 1

    def test_ca2_professor_criado_consegue_logar(self, client, coord):
        _cadastrar(client, coord)
        login = _login(client, "ana@test.com", "abc123")
        assert login.status_code == 200
        assert login.json()["perfil"] == "PROFESSOR"

    def test_ca3_email_duplicado_retorna_409(self, client, coord):
        _cadastrar(client, coord)
        resp = client.post("/api/v1/professores", json=_payload(), headers=_headers(coord))
        assert resp.status_code == 409

    def test_ca3_email_de_outro_perfil_tambem_retorna_409(self, client, coord):
        resp = client.post(
            "/api/v1/professores", json=_payload(email="coord@test.com"), headers=_headers(coord)
        )
        assert resp.status_code == 409

    def test_ca3_email_invalido_retorna_400(self, client, coord):
        resp = client.post(
            "/api/v1/professores", json=_payload(email="nao-e-email"), headers=_headers(coord)
        )
        assert resp.status_code == 400
        body = resp.json()
        assert body["code"] == "VALIDATION_ERROR"
        assert "email" in body["fields"]

    def test_ca3_nome_vazio_retorna_400(self, client, coord):
        resp = client.post("/api/v1/professores", json=_payload(nome="   "), headers=_headers(coord))
        assert resp.status_code == 400

    def test_ca3_senha_curta_retorna_400(self, client, coord):
        resp = client.post("/api/v1/professores", json=_payload(senha="123"), headers=_headers(coord))
        assert resp.status_code == 400

    def test_ca3_campo_obrigatorio_ausente_retorna_400(self, client, coord):
        resp = client.post(
            "/api/v1/professores",
            json={"nome": "Sem e-mail", "senha": "abc123"},
            headers=_headers(coord),
        )
        assert resp.status_code == 400


# ── GET (lista) ───────────────────────────────────────────────────────────

class TestListarProfessores:
    """GET /api/v1/professores"""

    def test_ca4_coordenacao_lista_professores(self, client, coord):
        _cadastrar(client, coord, nome="Zélia", email="z@test.com")
        _cadastrar(client, coord, nome="Alberto", email="a@test.com")

        resp = client.get("/api/v1/professores", headers=_headers(coord))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert all({"id", "nome", "email", "situacao"} <= set(p) for p in data)
        assert [p["nome"] for p in data] == ["Alberto", "Zélia"]  # ordem alfabética

    def test_ca4_nao_lista_coordenacao_nem_alunos(self, client, db, coord):
        _criar_usuario(db, "Aluno", "aluno@test.com", Perfil.ALUNO)
        resp = client.get("/api/v1/professores", headers=_headers(coord))
        assert resp.json() == []

    def test_ca4_professor_nao_lista(self, client, db):
        prof = _criar_usuario(db, "Prof", "prof@test.com", Perfil.PROFESSOR)
        resp = client.get("/api/v1/professores", headers=_headers(prof))
        assert resp.status_code == 403

    def test_ca4_sem_token_retorna_401(self, client):
        assert client.get("/api/v1/professores").status_code == 401

    def test_ca4_lista_vazia_quando_nenhum_professor(self, client, coord):
        resp = client.get("/api/v1/professores", headers=_headers(coord))
        assert resp.status_code == 200
        assert resp.json() == []


# ── GET (por id) ──────────────────────────────────────────────────────────

class TestObterProfessor:
    """GET /api/v1/professores/{id}"""

    def test_coordenacao_obtem_professor(self, client, coord):
        criado = _cadastrar(client, coord)
        resp = client.get(f"/api/v1/professores/{criado['id']}", headers=_headers(coord))
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == criado["id"]
        assert data["nome"] == "Ana Martins"
        assert data["email"] == "ana@test.com"
        assert data["contato"] == "11987654321"
        assert data["situacao"] == "ATIVO"

    def test_inexistente_retorna_404(self, client, coord):
        resp = client.get("/api/v1/professores/9999", headers=_headers(coord))
        assert resp.status_code == 404

    def test_professor_nao_obtem(self, client, db, coord):
        criado = _cadastrar(client, coord)
        prof = _criar_usuario(db, "Outro", "outro@test.com", Perfil.PROFESSOR)
        resp = client.get(f"/api/v1/professores/{criado['id']}", headers=_headers(prof))
        assert resp.status_code == 403

    def test_sem_token_retorna_401(self, client):
        assert client.get("/api/v1/professores/1").status_code == 401


# ── PUT ───────────────────────────────────────────────────────────────────

class TestAtualizarProfessor:
    """PUT /api/v1/professores/{id}"""

    def test_atualiza_nome_e_contato(self, client, coord):
        criado = _cadastrar(client, coord)
        resp = client.put(
            f"/api/v1/professores/{criado['id']}",
            json={"nome": "  Ana Souza  ", "contato": "21999998888"},
            headers=_headers(coord),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["nome"] == "Ana Souza"
        assert data["contato"] == "21999998888"
        assert data["email"] == "ana@test.com"  # não enviado → não muda

        lista = client.get("/api/v1/professores", headers=_headers(coord)).json()
        assert lista[0]["nome"] == "Ana Souza"

    def test_atualiza_email_e_login_usa_o_novo(self, client, coord):
        criado = _cadastrar(client, coord)
        resp = client.put(
            f"/api/v1/professores/{criado['id']}",
            json={"email": "nova@test.com"},
            headers=_headers(coord),
        )
        assert resp.status_code == 200
        assert _login(client, "nova@test.com", "abc123").status_code == 200
        assert _login(client, "ana@test.com", "abc123").status_code == 401

    def test_reenviar_o_proprio_email_nao_conflita(self, client, coord):
        criado = _cadastrar(client, coord)
        resp = client.put(
            f"/api/v1/professores/{criado['id']}",
            json={"nome": "Ana M.", "email": "ana@test.com"},
            headers=_headers(coord),
        )
        assert resp.status_code == 200

    def test_email_de_outro_usuario_retorna_409(self, client, coord):
        _cadastrar(client, coord, email="a@test.com", nome="A")
        b = _cadastrar(client, coord, email="b@test.com", nome="B")
        resp = client.put(
            f"/api/v1/professores/{b['id']}", json={"email": "a@test.com"}, headers=_headers(coord)
        )
        assert resp.status_code == 409

    def test_troca_de_senha(self, client, coord):
        criado = _cadastrar(client, coord)
        resp = client.put(
            f"/api/v1/professores/{criado['id']}",
            json={"senha": "novasenha1"},
            headers=_headers(coord),
        )
        assert resp.status_code == 200
        assert _login(client, "ana@test.com", "novasenha1").status_code == 200
        assert _login(client, "ana@test.com", "abc123").status_code == 401

    def test_senha_em_branco_mantem_a_atual(self, client, coord):
        criado = _cadastrar(client, coord)
        resp = client.put(
            f"/api/v1/professores/{criado['id']}",
            json={"nome": "Ana X", "senha": ""},
            headers=_headers(coord),
        )
        assert resp.status_code == 200
        assert _login(client, "ana@test.com", "abc123").status_code == 200

    def test_senha_curta_retorna_400(self, client, coord):
        criado = _cadastrar(client, coord)
        resp = client.put(
            f"/api/v1/professores/{criado['id']}", json={"senha": "123"}, headers=_headers(coord)
        )
        assert resp.status_code == 400
        assert "senha" in resp.json()["fields"]

    def test_nome_vazio_retorna_400(self, client, coord):
        criado = _cadastrar(client, coord)
        resp = client.put(
            f"/api/v1/professores/{criado['id']}", json={"nome": "  "}, headers=_headers(coord)
        )
        assert resp.status_code == 400

    def test_email_invalido_retorna_400(self, client, coord):
        criado = _cadastrar(client, coord)
        resp = client.put(
            f"/api/v1/professores/{criado['id']}", json={"email": "xx"}, headers=_headers(coord)
        )
        assert resp.status_code == 400

    def test_situacao_invalida_retorna_400(self, client, coord):
        criado = _cadastrar(client, coord)
        resp = client.put(
            f"/api/v1/professores/{criado['id']}", json={"situacao": "TALVEZ"}, headers=_headers(coord)
        )
        assert resp.status_code == 400

    def test_inexistente_retorna_404(self, client, coord):
        resp = client.put("/api/v1/professores/9999", json={"nome": "X"}, headers=_headers(coord))
        assert resp.status_code == 404

    def test_professor_nao_atualiza(self, client, db, coord):
        criado = _cadastrar(client, coord)
        prof = _criar_usuario(db, "Outro", "outro@test.com", Perfil.PROFESSOR)
        resp = client.put(
            f"/api/v1/professores/{criado['id']}", json={"nome": "X"}, headers=_headers(prof)
        )
        assert resp.status_code == 403

    def test_sem_token_retorna_401(self, client):
        assert client.put("/api/v1/professores/1", json={"nome": "X"}).status_code == 401


# ── Inativar / reativar ───────────────────────────────────────────────────

class TestInativarProfessor:
    """PATCH /api/v1/professores/{id}/inativar  e  PUT com situacao"""

    def test_inativar_bloqueia_login_e_mantem_na_lista(self, client, db, coord):
        criado = _cadastrar(client, coord)
        resp = client.patch(f"/api/v1/professores/{criado['id']}/inativar", headers=_headers(coord))

        assert resp.status_code == 200
        data = resp.json()
        assert data["situacao"] == "INATIVO"
        assert data["contato"] == "11987654321"  # resposta completa

        db.expire_all()
        usuario = db.query(Usuario).filter(Usuario.email == "ana@test.com").one()
        assert usuario.ativo is False

        assert _login(client, "ana@test.com", "abc123").status_code == 403

        lista = client.get("/api/v1/professores", headers=_headers(coord)).json()
        assert len(lista) == 1
        assert lista[0]["situacao"] == "INATIVO"

    def test_reativar_via_put_libera_o_login(self, client, coord):
        criado = _cadastrar(client, coord)
        client.patch(f"/api/v1/professores/{criado['id']}/inativar", headers=_headers(coord))

        resp = client.put(
            f"/api/v1/professores/{criado['id']}", json={"situacao": "ATIVO"}, headers=_headers(coord)
        )
        assert resp.status_code == 200
        assert resp.json()["situacao"] == "ATIVO"
        assert _login(client, "ana@test.com", "abc123").status_code == 200

    def test_inativar_via_put_tambem_desativa_o_login(self, client, coord):
        criado = _cadastrar(client, coord)
        resp = client.put(
            f"/api/v1/professores/{criado['id']}", json={"situacao": "inativo"}, headers=_headers(coord)
        )
        assert resp.status_code == 200
        assert resp.json()["situacao"] == "INATIVO"
        assert _login(client, "ana@test.com", "abc123").status_code == 403

    def test_inativar_inexistente_retorna_404(self, client, coord):
        resp = client.patch("/api/v1/professores/9999/inativar", headers=_headers(coord))
        assert resp.status_code == 404

    def test_professor_nao_inativa(self, client, db, coord):
        criado = _cadastrar(client, coord)
        prof = _criar_usuario(db, "Outro", "outro@test.com", Perfil.PROFESSOR)
        resp = client.patch(f"/api/v1/professores/{criado['id']}/inativar", headers=_headers(prof))
        assert resp.status_code == 403

    def test_sem_token_retorna_401(self, client):
        assert client.patch("/api/v1/professores/1/inativar").status_code == 401