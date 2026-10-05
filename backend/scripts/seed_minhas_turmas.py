"""Seed de desenvolvimento para validar as turmas do professor autenticado.

Cria de forma idempotente:
- 1 curso;
- 2 disciplinas;
- 2 professores (com Usuario + Professor);
- 2 turmas;
- vinculo de cada professor com sua propria turma;
- 3 alunos na turma do professor 1;
- 1 aluno na turma do professor 2.

Uso (a partir de backend/):
    python -m scripts.seed_minhas_turmas
"""

from sqlalchemy import inspect

import app.models  # noqa: F401 - registra os models no metadata
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_senha
from app.models.curso import Curso
from app.models.disciplina import Disciplina, SituacaoDisciplina
from app.models.estudante import Estudante, SituacaoEstudante
from app.models.matricula import Matricula
from app.models.professor import Professor, SituacaoProfessor
from app.models.turma import SituacaoTurma, Turma
from app.models.turma_professor import TurmaProfessor
from app.models.usuario import Perfil, Usuario


SENHA_TESTE = "Senha123"
PERIODO_TESTE = "2026.2"


def validar_schema_atual() -> None:
    """Falha cedo quando o SQLite ainda possui o modelo antigo de Turma."""
    inspector = inspect(engine)

    if "turmas" not in inspector.get_table_names():
        return

    colunas = {coluna["name"] for coluna in inspector.get_columns("turmas")}
    esperadas = {"id", "disciplina_id", "periodo_letivo", "situacao"}

    if not esperadas.issubset(colunas):
        faltantes = ", ".join(sorted(esperadas - colunas))
        raise RuntimeError(
            "O banco atual usa um schema antigo/incompativel para a tabela 'turmas'. "
            f"Colunas ausentes: {faltantes}.\n"
            "Para ambiente de desenvolvimento, faca backup se necessario, apague "
            "backend/nota10.db e execute este seed novamente. Base.metadata.create_all() "
            "nao altera tabelas SQLite ja existentes."
        )


def obter_ou_criar_usuario(db, *, nome: str, email: str, perfil: Perfil) -> Usuario:
    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    if usuario is None:
        usuario = Usuario(
            nome=nome,
            email=email,
            senha_hash=hash_senha(SENHA_TESTE),
            perfil=perfil,
            ativo=True,
        )
        db.add(usuario)
        db.flush()
        return usuario

    if usuario.perfil != perfil:
        raise RuntimeError(
            f"O e-mail {email} ja existe com perfil {usuario.perfil.value}; "
            f"o seed precisa de {perfil.value}."
        )

    usuario.nome = nome
    usuario.senha_hash = hash_senha(SENHA_TESTE)
    usuario.ativo = True
    db.flush()
    return usuario


def obter_ou_criar_professor(db, *, nome: str, email: str) -> Professor:
    usuario = obter_ou_criar_usuario(
        db,
        nome=nome,
        email=email,
        perfil=Perfil.PROFESSOR,
    )

    professor = db.query(Professor).filter(Professor.usuario_id == usuario.id).first()

    if professor is None:
        professor = Professor(
            usuario_id=usuario.id,
            contato="11999999999",
            situacao=SituacaoProfessor.ATIVO,
        )
        db.add(professor)
    else:
        professor.contato = "11999999999"
        professor.situacao = SituacaoProfessor.ATIVO

    db.flush()
    return professor


def obter_ou_criar_estudante(
    db,
    *,
    nome: str,
    email: str,
    curso: Curso,
) -> Estudante:
    usuario = obter_ou_criar_usuario(
        db,
        nome=nome,
        email=email,
        perfil=Perfil.ALUNO,
    )

    estudante = db.query(Estudante).filter(Estudante.usuario_id == usuario.id).first()

    if estudante is None:
        estudante = Estudante(
            usuario_id=usuario.id,
            curso_id=curso.id,
            contato="11988888888",
            situacao=SituacaoEstudante.ATIVO,
        )
        db.add(estudante)
    else:
        estudante.curso_id = curso.id
        estudante.contato = "11988888888"
        estudante.situacao = SituacaoEstudante.ATIVO

    db.flush()
    return estudante


def obter_ou_criar_curso(db) -> Curso:
    nome = "Curso Teste Minhas Turmas"
    curso = db.query(Curso).filter(Curso.nome == nome).first()

    if curso is None:
        curso = Curso(nome=nome)
        db.add(curso)
        db.flush()

    return curso


def obter_ou_criar_disciplina(db, *, nome: str, curso: Curso) -> Disciplina:
    disciplina = (
        db.query(Disciplina)
        .filter(
            Disciplina.nome == nome,
            Disciplina.curso_id == curso.id,
        )
        .first()
    )

    if disciplina is None:
        disciplina = Disciplina(
            nome=nome,
            curso_id=curso.id,
            situacao=SituacaoDisciplina.ATIVA,
        )
        db.add(disciplina)
    else:
        disciplina.situacao = SituacaoDisciplina.ATIVA

    db.flush()
    return disciplina


