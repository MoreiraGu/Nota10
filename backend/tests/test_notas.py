"""
Testes de integração — ACAD-7: Lançar notas e calcular média (Template Method).

Critérios de aceite testados:
  [CA-1] POST /turmas/{id}/notas lança nota (201)
  [CA-2] Professor não vinculado recebe 403
  [CA-3] Aluno não matriculado recebe 404
  [CA-4] Nota < 0 retorna 400 (validação Pydantic → 422)
  [CA-5] Nota > 10 retorna 400 (validação Pydantic → 422)
  [CA-6] Peso <= 0 retorna 422
  [CA-7] GET /turmas/{id}/alunos/{id}/media retorna notas e média calculada
  [CA-8] Média ponderada correta com diferentes pesos
  [CA-9] Média None quando nenhuma nota lançada
  [CA-10] Professor não vinculado à turma não pode consultar média
"""

import uuid

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
from app.models.estudante import Estudante
from app.models.matricula import Matricula
from app.models.professor import Professor
from app.models.turma import Turma
from app.models.turma_professor import TurmaProfessor
from app.models.usuario import Perfil, Usuario

# ── Setup ─────────────────────────────────────────────────────────────────────

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

def _uid() -> str:
    return uuid.uuid4().hex[:6]


def _usuario(db, nome, email, perfil) -> Usuario:
    u = Usuario(nome=nome, email=email, senha_hash=hash_senha("senha123"), perfil=perfil, ativo=True)
    db.add(u); db.commit(); db.refresh(u)
    return u


def _headers(u: Usuario) -> dict:
    token = criar_access_token({"sub": str(u.id), "perfil": u.perfil.value})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def cenario(db):
    """Cria o cenário completo: professor vinculado + aluno matriculado."""
    uid = _uid()

    # Usuários
    u_coord = _usuario(db, "Coord", f"coord.{uid}@test.com", Perfil.COORDENACAO)
    u_prof = _usuario(db, "Prof", f"prof.{uid}@test.com", Perfil.PROFESSOR)
    u_aluno = _usuario(db, "Aluno", f"aluno.{uid}@test.com", Perfil.ALUNO)

    # Entidades
    curso = Curso(nome="DSM"); db.add(curso); db.commit(); db.refresh(curso)
    disc = Disciplina(nome="Web", curso_id=curso.id); db.add(disc); db.commit(); db.refresh(disc)
    prof = Professor(usuario_id=u_prof.id); db.add(prof); db.commit(); db.refresh(prof)
    aluno = Estudante(usuario_id=u_aluno.id, curso_id=curso.id); db.add(aluno); db.commit(); db.refresh(aluno)
    turma = Turma(disciplina_id=disc.id, periodo_letivo="2026.2"); db.add(turma); db.commit(); db.refresh(turma)

    # Vínculos
    vinculo = TurmaProfessor(turma_id=turma.id, professor_id=prof.id); db.add(vinculo); db.commit()
    matricula = Matricula(turma_id=turma.id, estudante_id=aluno.id); db.add(matricula); db.commit()

    return {
        "u_coord": u_coord,
        "u_prof": u_prof,
        "u_aluno": u_aluno,
        "prof": prof,
        "aluno": aluno,
        "turma": turma,
        "disc": disc,
    }


# ── POST /turmas/{id}/notas ───────────────────────────────────────────────────

