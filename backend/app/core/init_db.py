"""Script de inicialização e população do banco de dados (Docker/Dev)."""

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_senha
from app.models.curso import Curso
from app.models.estudante import Estudante, SituacaoEstudante
from app.models.usuario import Perfil, Usuario


def init_db():
    print("Criando tabelas no banco de dados...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Cria Cursos
        cursos_data = [
            "Sistemas de Informação",
            "Engenharia de Software",
            "Ciência de Dados",
        ]
        cursos_map = {}
        for nome_c in cursos_data:
            c = db.query(Curso).filter(Curso.nome == nome_c).first()
            if not c:
                c = Curso(nome=nome_c)
                db.add(c)
                db.flush()
                print(f"Curso criado: {c.nome} (id={c.id})")
            cursos_map[nome_c] = c

        # 2. Cria Usuário Coordenação
        coord = db.query(Usuario).filter(Usuario.email == "coordenacao@sgca.edu.br").first()
        if not coord:
            coord = Usuario(
                nome="Coordenador Geral",
                email="coordenacao@sgca.edu.br",
                senha_hash=hash_senha("admin123"),
                perfil=Perfil.COORDENACAO,
                ativo=True,
            )
            db.add(coord)
            print("Usuário de Coordenação criado: coordenacao@sgca.edu.br / admin123")

        # 3. Cria Usuário Professor
        prof = db.query(Usuario).filter(Usuario.email == "ana.martins@sgca.edu.br").first()
        if not prof:
            prof = Usuario(
                nome="Prof. Ana Martins",
                email="ana.martins@sgca.edu.br",
                senha_hash=hash_senha("prof123"),
                perfil=Perfil.PROFESSOR,
                ativo=True,
            )
            db.add(prof)
            print("Usuário Professor criado: ana.martins@sgca.edu.br / prof123")

        # 4. Cria Estudantes iniciais reais
        estudantes_iniciais = [
            ("Rafael Almeida", "rafael.almeida@sgca.edu.br", "Sistemas de Informação"),
            ("Mariana Souza", "mariana.souza@sgca.edu.br", "Engenharia de Software"),
            ("Lucas Oliveira", "lucas.oliveira@sgca.edu.br", "Ciência de Dados"),
        ]

        for nome_e, email_e, curso_nome in estudantes_iniciais:
            u = db.query(Usuario).filter(Usuario.email == email_e).first()
            if not u:
                u = Usuario(
                    nome=nome_e,
                    email=email_e,
                    senha_hash=hash_senha("aluno123"),
                    perfil=Perfil.ALUNO,
                    ativo=True,
                )
                db.add(u)
                db.flush()

                est = Estudante(
                    usuario_id=u.id,
                    curso_id=cursos_map[curso_nome].id,
                    situacao=SituacaoEstudante.ATIVO,
                )
                db.add(est)
                print(f"Estudante criado: {nome_e} ({email_e})")

        db.commit()
        print("Banco de dados inicializado com sucesso!")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
