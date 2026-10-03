from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_senha

# Importa os models para registrá-los no metadata do SQLAlchemy
import app.models  # noqa: F401

from app.models.curso import Curso
from app.models.estudante import Estudante, SituacaoEstudante
from app.models.frequencia import Frequencia
from app.models.matricula import Matricula
from app.models.professor import Professor, SituacaoProfessor
from app.models.turma import Turma
from app.models.usuario import Perfil, Usuario


SENHA_TESTE = "Senha123"


def obter_ou_criar_usuario(
    db,
    nome: str,
    email: str,
    perfil: Perfil,
) -> Usuario:
    usuario = (
        db.query(Usuario)
        .filter(Usuario.email == email)
        .first()
    )

    if usuario:
        if usuario.perfil != perfil:
            raise RuntimeError(
                f"O e-mail {email} já existe com perfil "
                f"{usuario.perfil.value}, mas o seed precisa de {perfil.value}."
            )

        usuario.nome = nome
        usuario.senha_hash = hash_senha(SENHA_TESTE)
        usuario.ativo = True
        db.flush()

        return usuario

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


def obter_ou_criar_professor(
    db,
    nome: str,
    email: str,
) -> Professor:
    usuario = obter_ou_criar_usuario(
        db=db,
        nome=nome,
        email=email,
        perfil=Perfil.PROFESSOR,
    )

    professor = (
        db.query(Professor)
        .filter(Professor.usuario_id == usuario.id)
        .first()
    )

    if professor:
        professor.situacao = SituacaoProfessor.ATIVO
        professor.contato = "11999999999"
        db.flush()

        return professor

    professor = Professor(
        usuario_id=usuario.id,
        contato="11999999999",
        situacao=SituacaoProfessor.ATIVO,
    )

    db.add(professor)
    db.flush()

    return professor


def obter_ou_criar_estudante(
    db,
    nome: str,
    email: str,
    curso_id: int,
) -> Estudante:
    usuario = obter_ou_criar_usuario(
        db=db,
        nome=nome,
        email=email,
        perfil=Perfil.ALUNO,
    )

    estudante = (
        db.query(Estudante)
        .filter(Estudante.usuario_id == usuario.id)
        .first()
    )

    if estudante:
        estudante.curso_id = curso_id
        estudante.situacao = SituacaoEstudante.ATIVO
        estudante.contato = "11988888888"
        db.flush()

        return estudante

    estudante = Estudante(
        usuario_id=usuario.id,
        curso_id=curso_id,
        contato="11988888888",
        situacao=SituacaoEstudante.ATIVO,
    )

    db.add(estudante)
    db.flush()

    return estudante


def main():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # ---------------------------------------------------------
        # Curso necessário para criar os estudantes
        # ---------------------------------------------------------

        curso = (
            db.query(Curso)
            .filter(Curso.nome == "Curso Teste Frequência")
            .first()
        )

        if not curso:
            curso = Curso(nome="Curso Teste Frequência")
            db.add(curso)
            db.flush()

        # ---------------------------------------------------------
        # Professores
        # ---------------------------------------------------------

        professor_dono = obter_ou_criar_professor(
            db,
            nome="Professor Frequência",
            email="professor.frequencia@teste.com",
        )

        professor_outro = obter_ou_criar_professor(
            db,
            nome="Professor Outra Turma",
            email="professor.outro@teste.com",
        )

        # ---------------------------------------------------------
        # Alunos
        # ---------------------------------------------------------

        aluno_matriculado = obter_ou_criar_estudante(
            db,
            nome="Aluno Matriculado",
            email="aluno.matriculado@teste.com",
            curso_id=curso.id,
        )

        aluno_nao_matriculado = obter_ou_criar_estudante(
            db,
            nome="Aluno Não Matriculado",
            email="aluno.nao.matriculado@teste.com",
            curso_id=curso.id,
        )

        # ---------------------------------------------------------
        # Turma pertencente ao professor principal
        # ---------------------------------------------------------

        turma_professor = (
            db.query(Turma)
            .filter(
                Turma.nome == "Turma Teste Frequência",
                Turma.professor_id == professor_dono.id,
            )
            .first()
        )

        if not turma_professor:
            turma_professor = Turma(
                nome="Turma Teste Frequência",
                professor_id=professor_dono.id,
            )
            db.add(turma_professor)
            db.flush()

        # ---------------------------------------------------------
        # Outra turma pertencente a outro professor
        # Serve para testar o 403
        # ---------------------------------------------------------

        turma_outro_professor = (
            db.query(Turma)
            .filter(
                Turma.nome == "Turma Outro Professor",
                Turma.professor_id == professor_outro.id,
            )
            .first()
        )

        if not turma_outro_professor:
            turma_outro_professor = Turma(
                nome="Turma Outro Professor",
                professor_id=professor_outro.id,
            )
            db.add(turma_outro_professor)
            db.flush()

        # ---------------------------------------------------------
        # Matrícula
        # ---------------------------------------------------------

        matricula = (
            db.query(Matricula)
            .filter(
                Matricula.turma_id == turma_professor.id,
                Matricula.estudante_id == aluno_matriculado.id,
            )
            .first()
        )

        if not matricula:
            matricula = Matricula(
                turma_id=turma_professor.id,
                estudante_id=aluno_matriculado.id,
            )
            db.add(matricula)

        # Garante que o segundo aluno realmente NÃO esteja matriculado.
        matricula_indesejada = (
            db.query(Matricula)
            .filter(
                Matricula.turma_id == turma_professor.id,
                Matricula.estudante_id == aluno_nao_matriculado.id,
            )
            .first()
        )

        if matricula_indesejada:
            db.delete(matricula_indesejada)

        # ---------------------------------------------------------
        # Remove frequência anterior do aluno de teste.
        #
        # Assim cada execução do seed deixa o cenário limpo para
        # testar primeiro o POST.
        # ---------------------------------------------------------

        frequencia_anterior = (
            db.query(Frequencia)
            .filter(
                Frequencia.turma_id == turma_professor.id,
                Frequencia.estudante_id == aluno_matriculado.id,
            )
            .first()
        )

        if frequencia_anterior:
            db.delete(frequencia_anterior)

        db.commit()

        print()
        print("=" * 60)
        print("DADOS DE TESTE CRIADOS COM SUCESSO")
        print("=" * 60)

        print()
        print("PROFESSOR PRINCIPAL")
        print(f"  ID professor: {professor_dono.id}")
        print("  Email: professor.frequencia@teste.com")
        print(f"  Senha: {SENHA_TESTE}")

        print()
        print("PROFESSOR DE OUTRA TURMA")
        print(f"  ID professor: {professor_outro.id}")
        print("  Email: professor.outro@teste.com")
        print(f"  Senha: {SENHA_TESTE}")

        print()
        print("ALUNO MATRICULADO")
        print(f"  ID aluno: {aluno_matriculado.id}")
        print("  Email: aluno.matriculado@teste.com")

        print()
        print("ALUNO NÃO MATRICULADO")
        print(f"  ID aluno: {aluno_nao_matriculado.id}")
        print("  Email: aluno.nao.matriculado@teste.com")

        print()
        print("TURMA DO PROFESSOR PRINCIPAL")
        print(f"  ID turma: {turma_professor.id}")
        print(f"  Professor ID: {professor_dono.id}")

        print()
        print("TURMA DO OUTRO PROFESSOR")
        print(f"  ID turma: {turma_outro_professor.id}")
        print(f"  Professor ID: {professor_outro.id}")

        print()
        print("=" * 60)

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()