class TestLancarNota:

    def test_professor_vinculado_lanca_nota(self, client, cenario):
        turma = cenario["turma"]
        aluno = cenario["aluno"]
        headers = _headers(cenario["u_prof"])

        resp = client.post(f"/api/v1/turmas/{turma.id}/notas", json={
            "aluno_id": aluno.id,
            "tipo_avaliacao": "Prova 1",
            "peso": 1.0,
            "valor": 8.5,
        }, headers=headers)

        assert resp.status_code == 201
        data = resp.json()
        assert data["aluno_id"] == aluno.id
        assert data["turma_id"] == turma.id
        assert data["tipo_avaliacao"] == "Prova 1"
        assert data["valor"] == 8.5
        assert data["peso"] == 1.0
        assert "professor_lancador_id" in data
        assert "data_lancamento" in data

    def test_professor_nao_vinculado_recebe_403(self, client, db, cenario):
        turma = cenario["turma"]
        aluno = cenario["aluno"]

        # Cria professor diferente, sem vínculo
        uid = _uid()
        u_outro = _usuario(db, f"Outro {uid}", f"outro.{uid}@test.com", Perfil.PROFESSOR)
        outro_prof = Professor(usuario_id=u_outro.id); db.add(outro_prof); db.commit()

        resp = client.post(f"/api/v1/turmas/{turma.id}/notas", json={
            "aluno_id": aluno.id,
            "tipo_avaliacao": "Prova 1",
            "peso": 1.0,
            "valor": 7.0,
        }, headers=_headers(u_outro))

        assert resp.status_code == 403

    def test_aluno_nao_matriculado_recebe_404(self, client, cenario):
        turma = cenario["turma"]
        headers = _headers(cenario["u_prof"])

        resp = client.post(f"/api/v1/turmas/{turma.id}/notas", json={
            "aluno_id": 9999,
            "tipo_avaliacao": "Prova 1",
            "peso": 1.0,
            "valor": 7.0,
        }, headers=headers)

        assert resp.status_code == 404

    def test_nota_acima_de_10_retorna_422(self, client, cenario):
        turma = cenario["turma"]
        aluno = cenario["aluno"]
        headers = _headers(cenario["u_prof"])

        resp = client.post(f"/api/v1/turmas/{turma.id}/notas", json={
            "aluno_id": aluno.id,
            "tipo_avaliacao": "Prova 1",
            "peso": 1.0,
            "valor": 11.0,
        }, headers=headers)

        assert resp.status_code == 422

    def test_nota_negativa_retorna_422(self, client, cenario):
        turma = cenario["turma"]
        aluno = cenario["aluno"]
        headers = _headers(cenario["u_prof"])

        resp = client.post(f"/api/v1/turmas/{turma.id}/notas", json={
            "aluno_id": aluno.id,
            "tipo_avaliacao": "Prova 1",
            "peso": 1.0,
            "valor": -1.0,
        }, headers=headers)

        assert resp.status_code == 422

    def test_peso_invalido_retorna_422(self, client, cenario):
        turma = cenario["turma"]
        aluno = cenario["aluno"]
        headers = _headers(cenario["u_prof"])

        resp = client.post(f"/api/v1/turmas/{turma.id}/notas", json={
            "aluno_id": aluno.id,
            "tipo_avaliacao": "Prova 1",
            "peso": -1.0,
            "valor": 8.0,
        }, headers=headers)

        assert resp.status_code == 422

    def test_turma_inexistente_retorna_404(self, client, cenario):
        headers = _headers(cenario["u_prof"])
        aluno = cenario["aluno"]

        resp = client.post("/api/v1/turmas/9999/notas", json={
            "aluno_id": aluno.id,
            "tipo_avaliacao": "Prova 1",
            "peso": 1.0,
            "valor": 7.0,
        }, headers=headers)

        assert resp.status_code == 404

    def test_aluno_nao_pode_lancar_nota(self, client, cenario):
        turma = cenario["turma"]
        aluno = cenario["aluno"]

        resp = client.post(f"/api/v1/turmas/{turma.id}/notas", json={
            "aluno_id": aluno.id,
            "tipo_avaliacao": "Prova 1",
            "peso": 1.0,
            "valor": 7.0,
        }, headers=_headers(cenario["u_aluno"]))

        assert resp.status_code == 403


# ── GET /turmas/{id}/alunos/{id}/media ───────────────────────────────────────

