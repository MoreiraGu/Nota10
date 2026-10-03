from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_senha

from app.models.curso import Curso
from app.models.disciplina import Disciplina
from app.models.estudante import Estudante, SituacaoEstudante
from app.models.frequencia import Frequencia
from app.models.matricula import Matricula
from app.models.nota import Nota
from app.models.turma import Turma
from app.models.usuario import Perfil, Usuario


EMAIL_ALUNO = "aluno.boletim@sgca.edu.br"
SENHA_ALUNO = "aluno123"
NOME_ALUNO = "Aluno Teste Boletim"

CURSO_NOME = "Sistemas de Informação"
PERIODO = "2026.2"


def get_or_create_curso(db) -> Curso:
    curso = (
        db.query(Curso)
        .filter(Curso.nome == CURSO_NOME)
        .first()
    )

    if curso:
        return curso

    curso = Curso(nome=CURSO_NOME)

    db.add(curso)
    db.flush()

    print(f"Curso criado: {curso.nome}")

    return curso


def get_or_create_usuario(db) -> Usuario:
    usuario = (
        db.query(Usuario)
        .filter(Usuario.email == EMAIL_ALUNO)
        .first()
    )

    if usuario:
        # Garante que o usuário continue utilizável para o teste.
        usuario.nome = NOME_ALUNO
        usuario.perfil = Perfil.ALUNO
        usuario.ativo = True
        usuario.senha_hash = hash_senha(SENHA_ALUNO)

        return usuario

    usuario = Usuario(
        nome=NOME_ALUNO,
        email=EMAIL_ALUNO,
        senha_hash=hash_senha(SENHA_ALUNO),
        perfil=Perfil.ALUNO,
        ativo=True,
    )

    db.add(usuario)
    db.flush()

    print(f"Usuário criado: {usuario.email}")

    return usuario


def get_or_create_estudante(
    db,
    usuario: Usuario,
    curso: Curso,
) -> Estudante:
    estudante = (
        db.query(Estudante)
        .filter(Estudante.usuario_id == usuario.id)
        .first()
    )

    if estudante:
        estudante.curso_id = curso.id
        estudante.situacao = SituacaoEstudante.ATIVO

        return estudante

    estudante = Estudante(
        usuario_id=usuario.id,
        curso_id=curso.id,
        contato="11999999999",
        situacao=SituacaoEstudante.ATIVO,
    )

    db.add(estudante)
    db.flush()

    print(f"Estudante criado: id={estudante.id}")

    return estudante


def get_or_create_disciplina(
    db,
    curso: Curso,
    nome: str,
) -> Disciplina:
    disciplina = (
        db.query(Disciplina)
        .filter(
            Disciplina.nome == nome,
            Disciplina.curso_id == curso.id,
        )
        .first()
    )

    if disciplina:
        return disciplina

    disciplina = Disciplina(
        nome=nome,
        curso_id=curso.id,
    )

    db.add(disciplina)
    db.flush()

    print(f"Disciplina criada: {nome}")

    return disciplina


def get_or_create_turma(
    db,
    disciplina: Disciplina,
) -> Turma:
    turma = (
        db.query(Turma)
        .filter(
            Turma.disciplina_id == disciplina.id,
            Turma.periodo_letivo == PERIODO,
        )
        .first()
    )

    if turma:
        return turma

    turma = Turma(
        disciplina_id=disciplina.id,
        periodo_letivo=PERIODO,
    )

    db.add(turma)
    db.flush()

    print(
        f"Turma criada: "
        f"{disciplina.nome} - {PERIODO}"
    )

    return turma


def get_or_create_matricula(
    db,
    estudante: Estudante,
    turma: Turma,
) -> Matricula:
    matricula = (
        db.query(Matricula)
        .filter(
            Matricula.estudante_id == estudante.id,
            Matricula.turma_id == turma.id,
        )
        .first()
    )

    if matricula:
        return matricula

    matricula = Matricula(
        estudante_id=estudante.id,
        turma_id=turma.id,
    )

    db.add(matricula)
    db.flush()

    print(
        f"Matrícula criada: "
        f"estudante={estudante.id}, turma={turma.id}"
    )

    return matricula


