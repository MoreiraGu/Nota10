# ⚙️ Backend - Nota 10 (FastAPI)

Este documento detalha a arquitetura do backend, explicando a finalidade de cada diretório e arquivo, além dos comandos de instalação e execução.

---

## 📂 Guia Detalhado da Estrutura de Pastas

```text
backend/
├── app/
│   ├── api/
│   │   ├── deps.py             # Injeção de dependências (get_db, RBAC por perfil e por recurso)
│   │   └── v1/                 # Endpoints versionados da API (/api/v1)
│   ├── core/
│   │   ├── config.py           # Leitura e tipagem das variáveis de ambiente (.env)
│   │   ├── database.py         # Configuração da engine e sessão do SQLAlchemy
│   │   └── security.py         # Criptografia de senhas (bcrypt) e geração/validação de JWT
│   ├── models/                 # Mapeamento Objeto-Relacional (ORM SQLAlchemy)
│   ├── schemas/                # Schemas Pydantic (Request DTOs e Response DTOs)
│   ├── services/               # Regras de negócio e padrões (Template Method para médias)
│   └── main.py                 # Ponto de entrada da aplicação FastAPI, CORS e handlers
├── tests/                      # Suíte de testes automatizados com pytest
├── requirements.txt            # Lista de dependências Python
├── .env.example                # Template de variáveis de ambiente
└── README.md                   # Este arquivo
```

---

## 🔍 Para Que Serve Cada Coisa no Backend?

### 1. `app/core/` (Configurações Centrais e Infraestrutura)
- **`config.py`**: Carrega as configurações do arquivo `.env` usando `pydantic-settings`. Centraliza variáveis como nome do projeto, secret key do JWT, tempo de expiração do token e string de conexão do banco de dados (`DATABASE_URL`).
- **`database.py`**: Cria a engine do SQLAlchemy (suporta tanto SQLite local quanto PostgreSQL sem mudar código) e disponibiliza a função geradora `get_db` para injeção de dependência nas rotas.
- **`security.py`**: Funções utilitárias de segurança para criar hashes seguros de senhas (`bcrypt`), verificar senhas no login e assinar/validar tokens JWT.

---

### 2. `app/models/` (Camada de Dados / Tabelas)
Nesta pasta ficam as classes que herdam de `Base = declarative_base()`, representando as tabelas no banco de dados conforme a seção 19 da especificação:
- `usuario.py`: Tabela `usuarios` (login, senha hash, perfil `COORDENACAO`, `PROFESSOR`, `ALUNO`, status ativo/inativo).
- `estudante.py`: Tabela `estudantes` (dados específicos do aluno, curso vinculado).
- `professor.py`: Tabela `professores` (dados do docente).
- `curso.py`: Tabela `cursos` (cursos oferecidos).
- `disciplina.py`: Tabela `disciplinas` (vinculadas aos cursos).
- `turma.py`: Tabela `turmas` e a tabela associativa `turma_professores` (essencial para validar quais professores lecionam em quais turmas).
- `matricula.py`: Tabela `matriculas` (associação aluno e turma).
- `nota.py`: Tabela `notas` (registro da avaliação, peso, nota e professor lançador).
- `frequencia.py`: Tabela `frequencia` (total de aulas, presenças e professor lançador).

---

### 3. `app/schemas/` (Contratos de Dados / Pydantic)
Separa o modelo do banco das informações que transitam na rede:
- **Request Schemas**: Validam os dados enviados pelo cliente no corpo da requisição (ex.: formato do e-mail, notas entre 0 e 10, total de faltas não maior que total de aulas).
- **Response Schemas**: Definem exatamente o que a API retorna, evitando expor dados sensíveis (como hashes de senhas).

---

### 4. `app/services/` (Regras de Negócio e Padrões de Projeto)
Isola regras de negócio complexas para não poluir os controladores de rota:
- **`calculadora_media.py`**: Implementação obrigatória do padrão **Template Method** (`EP.6`).
  - *Classe Base*: Define a sequência padrão (1. Coleta as notas -> 2. Aplica critério de ponderação -> 3. Define situação Aprovado/Reprovado).
  - *Subclasses*: Implementam o passo 2 de forma variável (ex.: `MediaSimples` vs `MediaPonderada`).

---

### 5. `app/api/` (Controladores e Segurança de Acesso)
- **`deps.py`**: Injeções de dependência que rodam antes da rota ser executada:
  - Obter usuário autenticado a partir do Bearer Token.
  - **RBAC por Perfil**: Decorator ou `Depends` que confere se o perfil do usuário logado pode acessar aquele endpoint (ex.: apenas `COORDENACAO`).
  - **RBAC por Recurso**: Dependency que consulta a tabela `turma_professores` e bloqueia o professor (`403 Forbidden`) caso ele tente lançar nota ou frequência em uma turma onde não leciona.
- **`v1/api.py`**: Agrupa todos os roteadores individuais das entidades sob o prefixo comum `/api/v1`.

---

### 6. `app/main.py` (Ponto de Entrada)
- Instancia o `FastAPI()`.
- Configura os middlewares de **CORS** para permitir requisições do frontend React (`http://localhost:5173`).
- Registra os handlers globais de erro para formatar respostas no envelope padrão especificado.
- Inclui o roteador da API v1 e expõe `/docs`.

---

### 7. `tests/` (Testes com Pytest)
- Onde ficam os testes unitários e de integração (testes de autenticação, testes de validação de RBAC por recurso e testes do cálculo do Template Method).

---

## 🛠️ Comandos de Execução do Backend

### 1. Criar e Ativar Ambiente Virtual
No Windows PowerShell:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(Se houver restrição de scripts no PowerShell: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

### 2. Instalar Dependências
```powershell
pip install -r requirements.txt
```

### 3. Configurar Ambiente
```powershell
cp .env.example .env
```

### 4. Executar Servidor
```powershell
uvicorn app.main:app --reload --port 8000
```
- Acesse `http://localhost:8000/docs` para ver o Swagger interativo.

### 5. Executar os Testes
```powershell
pytest -v
```
