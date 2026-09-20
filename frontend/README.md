# 💻 Frontend - Nota 10 (React + TypeScript + Vite)

Este documento detalha a arquitetura da interface web, explicando o papel de cada diretório e arquivo, além dos comandos de instalação e execução.

---

## 📂 Guia Detalhado da Estrutura de Pastas

```text
frontend/
├── src/
│   ├── api/                    # Configuração de clientes HTTP (Axios) e interceptors
│   ├── components/             # Componentes de interface compartilhados (Header, Sidebar, Modais)
│   ├── contexts/               # Gerenciamento de estado global (AuthContext, etc.)
│   ├── pages/                  # Telas do sistema agrupadas por domínio/perfil
│   │   ├── coordenacao/        # Telas da Coordenação (Alunos, Professores, Cursos, Turmas)
│   │   ├── professor/          # Telas do Professor (Minhas Turmas, Notas, Frequência)
│   │   └── aluno/              # Telas do Aluno (Meu Boletim, Minhas Notas)
│   ├── App.tsx                 # Configuração de rotas da aplicação (Router)
│   └── main.tsx                # Ponto de entrada onde o React monta no DOM
├── index.html                  # Arquivo HTML principal
├── package.json                # Dependências e scripts do projeto
├── tsconfig.json               # Configurações do compilador TypeScript
├── vite.config.ts              # Configuração do Vite e proxy reverso
├── .env.example                # Variáveis de ambiente de exemplo
└── README.md                   # Este arquivo
```

---

## 🔍 Para Que Serve Cada Coisa no Frontend?

### 1. `src/api/` (Comunicação com o Backend)
- **Instância do Axios (`client.ts`)**: Centraliza as chamadas para a API com `baseURL: '/api/v1'` (ou via variável de ambiente).
- **Interceptors de Requisição**: Injeta automaticamente o token JWT (`Authorization: Bearer <token>`) armazenado no `localStorage` em todas as requisições autenticadas.
- **Interceptors de Resposta**:
  - `401 Unauthorized`: Detecta token expirado ou inválido e redireciona o usuário para a tela de `/login`.
  - `403 Forbidden`: Captura bloqueio de acesso (ex.: professor tentando abrir turma de outro docente) e emite notificação amigável de permissão negada.

---

### 2. `src/contexts/` (Estado Global da Aplicação)
- **`AuthContext.tsx`**: Armazena e compartilha entre todas as telas:
  - Se o usuário está autenticado (`isAuthenticated`).
  - Os dados do usuário logado (`usuario_id`, `nome`, `perfil`).
  - O perfil do usuário (`COORDENACAO`, `PROFESSOR`, `ALUNO`).
  - Funções de `login` e `logout`.

---

### 3. `src/components/` (Componentes Reutilizáveis)
- **`Header.tsx`**: Barra superior fixa com nome do sistema, dados do usuário logado, badge do perfil ativo e botão de logout.
- **`Sidebar.tsx` (Menu Adaptativo)**: Menu lateral que renderiza links diferentes de acordo com o perfil retornado pelo token:
  - *Coordenação*: Estudantes, Professores, Cursos, Disciplinas, Turmas.
  - *Professor*: Minhas Turmas.
  - *Aluno*: Meu Boletim.
- Componentes visuais como botões, modais de confirmação e tabelas com paginação/busca.

---

### 4. `src/pages/` (Telas por Perfil)
Organização que reflete o inventário de telas do Figma (`telas-frontend-figma.md`):
- **`Login.tsx`**: Tela pública para autenticação por e-mail e senha.
- **`coordenacao/`**:
  - Listagem e formulários de cadastro de Alunos, Professores, Cursos, Disciplinas e Turmas.
  - Associação de professores às turmas e matrícula de alunos.
- **`professor/`**:
  - Visualização de turmas vinculadas ao professor logado.
  - Lançamento de notas por avaliação.
  - Lançamento de presença/aulas para cálculo de frequência.
- **`aluno/`**:
  - Visualização do boletim consolidado (disciplinas, notas, médias finais calculadas e percentual de presença).

---

### 5. Arquivos de Configuração da Raiz
- **`package.json`**:
  - `react` e `react-dom`: Biblioteca fundamental de interface.
  - `react-router-dom`: Navegação de páginas em Single Page Application (SPA).
  - `axios`: Cliente HTTP para chamadas REST.
  - `lucide-react`: Biblioteca moderna e leve de ícones.
  - `vite`: Ferramenta de build ultrarrápida.
- **`vite.config.ts`**: Configura o servidor de desenvolvimento na porta `5173` e possui um proxy pré-configurado para `/api` apontando para o backend `http://localhost:8000`, evitando problemas de CORS durante o desenvolvimento.
- **`tsconfig.json`**: Garante tipagem estrita do TypeScript, prevenindo erros em tempo de compilação.

---

## 🛠️ Comandos de Execução do Frontend

Abra o terminal na pasta `frontend`:

```powershell
# 1. Instalar as dependências do projeto
npm install

# 2. Configurar o arquivo .env
cp .env.example .env

# 3. Iniciar o servidor local de desenvolvimento
npm run dev
```

- A aplicação estará disponível em: `http://localhost:5173`

### Outros Comandos Úteis

```powershell
# Gerar build de produção otimizado
npm run build

# Pré-visualizar o build de produção localmente
npm run preview
```