def obter_ou_criar_turma(db, *, disciplina: Disciplina) -> Turma:
    turma = (
        db.query(Turma)
        .filter(
            Turma.disciplina_id == disciplina.id,
            Turma.periodo_letivo == PERIODO_TESTE,
        )
        .first()
    )

    if turma is None:
        turma = Turma(
            disciplina_id=disciplina.id,
            periodo_letivo=PERIODO_TESTE,
            situacao=SituacaoTurma.ATIVA,
        )
        db.add(turma)
    else:
        turma.situacao = SituacaoTurma.ATIVA

    db.flush()
    return turma


def garantir_vinculo(db, *, professor: Professor, turma: Turma) -> TurmaProfessor:
    vinculo = (
        db.query(TurmaProfessor)
        .filter(
            TurmaProfessor.professor_id == professor.id,
            TurmaProfessor.turma_id == turma.id,
        )
        .first()
    )

    if vinculo is None:
        vinculo = TurmaProfessor(
            professor_id=professor.id,
            turma_id=turma.id,
        )
        db.add(vinculo)
        db.flush()

    return vinculo


def garantir_matricula(db, *, estudante: Estudante, turma: Turma) -> Matricula:
    matricula = (
        db.query(Matricula)
        .filter(
            Matricula.estudante_id == estudante.id,
            Matricula.turma_id == turma.id,
        )
        .first()
    )

    if matricula is None:
        matricula = Matricula(
            estudante_id=estudante.id,
            turma_id=turma.id,
        )
        db.add(matricula)
        db.flush()

    return matricula


def main() -> None:
    # create_all cria tabelas ausentes, mas nao migra tabelas existentes.
    validar_schema_atual()
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        curso = obter_ou_criar_curso(db)

        disciplina_1 = obter_ou_criar_disciplina(
            db,
            nome="Programacao Web - Teste Professor 1",
            curso=curso,
        )
        disciplina_2 = obter_ou_criar_disciplina(
            db,
            nome="Banco de Dados - Teste Professor 2",
            curso=curso,
        )

        professor_1 = obter_ou_criar_professor(
            db,
            nome="Professor Minhas Turmas Um",
            email="prof.minhas.turmas.1@sgca.edu.br",
        )
        professor_2 = obter_ou_criar_professor(
            db,
            nome="Professor Minhas Turmas Dois",
            email="prof.minhas.turmas.2@sgca.edu.br",
        )

        turma_1 = obter_ou_criar_turma(db, disciplina=disciplina_1)
        turma_2 = obter_ou_criar_turma(db, disciplina=disciplina_2)

        garantir_vinculo(db, professor=professor_1, turma=turma_1)
        garantir_vinculo(db, professor=professor_2, turma=turma_2)

        alunos_turma_1 = [
            ("Aluno Teste Um", "aluno.minhas.turmas.1@sgca.edu.br"),
            ("Aluno Teste Dois", "aluno.minhas.turmas.2@sgca.edu.br"),
            ("Aluno Teste Tres", "aluno.minhas.turmas.3@sgca.edu.br"),
        ]

        for nome, email in alunos_turma_1:
            aluno = obter_ou_criar_estudante(
                db,
                nome=nome,
                email=email,
                curso=curso,
            )
            garantir_matricula(db, estudante=aluno, turma=turma_1)

        aluno_turma_2 = obter_ou_criar_estudante(
            db,
            nome="Aluno Teste Outra Turma",
            email="aluno.minhas.turmas.4@sgca.edu.br",
            curso=curso,
        )
        garantir_matricula(db, estudante=aluno_turma_2, turma=turma_2)

        db.commit()

        print("\nSeed criado/atualizado com sucesso.\n")
        print("Professor 1")
        print("  email: prof.minhas.turmas.1@sgca.edu.br")
        print(f"  senha: {SENHA_TESTE}")
        print(f"  professor_id: {professor_1.id}")
        print(f"  turma_id: {turma_1.id}")
        print("  alunos esperados: 3")
        print()
        print("Professor 2")
        print("  email: prof.minhas.turmas.2@sgca.edu.br")
        print(f"  senha: {SENHA_TESTE}")
        print(f"  professor_id: {professor_2.id}")
        print(f"  turma_id: {turma_2.id}")
        print("  alunos esperados: 1")
        print()
        print("Validacao esperada:")
        print("  Professor 1 deve ver somente sua turma, com total_alunos = 3.")
        print("  Professor 2 deve ver somente sua turma, com total_alunos = 1.")
        print("  Os endpoints /professores/me/turmas e /turmas/minhas devem retornar o mesmo conjunto.")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
