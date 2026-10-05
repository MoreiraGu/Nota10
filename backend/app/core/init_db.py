"""Script de inicialização e população do banco de dados (Docker/Dev)."""

import app.models  # noqa: F401 - registra todos os models no metadata

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_senha
from app.models.curso import Curso
from app.models.estudante import Estudante, SituacaoEstudante
from app.models.professor import Professor, SituacaoProfessor
from app.models.usuario import Perfil, Usuario


SENHA_PADRAO = "123456"


def obter_ou_criar_usuario(
    db,
    *,
    nome: str,
    email: str,
    perfil: Perfil,
) -> Usuario:
    usuario = (
        db.query(Usuario)
        .filter(Usuario.email == email)
        .first()
    )

    if usuario is None:
        usuario = Usuario(
            nome=nome,
            email=email,
            senha_hash=hash_senha(SENHA_PADRAO),
            perfil=perfil,
            ativo=True,
        )
        db.add(usuario)
        db.flush()

        print(f"Usuário criado: {email}")
    else:
        # Mantém o ambiente de desenvolvimento previsível.
        usuario.nome = nome
        usuario.perfil = perfil
        usuario.ativo = True

    return usuario


def init_db():
    print("Criando tabelas no banco de dados...")

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # ============================================================
        # 1. CURSOS
        # ============================================================

        cursos_data = [
            "Sistemas de Informação",
            "Engenharia de Software",
            "Ciência de Dados",
        ]

        cursos_map: dict[str, Curso] = {}

        for nome_curso in cursos_data:
            curso = (
                db.query(Curso)
                .filter(Curso.nome == nome_curso)
                .first()
            )

            if curso is None:
                curso = Curso(nome=nome_curso)
                db.add(curso)
                db.flush()

                print(
                    f"Curso criado: {curso.nome} "
                    f"(id={curso.id})"
                )

            cursos_map[nome_curso] = curso

        # ============================================================
        # 2. COORDENAÇÃO
        # ============================================================

        obter_ou_criar_usuario(
            db,
            nome="Coordenador Geral",
            email="coordenacao@sgca.edu.br",
            perfil=Perfil.COORDENACAO,
        )

        # ============================================================
        # 3. PROFESSOR
        # ============================================================

        usuario_professor = obter_ou_criar_usuario(
            db,
            nome="Prof. Ana Martins",
            email="ana.martins@sgca.edu.br",
            perfil=Perfil.PROFESSOR,
        )

        professor = (
            db.query(Professor)
            .filter(
                Professor.usuario_id == usuario_professor.id
            )
            .first()
        )

        if professor is None:
            professor = Professor(
                usuario_id=usuario_professor.id,
                contato="(11) 98888-1111",
                situacao=SituacaoProfessor.ATIVO,
            )

            db.add(professor)
            db.flush()

            print(
                "Professor criado: "
                "Prof. Ana Martins "
                f"(id={professor.id})"
            )
        else:
            professor.situacao = SituacaoProfessor.ATIVO

        # ============================================================
        # 4. ESTUDANTES
        # ============================================================

        estudantes_iniciais = [
            (
                "Rafael Almeida",
                "rafael.almeida@sgca.edu.br",
                "Sistemas de Informação",
                "(11) 97777-1001",
            ),
            (
                "Mariana Souza",
                "mariana.souza@sgca.edu.br",
                "Engenharia de Software",
                "(11) 97777-1002",
            ),
            (
                "Lucas Oliveira",
                "lucas.oliveira@sgca.edu.br",
                "Ciência de Dados",
                "(11) 97777-1003",
            ),
        ]

        for (
            nome_estudante,
            email_estudante,
            curso_nome,
            contato,
        ) in estudantes_iniciais:

            usuario = obter_ou_criar_usuario(
                db,
                nome=nome_estudante,
                email=email_estudante,
                perfil=Perfil.ALUNO,
            )

            estudante = (
                db.query(Estudante)
                .filter(
                    Estudante.usuario_id == usuario.id
                )
                .first()
            )

            if estudante is None:
                estudante = Estudante(
                    usuario_id=usuario.id,
                    curso_id=cursos_map[curso_nome].id,
                    contato=contato,
                    situacao=SituacaoEstudante.ATIVO,
                )

                db.add(estudante)
                db.flush()

                print(
                    f"Estudante criado: "
                    f"{nome_estudante} "
                    f"({email_estudante})"
                )
            else:
                estudante.curso_id = cursos_map[curso_nome].id
                estudante.situacao = SituacaoEstudante.ATIVO

        db.commit()

        print()
        print("Banco de dados inicializado com sucesso!")
        print()
        print("Credenciais de desenvolvimento:")
        print(
            "Coordenação: "
            "coordenacao@sgca.edu.br / 123456"
        )
        print(
            "Professor:   "
            "ana.martins@sgca.edu.br / 123456"
        )
        print(
            "Aluno:       "
            "rafael.almeida@sgca.edu.br / 123456"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    init_db()