def criar_ou_atualizar_nota(
    db,
    matricula: Matricula,
    tipo: str,
    valor: float | None,
    peso: float = 1.0,
):
    nota = (
        db.query(Nota)
        .filter(
            Nota.matricula_id == matricula.id,
            Nota.tipo_avaliacao == tipo,
        )
        .first()
    )

    if nota:
        nota.valor = valor
        nota.peso = peso
        return

    nota = Nota(
        matricula_id=matricula.id,
        tipo_avaliacao=tipo,
        valor=valor,
        peso=peso,
    )

    db.add(nota)


def criar_ou_atualizar_frequencia(
    db,
    matricula: Matricula,
    total_aulas: int,
    total_presencas: int,
):
    frequencia = (
        db.query(Frequencia)
        .filter(
            Frequencia.matricula_id == matricula.id
        )
        .first()
    )

    if frequencia:
        frequencia.total_aulas = total_aulas
        frequencia.total_presencas = total_presencas
        return

    frequencia = Frequencia(
        matricula_id=matricula.id,
        total_aulas=total_aulas,
        total_presencas=total_presencas,
    )

    db.add(frequencia)


def seed_boletim():
    print("Preparando banco para teste do boletim...")

    # Garante que as tabelas novas existam.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        curso = get_or_create_curso(db)
        usuario = get_or_create_usuario(db)

        estudante = get_or_create_estudante(
            db,
            usuario,
            curso,
        )

        # ── Programação Web ─────────────────────────────

        disciplina_web = get_or_create_disciplina(
            db,
            curso,
            "Programação Web",
        )

        turma_web = get_or_create_turma(
            db,
            disciplina_web,
        )

        matricula_web = get_or_create_matricula(
            db,
            estudante,
            turma_web,
        )

        criar_ou_atualizar_nota(
            db,
            matricula_web,
            "Prova 1",
            8.5,
        )

        criar_ou_atualizar_nota(
            db,
            matricula_web,
            "Prova 2",
            7.0,
        )

        criar_ou_atualizar_nota(
            db,
            matricula_web,
            "Trabalho",
            9.0,
        )

        criar_ou_atualizar_frequencia(
            db,
            matricula_web,
            total_aulas=20,
            total_presencas=18,
        )

        # Resultado esperado:
        # média = (8.5 + 7.0 + 9.0) / 3 = 8.2
        # frequência = 18 / 20 = 90%

        # ── Banco de Dados ──────────────────────────────

        disciplina_bd = get_or_create_disciplina(
            db,
            curso,
            "Banco de Dados",
        )

        turma_bd = get_or_create_turma(
            db,
            disciplina_bd,
        )

        matricula_bd = get_or_create_matricula(
            db,
            estudante,
            turma_bd,
        )

        criar_ou_atualizar_nota(
            db,
            matricula_bd,
            "Prova 1",
            6.0,
        )

        # Nota ainda não lançada, para testar o null.
        criar_ou_atualizar_nota(
            db,
            matricula_bd,
            "Prova 2",
            None,
        )

        criar_ou_atualizar_frequencia(
            db,
            matricula_bd,
            total_aulas=20,
            total_presencas=15,
        )

        # Resultado esperado:
        # média = 6.0
        # frequência = 75%

        db.commit()

        print()
        print("======================================")
        print("SEED DO BOLETIM CONCLUÍDO")
        print("======================================")
        print(f"E-mail: {EMAIL_ALUNO}")
        print(f"Senha:  {SENHA_ALUNO}")
        print()
        print("Dados esperados:")
        print("  Programação Web")
        print("    Notas: 8.5, 7.0, 9.0")
        print("    Média: 8.2")
        print("    Frequência: 90.0%")
        print()
        print("  Banco de Dados")
        print("    Notas: 6.0, não lançada")
        print("    Média: 6.0")
        print("    Frequência: 75.0%")
        print("======================================")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_boletim()