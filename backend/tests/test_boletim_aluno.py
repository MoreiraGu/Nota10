"""
Testes de integração — boletim do aluno

Critérios de aceite:
  [CA-1] O boletim é do usuário do token; não há ID de aluno na URL.
  [CA-2] Retorna notas, média final e percentual de frequência
         de cada turma matriculada.
  [CA-3] Perfil diferente de ALUNO recebe 403.
  [CA-4] Aluno não vê dados de outros alunos nem edita dados acadêmicos.
"""

import os
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
from app.models.frequencia import Frequencia
from app.models.matricula import Matricula
from app.models.nota import Nota
from app.models.professor import Professor
from app.models.turma import Turma
from app.models.usuario import Perfil, Usuario


# ── Banco de testes isolado ───────────────────────────────────────────────

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "sqlite:///:memory:",
)

is_sqlite = TEST_DATABASE_URL.startswith("sqlite")

_connect_args = (
    {"check_same_thread": False}
    if is_sqlite
    else {}
)

_pool_kwargs = (
    {"poolclass": StaticPool}
    if is_sqlite
    else {}
)

engine_test = create_engine(
    TEST_DATABASE_URL,
    connect_args=_connect_args,
    **_pool_kwargs,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine_test,
)


def override_get_db():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


# ── Fixtures ──────────────────────────────────────────────────────────────


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


# ── Helpers ───────────────────────────────────────────────────────────────


def _criar_usuario(
    db,
    nome: str,
    email: str,
    perfil: Perfil,
) -> Usuario:
    usuario = Usuario(
        nome=nome,
        email=email,
        senha_hash=hash_senha("senha123"),
        perfil=perfil,
        ativo=True,
    )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return usuario


def _headers(usuario: Usuario) -> dict:
    token = criar_access_token(
        {
            "sub": str(usuario.id),
            "perfil": usuario.perfil.value,
        }
    )

    return {
        "Authorization": f"Bearer {token}"
    }


def _criar_aluno(
    db,
    nome: str,
    email: str,
    curso: Curso,
):
    usuario = _criar_usuario(
        db,
        nome,
        email,
        Perfil.ALUNO,
    )

    estudante = Estudante(
        usuario_id=usuario.id,
        curso_id=curso.id,
        contato="11999999999",
    )

    db.add(estudante)
    db.commit()
    db.refresh(estudante)

    return usuario, estudante


def _criar_curso(db, nome="DSM") -> Curso:
    curso = Curso(nome=nome)

    db.add(curso)
    db.commit()
    db.refresh(curso)

    return curso


def _criar_turma(
    db,
    curso: Curso,
    nome_disciplina: str,
    periodo="2026.2",
):
    disciplina = Disciplina(
        nome=nome_disciplina,
        curso_id=curso.id,
    )

    db.add(disciplina)
    db.commit()
    db.refresh(disciplina)

    turma = Turma(
        disciplina_id=disciplina.id,
        periodo_letivo=periodo,
    )

    db.add(turma)
    db.commit()
    db.refresh(turma)

    return turma


def _matricular(db, estudante, turma):
    matricula = Matricula(
        estudante_id=estudante.id,
        turma_id=turma.id,
    )

    db.add(matricula)
    db.commit()
    db.refresh(matricula)

    return matricula


def _criar_professor_simples(db) -> Professor:
    """Cria professor mínimo para ser registrado como lançador de nota."""
    uid = uuid.uuid4().hex[:8]
    usuario_prof = _criar_usuario(db, f"Prof Teste {uid}", f"prof.{uid}@test.com", Perfil.PROFESSOR)
    professor = Professor(usuario_id=usuario_prof.id)
    db.add(professor)
    db.commit()
    db.refresh(professor)
    return professor


def _adicionar_nota(
    db,
    matricula,
    tipo,
    valor,
    professor=None,
):
    if professor is None:
        professor = _criar_professor_simples(db)

    nota = Nota(
        aluno_id=matricula.estudante_id,
        disciplina_id=matricula.turma.disciplina_id,
        turma_id=matricula.turma_id,
        professor_lancador_id=professor.id,
        tipo_avaliacao=tipo,
        valor=valor,
        peso=1.0,
    )

    db.add(nota)
    db.commit()
    db.refresh(nota)

    return nota


def _adicionar_frequencia(
    db,
    matricula,
    total_aulas,
    total_presencas,
):
    frequencia = Frequencia(
        turma_id=matricula.turma_id,
        estudante_id=matricula.estudante_id,
        total_aulas=total_aulas,
        presencas=total_presencas,
    )

    db.add(frequencia)
    db.commit()
    db.refresh(frequencia)

    return frequencia


# ── Autorização ───────────────────────────────────────────────────────────


class TestAutorizacaoBoletim:

    def test_sem_token_retorna_401(
        self,
        client,
    ):
        response = client.get(
            "/api/v1/alunos/me/boletim"
        )

        assert response.status_code == 401


    def test_professor_retorna_403(
        self,
        client,
        db,
    ):
        professor = _criar_usuario(
            db,
            "Professor",
            "professor@test.com",
            Perfil.PROFESSOR,
        )

        response = client.get(
            "/api/v1/alunos/me/boletim",
            headers=_headers(professor),
        )

        assert response.status_code == 403


    def test_coordenacao_retorna_403(
        self,
        client,
        db,
    ):
        coordenacao = _criar_usuario(
            db,
            "Coordenação",
            "coord@test.com",
            Perfil.COORDENACAO,
        )

        response = client.get(
            "/api/v1/alunos/me/boletim",
            headers=_headers(coordenacao),
        )

        assert response.status_code == 403


