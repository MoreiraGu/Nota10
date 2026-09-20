# 🎓 Nota 10 - Sistema de Gestão Acadêmica

Sistema desenvolvido para controle acadêmico completo, atendendo aos três perfis de usuários: **Coordenação**, **Professor** e **Aluno**.

Este documento apresenta a visão geral da arquitetura, os padrões adotados e o passo a passo unificado para rodar a aplicação.

---

## 🏛️ Visão Geral da Arquitetura

O sistema é desacoplado em duas frentes independentes:

```
[ Frontend: React + TS (Vite) ]
         │
         │  HTTP / REST (JSON) com Bearer Token (JWT)
         ▼
[ Backend: FastAPI (/api/v1) ]
   ├── Autenticação JWT e RBAC (Perfil + Recurso)
   ├── Regras de Negócio e Padrões (Template Method)
   └── ORM (SQLAlchemy)
         │
         ▼
[ Banco de Dados: SQLite / PostgreSQL ]
```

> ⚠️ **Regra Fundamental:** O frontend apenas exibe dados e interfaces de acordo com as permissões autorizadas; o **backend é a única fonte de verdade** para validações, integridade e regras de negócio.

---

## 📂 Estrutura Geral do Repositório

```text
Nota10/
├── backend/                  # API REST construída em Python com FastAPI
│   ├── app/                  # Código-fonte da aplicação backend
│   ├── tests/                # Testes automatizados com pytest
│   ├── requirements.txt      # Dependências do backend
│   ├── .env.example          # Exemplo de configurações de ambiente
│   └── README.md             # 📖 Documentação detalhada da arquitetura do backend
│
├── frontend/                 # Aplicação SPA construída em React + TypeScript com Vite
│   ├── src/                  # Código-fonte da aplicação frontend
│   ├── package.json          # Dependências e scripts do frontend
│   ├── vite.config.ts        # Configuração do Vite e proxy reverso
│   └── README.md             # 📖 Documentação detalhada da arquitetura do frontend
│
├── docker-compose.yml        # Configuração para subir PostgreSQL opcional via container
├── .gitignore                # Arquivos e pastas ignorados pelo Git
└── README.md                 # Este documento
```

---

## 📐 Padrões Adotados no Projeto

Conforme os documentos de especificação e padrões:

1. **Versionamento e Rotas:** Todas as rotas da API possuem o prefixo `/api/v1`.
2. **Envelope de Erros:** Respostas de erro padronizadas (`detail`, `code`, `fields`).
3. **Controle de Acesso (RBAC em 2 Camadas):**
   - *Por Perfil:* Garante que apenas `COORDENACAO`, `PROFESSOR` ou `ALUNO` acessem suas respectivas rotas.
   - *Por Recurso:* Garante que um professor só possa lançar notas e frequência em turmas nas quais esteja de fato vinculado.
4. **Padrão de Projeto (Template Method):** Usado no backend para o cálculo de médias das disciplinas (etapa fixa de coleta -> etapa variável de critério de ponderação -> etapa fixa de consolidação).
5. **Padrão Git (Git Flow & Conventional Commits):**
   - Branches: `main`, `develop`, `feature/<nome>`, `hotfix/<nome>`.
   - Commits: `feat(...)`, `fix(...)`, `refactor(...)`, `test(...)`, `chore(...)`.

---

## 🚀 Como Rodar o Projeto Completo

### Pré-requisitos
- Python 3.10 ou superior instalado
- Node.js 18 ou superior e npm instalados
- Docker (opcional, caso queira utilizar PostgreSQL em vez de SQLite)

---

### Passo 1: Executando o Backend (Terminal 1)

Abra o terminal (PowerShell) e execute:

```powershell
# 1. Navegue até a pasta do backend
cd backend

# 2. Crie o ambiente virtual Python
python -m venv venv

# 3. Ative o ambiente virtual
.\venv\Scripts\Activate.ps1

# 4. Instale as dependências
pip install -r requirements.txt

# 5. Crie o arquivo .env
cp .env.example .env

# 6. Inicie a API com recarregamento automático
uvicorn app.main:app --reload --port 8000
```

- 🔗 **API Backend:** `http://localhost:8000`
- 📚 **Swagger (Docs interativa):** `http://localhost:8000/docs`
- 🧪 **Rodar Testes:** `pytest -v`

---

### Passo 2: Executando o Frontend (Terminal 2)

Abra um segundo terminal (PowerShell) e execute:

```powershell
# 1. Navegue até a pasta do frontend
cd frontend

# 2. Instale os pacotes npm
npm install

# 3. Crie o arquivo .env local
cp .env.example .env

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

- 🌐 **Aplicação Web:** `http://localhost:5173`

---

### Passo 3: Banco de Dados PostgreSQL (Opcional)

Por padrão, a aplicação utiliza **SQLite** (`nota10.db`) para rodar imediatamente sem nenhuma configuração externa. Se preferir rodar com **PostgreSQL**:

```powershell
# Na raiz do projeto (Nota10):
docker compose up -d
```
E ajuste o `DATABASE_URL` no `backend/.env` para:
`postgresql://postgres:postgrespassword@localhost:5432/nota10_db`

---

## 📖 Documentações Específicas

Para entender o papel de cada pasta e arquivo em detalhe:
- Consulte o [README do Backend](file:///c:/Users/Gustavo/Desktop/Nota10/backend/README.md)
- Consulte o [README do Frontend](file:///c:/Users/Gustavo/Desktop/Nota10/frontend/README.md)
