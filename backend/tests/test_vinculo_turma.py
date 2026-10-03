import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import requires_vinculo_turma
from app.core.database import Base
from app.models.professor import Professor
from app.models.turma import Turma
from app.models.usuario import Perfil, Usuario


engine_test = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine_test,
)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)


@pytest.fixture
def db():
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()


def criar_professor(db, nome: str, email: str):
    usuario = Usuario(
        nome=nome,
        email=email,
        senha_hash="senha-teste",
        perfil=Perfil.PROFESSOR,
        ativo=True,
    )
    db.add(usuario)
    db.flush()

    professor = Professor(
        usuario_id=usuario.id,
    )
    db.add(professor)
    db.flush()

    return usuario, professor


def criar_turma(db, nome: str, professor_id: int):
    turma = Turma(
        nome=nome,
        professor_id=professor_id,
    )
    db.add(turma)
    db.flush()

    return turma


class TestRequiresVinculoTurma:

    def test_professor_vinculado_pode_acessar_turma(self, db):
        usuario, professor = criar_professor(
            db,
            nome="Professor Um",
            email="prof1@test.com",
        )

        turma = criar_turma(
            db,
            nome="Turma do Professor Um",
            professor_id=professor.id,
        )

        resultado = requires_vinculo_turma(
            turma_id=turma.id,
            db=db,
            current_user=usuario,
        )

        assert resultado.id == turma.id
        assert resultado.professor_id == professor.id

    def test_professor_nao_vinculado_recebe_403(self, db):
        usuario_1, professor_1 = criar_professor(
            db,
            nome="Professor Um",
            email="prof1@test.com",
        )

        _, professor_2 = criar_professor(
            db,
            nome="Professor Dois",
            email="prof2@test.com",
        )

        turma_professor_2 = criar_turma(
            db,
            nome="Turma do Professor Dois",
            professor_id=professor_2.id,
        )

        with pytest.raises(HTTPException) as exc:
            requires_vinculo_turma(
                turma_id=turma_professor_2.id,
                db=db,
                current_user=usuario_1,
            )

        assert exc.value.status_code == 403
        assert exc.value.detail == "Professor não possui vínculo com esta turma"

    def test_turma_inexistente_retorna_404(self, db):
        usuario, _ = criar_professor(
            db,
            nome="Professor Um",
            email="prof1@test.com",
        )

        with pytest.raises(HTTPException) as exc:
            requires_vinculo_turma(
                turma_id=9999,
                db=db,
                current_user=usuario,
            )

        assert exc.value.status_code == 404
        assert exc.value.detail == "Turma não encontrada"

    def test_usuario_sem_cadastro_de_professor_recebe_403(self, db):
        usuario = Usuario(
            nome="Professor sem registro",
            email="semregistro@test.com",
            senha_hash="senha-teste",
            perfil=Perfil.PROFESSOR,
            ativo=True,
        )

        db.add(usuario)
        db.flush()

        with pytest.raises(HTTPException) as exc:
            requires_vinculo_turma(
                turma_id=1,
                db=db,
                current_user=usuario,
            )

        assert exc.value.status_code == 403
        assert exc.value.detail == "Usuário não possui cadastro de professor"