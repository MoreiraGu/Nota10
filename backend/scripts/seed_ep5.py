from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_senha
from app.models.professor import Professor, SituacaoProfessor
from app.models.turma import Turma
from app.models.usuario import Perfil, Usuario


SENHA = "prof123"


def criar_professor(db, nome: str, email: str) -> Professor:
    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    if usuario is None:
        usuario = Usuario(
            nome=nome,
            email=email,
            senha_hash=hash_senha(SENHA),
            perfil=Perfil.PROFESSOR,
            ativo=True,
        )
        db.add(usuario)
        db.flush()
    else:
        usuario.nome = nome
        usuario.perfil = Perfil.PROFESSOR
        usuario.ativo = True

    professor = (
        db.query(Professor)
        .filter(Professor.usuario_id == usuario.id)
        .first()
    )

    if professor is None:
        professor = Professor(
            usuario_id=usuario.id,
            contato="",
            situacao=SituacaoProfessor.ATIVO,
        )
        db.add(professor)
        db.flush()
    else:
        professor.situacao = SituacaoProfessor.ATIVO

    return professor


def criar_turma(db, nome: str, professor: Professor) -> Turma:
    turma = db.query(Turma).filter(Turma.nome == nome).first()

    if turma is None:
        turma = Turma(
            nome=nome,
            professor_id=professor.id,
        )
        db.add(turma)
        db.flush()
    else:
        turma.professor_id = professor.id

    return turma


def main():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        professor_1 = criar_professor(
            db,
            nome="Professor EP5 Um",
            email="prof.ep5.1@sgca.edu.br",
        )

        professor_2 = criar_professor(
            db,
            nome="Professor EP5 Dois",
            email="prof.ep5.2@sgca.edu.br",
        )

        turma_1 = criar_turma(
            db,
            nome="Turma EP5 - Professor 1",
            professor=professor_1,
        )

        turma_2 = criar_turma(
            db,
            nome="Turma EP5 - Professor 2",
            professor=professor_2,
        )

        db.commit()

        print("\nDados de teste da EP.5 criados com sucesso.\n")

        print("Professor 1:")
        print("  email: prof.ep5.1@sgca.edu.br")
        print(f"  senha: {SENHA}")
        print(f"  professor_id: {professor_1.id}")
        print(f"  turma_id: {turma_1.id}")

        print("\nProfessor 2:")
        print("  email: prof.ep5.2@sgca.edu.br")
        print(f"  senha: {SENHA}")
        print(f"  professor_id: {professor_2.id}")
        print(f"  turma_id: {turma_2.id}")

    finally:
        db.close()


if __name__ == "__main__":
    main()