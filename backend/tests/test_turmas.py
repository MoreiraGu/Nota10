"""
Testes de integração — ACAD-6: Criar turma, vincular professor, matricular aluno.

Critérios de aceite testados:
  [CA-1] POST /turmas cria turma (201)
  [CA-2] POST /turmas retorna 404 se disciplina inexistente
  [CA-3] POST /turmas/{id}/professores vincula professor ativo (201)
  [CA-4] POST /turmas/{id}/professores retorna 422 se professor inativo
  [CA-5] POST /turmas/{id}/professores retorna 409 se professor já vinculado
  [CA-6] POST /turmas/{id}/professores retorna 404 se professor/turma inexistente
  [CA-7] POST /turmas/{id}/matriculas matricula aluno ativo (201)
  [CA-8] POST /turmas/{id}/matriculas retorna 422 se aluno inativo
  [CA-9] POST /turmas/{id}/matriculas retorna 409 se matrícula duplicada
  [CA-10] GET /turmas/{id} retorna detalhe com professores e alunos
  [CA-11] Todos os endpoints exigem perfil COORDENACAO (403 para outros perfis)
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import criar_access_token, hash_senha
from app.main import app

from app.models.curso import Curso
from app.models.disciplina import Disciplina
from app.models.estudante import Estudante, SituacaoEstudante
from app.models.professor import Professor, SituacaoProfessor
from app.models.usuario import Perfil, Usuario

# ── Banco de testes isolado ───────────────────────────────────────────────────

engine_test = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    s = TestingSessionLocal()
    try:
        yield s
    finally:
        s.close()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _usuario(db, nome, email, perfil) -> Usuario:
    u = Usuario(nome=nome, email=email, senha_hash=hash_senha("senha123"), perfil=perfil, ativo=True)
    db.add(u); db.commit(); db.refresh(u)
    return u

def _headers(u: Usuario) -> dict:
    token = criar_access_token({"sub": str(u.id), "perfil": u.perfil.value})
    return {"Authorization": f"Bearer {token}"}

def _curso(db) -> Curso:
    c = Curso(nome="DSM"); db.add(c); db.commit(); db.refresh(c)
    return c

def _disciplina(db, curso) -> Disciplina:
    d = Disciplina(nome="Programação Web", curso_id=curso.id)
    db.add(d); db.commit(); db.refresh(d)
    return d

def _professor(db, inativo=False) -> tuple:
    import uuid
    uid = uuid.uuid4().hex[:6]
    u = _usuario(db, f"Prof {uid}", f"prof.{uid}@test.com", Perfil.PROFESSOR)
    p = Professor(usuario_id=u.id, situacao=SituacaoProfessor.INATIVO if inativo else SituacaoProfessor.ATIVO)
    db.add(p); db.commit(); db.refresh(p)
    return u, p

def _aluno(db, inativo=False) -> tuple:
    import uuid
    uid = uuid.uuid4().hex[:6]
    curso = _curso(db)
    u = _usuario(db, f"Aluno {uid}", f"aluno.{uid}@test.com", Perfil.ALUNO)
    e = Estudante(usuario_id=u.id, curso_id=curso.id,
                  situacao=SituacaoEstudante.INATIVO if inativo else SituacaoEstudante.ATIVO)
    db.add(e); db.commit(); db.refresh(e)
    return u, e


# ── POST /turmas ──────────────────────────────────────────────────────────────

class TestCriarTurma:

    def test_cria_turma_com_disciplina_existente(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        curso = _curso(db)
        disc = _disciplina(db, curso)

        resp = client.post("/api/v1/turmas", json={
            "disciplina_id": disc.id,
            "periodo_letivo": "2026.2",
        }, headers=_headers(coord))

        assert resp.status_code == 201
        data = resp.json()
        assert data["disciplina_id"] == disc.id
        assert data["periodo_letivo"] == "2026.2"
        assert data["situacao"] == "ATIVA"

    def test_disciplina_inexistente_retorna_404(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)

        resp = client.post("/api/v1/turmas", json={
            "disciplina_id": 9999,
            "periodo_letivo": "2026.2",
        }, headers=_headers(coord))

        assert resp.status_code == 404

    def test_professor_nao_pode_criar_turma(self, client, db):
        u_prof, _ = _professor(db)

        resp = client.post("/api/v1/turmas", json={
            "disciplina_id": 1,
            "periodo_letivo": "2026.2",
        }, headers=_headers(u_prof))

        assert resp.status_code == 403

    def test_aluno_nao_pode_criar_turma(self, client, db):
        u_aluno, _ = _aluno(db)

        resp = client.post("/api/v1/turmas", json={
            "disciplina_id": 1,
            "periodo_letivo": "2026.2",
        }, headers=_headers(u_aluno))

        assert resp.status_code == 403

    def test_sem_token_retorna_401(self, client):
        resp = client.post("/api/v1/turmas", json={
            "disciplina_id": 1,
            "periodo_letivo": "2026.2",
        })
        assert resp.status_code == 401

class TestListarTurmas:

    def test_coordenacao_lista_turmas(self, client, db):
        coord = _usuario(
            db,
            "Coord",
            "coord.lista@test.com",
            Perfil.COORDENACAO,
        )

        headers = _headers(coord)

        curso = _curso(db)
        disciplina = _disciplina(db, curso)

        primeira = client.post(
            "/api/v1/turmas",
            json={
                "disciplina_id": disciplina.id,
                "periodo_letivo": "2026.1",
            },
            headers=headers,
        )

        segunda = client.post(
            "/api/v1/turmas",
            json={
                "disciplina_id": disciplina.id,
                "periodo_letivo": "2026.2",
            },
            headers=headers,
        )

        assert primeira.status_code == 201
        assert segunda.status_code == 201

        resp = client.get(
            "/api/v1/turmas",
            headers=headers,
        )

        assert resp.status_code == 200

        data = resp.json()

        assert len(data) == 2

        ids = {turma["id"] for turma in data}

        assert primeira.json()["id"] in ids
        assert segunda.json()["id"] in ids


    def test_professor_nao_pode_listar_todas_as_turmas(
        self,
        client,
        db,
    ):
        professor, _ = _professor(db)

        resp = client.get(
            "/api/v1/turmas",
            headers=_headers(professor),
        )

        assert resp.status_code == 403


    def test_sem_token_retorna_401(self, client):
        resp = client.get("/api/v1/turmas")

        assert resp.status_code == 401


# ── POST /turmas/{id}/professores ─────────────────────────────────────────────

def _criar_turma(client, db, headers):
    curso = _curso(db)
    disc = _disciplina(db, curso)
    resp = client.post("/api/v1/turmas", json={
        "disciplina_id": disc.id, "periodo_letivo": "2026.2"
    }, headers=headers)
    return resp.json()["id"]


class TestVincularProfessor:

    def test_vincula_professor_ativo(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        headers = _headers(coord)
        turma_id = _criar_turma(client, db, headers)
        _, prof = _professor(db)

        resp = client.post(f"/api/v1/turmas/{turma_id}/professores",
                           json={"professor_id": prof.id}, headers=headers)

        assert resp.status_code == 201
        data = resp.json()
        assert data["turma_id"] == turma_id
        assert data["professor_id"] == prof.id

    def test_professor_inativo_retorna_422(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        headers = _headers(coord)
        turma_id = _criar_turma(client, db, headers)
        _, prof_inativo = _professor(db, inativo=True)

        resp = client.post(f"/api/v1/turmas/{turma_id}/professores",
                           json={"professor_id": prof_inativo.id}, headers=headers)

        assert resp.status_code == 422

    def test_professor_ja_vinculado_retorna_409(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        headers = _headers(coord)
        turma_id = _criar_turma(client, db, headers)
        _, prof = _professor(db)

        client.post(f"/api/v1/turmas/{turma_id}/professores",
                    json={"professor_id": prof.id}, headers=headers)

        resp = client.post(f"/api/v1/turmas/{turma_id}/professores",
                           json={"professor_id": prof.id}, headers=headers)

        assert resp.status_code == 409

    def test_professor_inexistente_retorna_404(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        headers = _headers(coord)
        turma_id = _criar_turma(client, db, headers)

        resp = client.post(f"/api/v1/turmas/{turma_id}/professores",
                           json={"professor_id": 9999}, headers=headers)

        assert resp.status_code == 404

    def test_turma_inexistente_retorna_404(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        _, prof = _professor(db)

        resp = client.post("/api/v1/turmas/9999/professores",
                           json={"professor_id": prof.id}, headers=_headers(coord))

        assert resp.status_code == 404


# ── POST /turmas/{id}/matriculas ──────────────────────────────────────────────

class TestMatricularAluno:

    def test_matricula_aluno_ativo(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        headers = _headers(coord)
        turma_id = _criar_turma(client, db, headers)
        _, estudante = _aluno(db)

        resp = client.post(f"/api/v1/turmas/{turma_id}/matriculas",
                           json={"aluno_id": estudante.id}, headers=headers)

        assert resp.status_code == 201
        data = resp.json()
        assert data["turma_id"] == turma_id
        assert data["aluno_id"] == estudante.id

    def test_aluno_inativo_retorna_422(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        headers = _headers(coord)
        turma_id = _criar_turma(client, db, headers)
        _, aluno_inativo = _aluno(db, inativo=True)

        resp = client.post(f"/api/v1/turmas/{turma_id}/matriculas",
                           json={"aluno_id": aluno_inativo.id}, headers=headers)

        assert resp.status_code == 422

    def test_matricula_duplicada_retorna_409(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        headers = _headers(coord)
        turma_id = _criar_turma(client, db, headers)
        _, estudante = _aluno(db)

        client.post(f"/api/v1/turmas/{turma_id}/matriculas",
                    json={"aluno_id": estudante.id}, headers=headers)

        resp = client.post(f"/api/v1/turmas/{turma_id}/matriculas",
                           json={"aluno_id": estudante.id}, headers=headers)

        assert resp.status_code == 409

    def test_aluno_inexistente_retorna_404(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        headers = _headers(coord)
        turma_id = _criar_turma(client, db, headers)

        resp = client.post(f"/api/v1/turmas/{turma_id}/matriculas",
                           json={"aluno_id": 9999}, headers=headers)

        assert resp.status_code == 404

    def test_turma_inexistente_retorna_404(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        _, estudante = _aluno(db)

        resp = client.post("/api/v1/turmas/9999/matriculas",
                           json={"aluno_id": estudante.id}, headers=_headers(coord))

        assert resp.status_code == 404


# ── GET /turmas/{id} ──────────────────────────────────────────────────────────

class TestGetTurma:

    def test_retorna_turma_com_professores_e_alunos(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        headers = _headers(coord)
        turma_id = _criar_turma(client, db, headers)
        _, prof = _professor(db)
        _, estudante = _aluno(db)

        client.post(f"/api/v1/turmas/{turma_id}/professores",
                    json={"professor_id": prof.id}, headers=headers)
        client.post(f"/api/v1/turmas/{turma_id}/matriculas",
                    json={"aluno_id": estudante.id}, headers=headers)

        resp = client.get(f"/api/v1/turmas/{turma_id}", headers=headers)

        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == turma_id
        assert data["periodo_letivo"] == "2026.2"
        assert len(data["professores"]) == 1
        assert data["professores"][0]["id"] == prof.id
        assert len(data["alunos"]) == 1
        assert data["alunos"][0]["id"] == estudante.id

    def test_turma_sem_professores_e_alunos(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)
        headers = _headers(coord)
        turma_id = _criar_turma(client, db, headers)

        resp = client.get(f"/api/v1/turmas/{turma_id}", headers=headers)

        assert resp.status_code == 200
        data = resp.json()
        assert data["professores"] == []
        assert data["alunos"] == []

    def test_turma_inexistente_retorna_404(self, client, db):
        coord = _usuario(db, "Coord", "coord@test.com", Perfil.COORDENACAO)

        resp = client.get("/api/v1/turmas/9999", headers=_headers(coord))

        assert resp.status_code == 404
