# Frontend — Nota10

Aplicação React que consome a API do backend. Ela só exibe dados e envia formulários: média, frequência, situação acadêmica e permissões vêm prontas do backend.

**Tecnologias:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7.

---

## Como rodar

```powershell
npm install
copy .env.example .env
npm run dev
```

Abre em http://localhost:5173. O backend precisa estar rodando em http://localhost:8000 (endereço configurado em `VITE_API_BASE_URL` no `.env`).

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npx tsc --noEmit` | Confere os tipos do TypeScript |

---

## Estrutura de pastas

```text
src/
├── App.tsx              Rotas e proteção por perfil
├── main.tsx             Ponto de entrada
├── index.css            Estilos globais e tema
│
├── services/api.ts      Todas as chamadas à API (um método por endpoint)
├── hooks/useApi.ts      Hook que carrega dados e controla loading e erro
├── contexts/
│   └── AuthContext.tsx  Usuário logado, login e logout
├── types/index.ts       Tipos compartilhados
├── utils/
│   ├── telefone.ts      Máscara de telefone
│   └── validacao.ts     Validação dos formulários de pessoa
│
├── components/
│   ├── ui/              Peças genéricas: Button, Input, Modal, Badge, Ficha, Toast,
│   │                    Estado (Carregando, Vazio, Erro), FiltroBusca...
│   ├── layout/          AppShell e Navbar
│   ├── forms/           CamposPessoa, CamposSenha, BotaoSituacao
│   ├── boletim/         BoletimCard
│   ├── dashboard/       ResumoStrip, Saudacao
│   └── professor/       NotaAlunoCard, FrequenciaAlunoLinha
│
└── pages/               Uma pasta por área do sistema
    ├── Login.tsx
    ├── Cursos.tsx, Disciplinas.tsx
    ├── dashboard/       Dashboard (escolhe o painel pelo perfil) e um painel por perfil
    ├── estudantes/      Lista e formulário
    ├── professores/     Lista e formulário
    ├── turmas/          Lista, criação e detalhe
    ├── professor/       Minhas turmas, lançar notas, lançar frequência
    └── aluno/           Meu boletim, meu histórico, meus dados
```

---

## Padrão das páginas

Toda página segue o mesmo formato:

1. **Busca os dados com `useApi`**, passando a função de `services/api.ts`.
2. **Mostra o estado** com `Carregando`, `Erro` ou `Vazio`.
3. **Renderiza a lista** usando componentes pequenos de `components/`.
4. **Depois de criar, editar ou inativar**, chama `recarregar()` para buscar a lista atualizada.

Exemplo (página de cursos, resumida):

```tsx
export function Cursos() {
  const { data: cursos, loading, error, recarregar } = useApi(() => api.getCursos());

  return (
    <div>
      <PageHeader title="Cursos" />

      {error && <Erro texto={error} onTentarNovamente={recarregar} />}

      {loading ? (
        <Carregando texto="Carregando cursos..." />
      ) : !cursos || cursos.length === 0 ? (
        <Vazio texto="Nenhum curso cadastrado." />
      ) : (
        cursos.map(curso => <Ficha key={curso.id} title={curso.nome} />)
      )}
    </div>
  );
}
```

### O hook `useApi`

```ts
const { data, loading, error, recarregar } = useApi(() => api.getAlgo(), [dependencias]);
```

| Retorno | Significado |
|---|---|
| `data` | O que a API devolveu (`null` enquanto carrega) |
| `loading` | `true` enquanto a requisição está em andamento |
| `error` | Mensagem de erro, ou `null` |
| `recarregar()` | Busca os dados de novo |

O segundo parâmetro funciona como no `useEffect`: quando um valor da lista muda (por exemplo, o `id` da URL), os dados são buscados de novo.

### Comunicação com a API

Todas as chamadas ficam em `services/api.ts`. A função `request` adiciona o token JWT no cabeçalho e, quando a API responde com erro, lança um `ApiError` com a mensagem e o status. As páginas nunca chamam `fetch` diretamente.

### Regras que ficam no backend

O frontend **não** calcula média, percentual de frequência nem situação acadêmica. Por exemplo, a cor do selo no boletim vem do campo `situacao` que a API manda (`APROVADO`, `RECUPERACAO`, `REPROVADO`, `EM_ANDAMENTO`).

---

## Rotas

| Rota | Página | Perfil |
|---|---|---|
| `/login` | Login | Todos |
| `/dashboard` | Painel (muda conforme o perfil) | Todos |
| `/estudantes`, `/estudantes/novo`, `/estudantes/:id` | Lista e formulário de estudantes | Coordenação |
| `/professores`, `/professores/novo`, `/professores/:id` | Lista e formulário de professores | Coordenação |
| `/cursos` | Cursos | Coordenação |
| `/disciplinas` | Disciplinas | Coordenação |
| `/turmas`, `/turmas/novo`, `/turmas/:id` | Turmas, criação e detalhe (vínculo e matrícula) | Coordenação |
| `/minhas-turmas`, `/minhas-turmas/:id` | Turmas do professor e detalhe | Professor |
| `/minhas-turmas/:id/notas` | Lançar notas | Professor |
| `/minhas-turmas/:id/frequencia` | Lançar frequência | Professor |
| `/boletim` | Meu boletim | Aluno |
| `/historico` | Meu histórico | Aluno |
| `/meus-dados` | Meus dados | Aluno |

A proteção é feita pelo componente `ProtectedRoute` em `App.tsx`: sem login, o usuário volta para `/login`; com o perfil errado, aparece "Acesso não autorizado". O backend confere as permissões de novo em cada requisição.

---

## Como criar uma página nova

1. Se o endpoint ainda não existir em `services/api.ts`, adicione um método para ele.
2. Crie o arquivo em `pages/<area>/NomeDaPagina.tsx` seguindo o padrão acima.
3. Registre a rota em `App.tsx` dentro de `ProtectedRoute` com os perfis permitidos.
4. Se a página deve aparecer no menu, adicione o item em `components/layout/Navbar.tsx`.
