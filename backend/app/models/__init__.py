# Importa todos os models para garantir que o Base.metadata os conheça
# durante o create_all na inicialização da aplicação.
from app.models.usuario import Usuario  # noqa: F401
from app.models.curso import Curso  # noqa: F401
from app.models.estudante import Estudante  # noqa: F401