# ── Consulta do boletim ───────────────────────────────────────────────────


class TestConsultarBoletim:

    def test_aluno_sem_matriculas_retorna_lista_vazia(
        self,
        client,
        db,
    ):
        curso = _criar_curso(db)

        usuario, _ = _criar_aluno(
            db,
            "Aluno",
            "aluno@test.com",
            curso,
        )

        response = client.get(
            "/api/v1/alunos/me/boletim",
            headers=_headers(usuario),
        )

        assert response.status_code == 200
        assert response.json() == []


    def test_retorna_notas_media_e_frequencia(
        self,
        client,
        db,
    ):
        curso = _criar_curso(db)

        usuario, estudante = _criar_aluno(
            db,
            "Rafael",
            "rafael@test.com",
            curso,
        )

        turma = _criar_turma(
            db,
            curso,
            "Programação Web",
        )

        matricula = _matricular(
            db,
            estudante,
            turma,
        )

        _adicionar_nota(
            db,
            matricula,
            "Prova 1",
            8.5,
        )

        _adicionar_nota(
            db,
            matricula,
            "Prova 2",
            None,
        )

        _adicionar_nota(
            db,
            matricula,
            "Trabalho",
            7.0,
        )

        _adicionar_frequencia(
            db,
            matricula,
            total_aulas=20,
            total_presencas=18,
        )

        response = client.get(
            "/api/v1/alunos/me/boletim",
            headers=_headers(usuario),
        )

        assert response.status_code == 200

        data = response.json()

        assert len(data) == 1

        item = data[0]

        assert item["turma_id"] == turma.id
        assert item["disciplina"] == "Programação Web"

        assert item["notas"] == [
            {
                "tipo": "Prova 1",
                "valor": 8.5,
            },
            {
                "tipo": "Prova 2",
                "valor": None,
            },
            {
                "tipo": "Trabalho",
                "valor": 7.0,
            },
        ]

        assert item["media"] == 7.75  # MediaPonderada: (8.5*1 + 7.0*1) / 2 = 7.75
        assert item["frequencia"] == 90.0


    def test_retorna_todas_as_turmas_do_aluno(
        self,
        client,
        db,
    ):
        curso = _criar_curso(db)

        usuario, estudante = _criar_aluno(
            db,
            "Aluno",
            "aluno@test.com",
            curso,
        )

        turma_web = _criar_turma(
            db,
            curso,
            "Programação Web",
        )

        turma_banco = _criar_turma(
            db,
            curso,
            "Banco de Dados",
        )

        matricula_web = _matricular(
            db,
            estudante,
            turma_web,
        )

        matricula_banco = _matricular(
            db,
            estudante,
            turma_banco,
        )

        _adicionar_nota(
            db,
            matricula_web,
            "P1",
            8.0,
        )

        _adicionar_frequencia(
            db,
            matricula_web,
            20,
            18,
        )

        _adicionar_nota(
            db,
            matricula_banco,
            "P1",
            9.0,
        )

        _adicionar_frequencia(
            db,
            matricula_banco,
            10,
            10,
        )

        response = client.get(
            "/api/v1/alunos/me/boletim",
            headers=_headers(usuario),
        )

        assert response.status_code == 200

        data = response.json()

        assert len(data) == 2

        disciplinas = {
            item["disciplina"]
            for item in data
        }

        assert disciplinas == {
            "Programação Web",
            "Banco de Dados",
        }


# ── Isolamento entre alunos ───────────────────────────────────────────────


class TestIsolamentoBoletim:

    def test_aluno_nao_visualiza_dados_de_outro_aluno(
        self,
        client,
        db,
    ):
        curso = _criar_curso(db)

        usuario_a, estudante_a = _criar_aluno(
            db,
            "Aluno A",
            "aluno.a@test.com",
            curso,
        )

        _, estudante_b = _criar_aluno(
            db,
            "Aluno B",
            "aluno.b@test.com",
            curso,
        )

        turma_a = _criar_turma(
            db,
            curso,
            "Programação Web",
        )

        turma_b = _criar_turma(
            db,
            curso,
            "Segurança da Informação",
        )

        matricula_a = _matricular(
            db,
            estudante_a,
            turma_a,
        )

        matricula_b = _matricular(
            db,
            estudante_b,
            turma_b,
        )

        _adicionar_nota(
            db,
            matricula_a,
            "P1",
            8.0,
        )

        _adicionar_frequencia(
            db,
            matricula_a,
            20,
            18,
        )

        # Dados que pertencem somente ao Aluno B
        _adicionar_nota(
            db,
            matricula_b,
            "P1",
            3.0,
        )

        _adicionar_frequencia(
            db,
            matricula_b,
            20,
            5,
        )

        response = client.get(
            "/api/v1/alunos/me/boletim",
            headers=_headers(usuario_a),
        )

        assert response.status_code == 200

        data = response.json()

        assert len(data) == 1

        assert data[0]["disciplina"] == "Programação Web"
        assert data[0]["media"] == 8.0
        assert data[0]["frequencia"] == 90.0

        # Garante que nenhum dado do Aluno B vazou.
        assert all(
            item["disciplina"] != "Segurança da Informação"
            for item in data
        )


    def test_aluno_nao_pode_editar_boletim(
        self,
        client,
        db,
    ):
        curso = _criar_curso(db)

        usuario, _ = _criar_aluno(
            db,
            "Aluno",
            "aluno@test.com",
            curso,
        )

        response = client.patch(
            "/api/v1/alunos/me/boletim",
            json={
                "media": 10,
                "frequencia": 100,
            },
            headers=_headers(usuario),
        )

        assert response.status_code == 405