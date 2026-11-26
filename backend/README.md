# Backend — Nota10

API REST em **FastAPI** com **SQLAlchemy** e autenticação **JWT**. É aqui que ficam todas as regras de negócio: cálculo da média, frequência, situação acadêmica e permissões.

---

## Como rodar

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m app.core.init_db
uvicorn app.main:app --reload --port 8000
```

- `python -m app.core.init_db` cria as tabelas e os usuários de teste (senha `123456`): `coordenacao@sgca.edu.br`, `ana.martins@sgca.edu.br` (professor) e `rafael.almeida@sgca.edu.br` (aluno).
- O `.env.example` aponta para o PostgreSQL do `docker-compose.yml`. Para usar SQLite, troque o `DATABASE_URL` por `sqlite:///./nota10.db`.
- Swagger com todos os endpoints: http://localhost:8000/docs
- Se o PowerShell bloquear a ativação do venv: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

### Testes

```powershell
pytest -v
```

Os testes usam um banco SQLite próprio e não precisam do servidor rodando.

---

## Estrutura de pastas

```text
backend/
├── app/
│   ├── main.py               Cria o FastAPI, configura CORS e os handlers de erro
│   ├── core/
│   │   ├── config.py         Lê as variáveis do .env
│   │   ├── database.py       Conexão com o banco e get_db
│   │   ├── security.py       Hash de senha (bcrypt) e token JWT
│   │   └── init_db.py        Cria tabelas e dados de teste
│   ├── models/               Tabelas (SQLAlchemy)
│   ├── schemas/              Formato de entrada e saída da API (Pydantic)
│   ├── services/             Regras de negócio
│   │   ├── calculo_media.py        Template Method da média
│   │   ├── situacao_academica.py   Aprovado / recuperação / reprovado
│   │   └── turmas_professor.py     Turmas do professor logado
│   └── api/
│       ├── deps.py           Usuário logado e permissões
│       └── v1/               Rotas, um arquivo por recurso
├── tests/                    Testes com pytest
├── requirements.txt
└── .env.example
```

### Tabelas (`app/models/`)

| Tabela | O que guarda |
|---|---|
| `usuarios` | Login, senha (hash), perfil (`COORDENACAO`, `PROFESSOR`, `ALUNO`) e se está ativo |
| `estudantes` | Dados do aluno e o curso dele |
| `professores` | Dados do professor |
| `cursos` | Cursos |
| `disciplinas` | Disciplinas, cada uma ligada a um curso |
| `turmas` | Uma disciplina oferecida num período letivo (ex.: `2026.2`) |
| `turma_professores` | Quais professores lecionam em cada turma |
| `matriculas` | Quais alunos estão em cada turma |
| `notas` | Avaliações: tipo, peso, valor e quem lançou |
| `frequencia` | Total de aulas e presenças de cada aluno na turma |

---

## Regras de negócio

### Cálculo da média: Template Method (`services/calculo_media.py`)

A classe base `CalculadoraMedia` define o passo a passo fixo no método `calcular()`:

1. **Filtra** as notas que já têm valor (etapa fixa).
2. **Aplica o critério** de cálculo (etapa variável, cada subclasse faz a sua).
3. **Devolve** o resultado, ou `None` se ainda não há nota (etapa fixa).

| Subclasse | Critério |
|---|---|
| `MediaPonderada` (padrão do sistema) | `soma(nota × peso) / soma(pesos)` |
| `MediaSimples` | `soma(notas) / quantidade` |

Para mudar a forma de calcular, basta criar outra subclasse e sobrescrever só `_aplicar_criterio()`, sem mexer no fluxo.

### Situação acadêmica (`services/situacao_academica.py`)

A função `avaliar_situacao_disciplina` decide a situação de cada disciplina no boletim, nesta ordem:

