# Nota10 — Sistema de Gestão Acadêmica

Sistema web para controle acadêmico com três perfis de acesso: **Coordenação**, **Professor** e **Aluno**.

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Python + FastAPI + SQLAlchemy
- **Banco:** SQLite (padrão) ou PostgreSQL (via Docker)

Documentação de cada parte:

- [Frontend](frontend/README.md): estrutura de pastas, padrão das páginas e rotas
- [Backend](backend/README.md): API, regras de negócio e testes

---

## O que cada perfil faz

| Perfil | Funcionalidades |
|---|---|
| **Coordenação** | Painel com resumo do período; cadastro, edição, inativação e reativação de estudantes e professores; cadastro de cursos e disciplinas; abertura de turmas, vínculo de professores e matrícula de alunos |
| **Professor** | Painel com suas turmas; lista de turmas em que leciona; lançamento de notas (a média é calculada pelo backend); lançamento de frequência |
| **Aluno** | Painel com o resumo da situação; boletim com notas, média, frequência e situação por disciplina; histórico agrupado por período letivo; dados pessoais |

---

## Arquitetura

```
┌──────────────────────────────┐
│  Frontend (React, porta 5173)│  telas, formulários e navegação
└──────────────┬───────────────┘
               │ HTTP + JSON, token JWT no cabeçalho Authorization
┌──────────────▼───────────────┐
│  Backend (FastAPI, porta 8000)│  autenticação, permissões e regras de negócio
└──────────────┬───────────────┘
               │ SQLAlchemy
┌──────────────▼───────────────┐
│  Banco (SQLite ou PostgreSQL)│
└──────────────────────────────┘
```

**Regra principal:** o frontend só exibe dados e envia formulários. Média, frequência, situação acadêmica (aprovado, recuperação, reprovado) e permissões são decididas pelo backend.

---

## Estrutura do repositório

```text
Nota10/
├── backend/             API em FastAPI (ver backend/README.md)
├── frontend/            Aplicação React (ver frontend/README.md)
├── docker-compose.yml   PostgreSQL opcional
└── README.md            Este arquivo
```

---

## Como rodar

### Pré-requisitos

- Python 3.10 ou superior
- Node.js 18 ou superior
- Docker (opcional, só para usar PostgreSQL)

### 1. Backend (terminal 1)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m app.core.init_db
uvicorn app.main:app --reload --port 8000
```

O comando `python -m app.core.init_db` cria as tabelas e os usuários de teste. Só precisa rodar uma vez.

- API: http://localhost:8000
- Documentação interativa (Swagger): http://localhost:8000/docs

> Para usar SQLite sem Docker, troque o `DATABASE_URL` do `.env` por `sqlite:///./nota10.db`.

### 2. Frontend (terminal 2)

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

- Aplicação: http://localhost:5173

### 3. PostgreSQL (opcional)

```powershell
docker compose up -d
```

O banco sobe na porta `5433`. O `DATABASE_URL` do `backend/.env.example` já aponta para ele.

### Usuários de teste

Criados pelo `init_db`, todos com a senha `123456`:

| Perfil | E-mail |
|---|---|
| Coordenação | coordenacao@sgca.edu.br |
| Professor | ana.martins@sgca.edu.br |
| Aluno | rafael.almeida@sgca.edu.br |

A tela de login tem botões que preenchem esses dados.

---

## Padrões do projeto

- **Rotas da API** com prefixo `/api/v1`.
- **Erros da API** no formato `{ "detail": ..., "code": ..., "fields": ... }`.
- **Permissões em duas camadas:**
  - por perfil: cada rota só aceita os perfis autorizados;
  - por recurso: o professor só lança nota e frequência nas turmas em que está vinculado.
- **Template Method** no cálculo da média (ver [backend/README.md](backend/README.md)).
- **Frontend:** hook `useApi` para carregar dados e componentes pequenos e reutilizáveis (ver [frontend/README.md](frontend/README.md)).

### Git

- Branches: `main` (entregas), `develop` (integração), `feature/<nome>`, `refactor/<nome>`, `hotfix/<nome>`, `docs/<nome>`.
- Commits no padrão Conventional Commits: `feat(...)`, `fix(...)`, `refactor(...)`, `test(...)`, `docs(...)`, `chore(...)`.
- Todo merge em `develop` e `main` passa por Pull Request com aprovação de outro integrante.