class TestMedia:

    def test_media_none_sem_notas(self, client, cenario):
        turma = cenario["turma"]
        aluno = cenario["aluno"]
        headers = _headers(cenario["u_prof"])

        resp = client.get(f"/api/v1/turmas/{turma.id}/alunos/{aluno.id}/media",
                          headers=headers)

        assert resp.status_code == 200
        data = resp.json()
        assert data["media_final"] is None
        assert data["notas"] == []

    def test_media_simples(self, client, cenario):
        turma = cenario["turma"]
        aluno = cenario["aluno"]
        headers = _headers(cenario["u_prof"])

        for tipo, valor in [("P1", 8.0), ("P2", 6.0)]:
            client.post(f"/api/v1/turmas/{turma.id}/notas", json={
                "aluno_id": aluno.id, "tipo_avaliacao": tipo,
                "peso": 1.0, "valor": valor,
            }, headers=headers)

        resp = client.get(f"/api/v1/turmas/{turma.id}/alunos/{aluno.id}/media",
                          headers=headers)

        assert resp.status_code == 200
        data = resp.json()
        assert data["media_final"] == 7.0  # (8+6)/2 com peso=1 cada
        assert len(data["notas"]) == 2

    def test_media_ponderada_com_pesos_diferentes(self, client, cenario):
        turma = cenario["turma"]
        aluno = cenario["aluno"]
        headers = _headers(cenario["u_prof"])

        # P1 peso 2, valor 10 → contribui 20
        # P2 peso 1, valor 4  → contribui 4
        # Média = (10*2 + 4*1) / (2+1) = 24/3 = 8.0
        client.post(f"/api/v1/turmas/{turma.id}/notas", json={
            "aluno_id": aluno.id, "tipo_avaliacao": "P1", "peso": 2.0, "valor": 10.0,
        }, headers=headers)
        client.post(f"/api/v1/turmas/{turma.id}/notas", json={
            "aluno_id": aluno.id, "tipo_avaliacao": "P2", "peso": 1.0, "valor": 4.0,
        }, headers=headers)

        resp = client.get(f"/api/v1/turmas/{turma.id}/alunos/{aluno.id}/media",
                          headers=headers)

        assert resp.status_code == 200
        assert resp.json()["media_final"] == 8.0

    def test_calculo_ocorre_no_backend(self, client, cenario):
        """Garante que a média retornada é calculada pelo backend (Template Method),
        não inventada pelo frontend. Verificamos que o resultado bate exatamente
        com a fórmula de média ponderada implementada em MediaPonderada."""
        from app.services.calculo_media import MediaPonderada

        turma = cenario["turma"]
        aluno = cenario["aluno"]
        headers = _headers(cenario["u_prof"])

        lancamentos = [
            {"tipo_avaliacao": "P1", "peso": 3.0, "valor": 9.0},
            {"tipo_avaliacao": "P2", "peso": 2.0, "valor": 7.5},
            {"tipo_avaliacao": "T1", "peso": 1.0, "valor": 6.0},
        ]
        for l in lancamentos:
            client.post(f"/api/v1/turmas/{turma.id}/notas",
                        json={"aluno_id": aluno.id, **l}, headers=headers)

        resp = client.get(f"/api/v1/turmas/{turma.id}/alunos/{aluno.id}/media",
                          headers=headers)

        data = resp.json()
        assert resp.status_code == 200

        # Cálculo manual para validar
        soma_pond = 9.0 * 3.0 + 7.5 * 2.0 + 6.0 * 1.0  # = 48.0
        soma_pesos = 3.0 + 2.0 + 1.0  # = 6.0
        esperada = round(soma_pond / soma_pesos, 2)  # = 8.0

        assert data["media_final"] == esperada

    def test_aluno_nao_matriculado_retorna_404(self, client, cenario):
        turma = cenario["turma"]
        headers = _headers(cenario["u_prof"])

        resp = client.get(f"/api/v1/turmas/{turma.id}/alunos/9999/media",
                          headers=headers)

        assert resp.status_code == 404

    def test_professor_nao_vinculado_retorna_403(self, client, db, cenario):
        turma = cenario["turma"]
        aluno = cenario["aluno"]

        uid = _uid()
        u_outro = _usuario(db, f"Out {uid}", f"out.{uid}@test.com", Perfil.PROFESSOR)
        outro_prof = Professor(usuario_id=u_outro.id); db.add(outro_prof); db.commit()

        resp = client.get(f"/api/v1/turmas/{turma.id}/alunos/{aluno.id}/media",
                          headers=_headers(u_outro))

        assert resp.status_code == 403