| Condição | Situação |
|---|---|
| Nenhuma nota lançada | Em andamento |
| Frequência abaixo de 75% | Reprovado por falta |
| Alguma avaliação ainda sem nota | Em andamento |
| Frequência ainda não lançada | Em andamento |
| Média ≥ 6,0 | Aprovado |
| Média ≥ 4,0 | Em recuperação |
| Média abaixo de 4,0 | Reprovado por média |

Os limites ficam nas constantes `MEDIA_MINIMA_APROVACAO`, `MEDIA_MINIMA_RECUPERACAO` e `FREQUENCIA_MINIMA_PERCENTUAL`.

### Frequência

Percentual = `presencas / total_aulas × 100`, com uma casa decimal. Presenças não podem passar do total de aulas.

---

## Autenticação e permissões (`api/deps.py`)

1. O login (`POST /auth/login`) devolve um token JWT.
2. O frontend manda o token em toda requisição: `Authorization: Bearer <token>`.
3. `get_current_user` lê o token e carrega o usuário.
4. As permissões têm duas camadas:
   - **`require_perfil(...)`**, por perfil: a rota só aceita os perfis informados. Ex.: cadastrar estudante é só para a Coordenação.
   - **`requires_vinculo_turma`**, por recurso: o professor só lança nota e frequência em turma em que está vinculado. Fora disso, a API responde `403`.

---

## Endpoints

Todos com prefixo `/api/v1`.

| Método | Rota | Quem pode | O que faz |
|---|---|---|---|
| POST | `/auth/login` | Todos | Login, devolve o token |
| GET | `/auth/me` | Logado | Dados do usuário do token |
| GET, POST | `/cursos` | Coordenação | Lista e cria cursos |
| GET, POST | `/disciplinas` | Coordenação | Lista e cria disciplinas |
| GET, POST | `/estudantes` | Coordenação | Lista e cadastra estudantes |
| GET, PUT | `/estudantes/{id}` | Coordenação | Consulta e edita (inclusive reativar) |
| PATCH | `/estudantes/{id}/inativar` | Coordenação | Inativa o estudante |
| DELETE | `/estudantes/{id}` | Coordenação | Também inativa (não apaga do banco) |
| GET, POST | `/professores` | Coordenação | Lista e cadastra professores |
| GET, PUT | `/professores/{id}` | Coordenação | Consulta e edita (inclusive reativar) |
| PATCH | `/professores/{id}/inativar` | Coordenação | Inativa o professor |
| GET | `/professores/me/turmas` | Professor | Turmas do professor logado |
| GET, POST | `/turmas` | Coordenação | Lista e cria turmas |
| GET | `/turmas/minhas` | Professor | Turmas do professor logado |
| GET | `/turmas/{id}` | Coordenação | Detalhe com professores e alunos |
| POST | `/turmas/{id}/professores` | Coordenação | Vincula professor |
| POST | `/turmas/{id}/matriculas` | Coordenação | Matricula aluno |
| GET | `/turmas/{id}/alunos` | Professor vinculado | Alunos da turma |
| POST | `/turmas/{id}/notas` | Professor vinculado | Lança nota |
| GET | `/turmas/{id}/alunos/{aluno_id}/media` | Professor vinculado | Notas e média do aluno |
| POST | `/turmas/{id}/frequencia` | Professor vinculado | Lança frequência |
| GET | `/turmas/{id}/alunos/{aluno_id}/frequencia` | Professor vinculado | Frequência do aluno |
| GET | `/alunos/me/boletim` | Aluno | Boletim: notas, média, frequência e situação |

### Formato dos erros

```json
{ "detail": "Mensagem do erro", "code": "CODIGO", "fields": { "campo": "motivo" } }
```

| Status | Quando |
|---|---|
| 400 | Corpo da requisição em formato inválido (`code: VALIDATION_ERROR`, campos em `fields`) |
| 401 | Sem token ou token inválido |
| 403 | Perfil sem permissão, ou professor fora da turma |
| 404 | Registro não encontrado |
| 409 | Conflito (ex.: e-mail já cadastrado) |
| 422 | Regra violada (ex.: nota fora de 0 a 10, peso zero, professor ou aluno inativo) |
