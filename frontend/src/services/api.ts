const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
import type { ItemBoletim } from '../types';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getStoredToken(): string | null {
  return localStorage.getItem('nota10_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('nota10_token', token);
  } else {
    localStorage.removeItem('nota10_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }

    const message = errorData?.detail || errorData?.message || `Erro ${response.status}: ${response.statusText}`;
    throw new ApiError(response.status, message, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export interface ProfessorApi {
  id: number;
  nome: string;
  email: string;
  contato?: string;
  situacao: string;
}

export interface AlunoTurmaApi {
  aluno_id: number;
  nome: string;
  email: string;
}

export interface TurmaAlunosApi {
  turma_id: number;
  nome: string;
  alunos: AlunoTurmaApi[];
}

export interface FrequenciaApi {
  turma_id: number;
  aluno_id: number;
  total_aulas: number;
  presencas: number;
  percentual: number;
}

export interface MinhaTurmaApi {
  turma_id: number;
  nome: string;
  total_alunos: number;
}

export const api = {
  // ── Autenticação ───────────────────────────────────────────────────────
  async login(email: string, senha: string) {
    const data = await request<{
      access_token: string;
      token_type: string;
      usuario_id: number;
      nome: string;
      perfil: 'COORDENACAO' | 'PROFESSOR' | 'ALUNO';
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
    setStoredToken(data.access_token);
    return data;
  },

  async getMe() {
    return request<{
      usuario_id: number;
      nome: string;
      perfil: 'COORDENACAO' | 'PROFESSOR' | 'ALUNO';
    }>('/auth/me');
  },

  // ── Cursos ─────────────────────────────────────────────────────────────
  async getCursos() {
    return request<Array<{ id: number; nome: string }>>('/cursos');
  },

  async createCurso(data: { nome: string }) {
    return request<{ id: number; nome: string }>('/cursos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ── Disciplinas ───────────────────────────────────────────────────────
  async getDisciplinas() {
    return request<
      Array<{
        id: number;
        nome: string;
        curso_id: number;
        curso: string;
        situacao: 'ATIVA' | 'INATIVA';
      }>
    >('/disciplinas');
  },

  async createDisciplina(data: { nome: string; curso_id: number }) {
    return request<{
      id: number;
      nome: string;
      curso_id: number;
      curso: string;
      situacao: 'ATIVA' | 'INATIVA';
    }>('/disciplinas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ── Estudantes ─────────────────────────────────────────────────────────
  async getEstudantes() {
    return request<
      Array<{
        id: number;
        nome: string;
        email: string;
        curso_id: number;
        curso?: string;
        situacao: string;
      }>
    >('/estudantes');
  },

  async createEstudante(data: {
    nome: string;
    email: string;
    senha: string;
    contato: string;
    curso_id: number;
  }) {
    return request<{
      id: number;
      usuario_id: number;
      nome: string;
      email: string;
      contato: string;
      curso_id: number;
      situacao: string;
    }>('/estudantes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getEstudante(id: string | number) {
    return request<{
      id: number;
      usuario_id: number;
      nome: string;
      email: string;
      contato: string;
      curso_id: number;
      curso?: string;
      situacao: string;
    }>(`/estudantes/${id}`);
  },

  async updateEstudante(
    id: string | number,
    data: {
      nome?: string;
      email?: string;
      senha?: string;
      contato?: string;
      curso_id?: number;
      situacao?: string;
    }
  ) {
    return request<{
      id: number;
      usuario_id: number;
      nome: string;
      email: string;
      contato: string;
      curso_id: number;
      situacao: string;
    }>(`/estudantes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async inativarEstudante(id: string | number) {
    return request<{
      id: number;
      situacao: string;
    }>(`/estudantes/${id}/inativar`, {
      method: 'PATCH',
    });
  },

  async reativarEstudante(id: string | number) {
    return request<{
      id: number;
      situacao: string;
    }>(`/estudantes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ situacao: 'ATIVO' }),
    });
  },

  // ── Professores ────────────────────────────────────────────────────────
  async getProfessores() {
    return request<ProfessorApi[]>('/professores');
  },

  async getProfessor(id: string | number) {
    return request<ProfessorApi & { usuario_id: number }>(`/professores/${id}`);
  },

  async createProfessor(data: {
    nome: string;
    email: string;
    senha: string;
    contato: string;
  }) {
    return request<ProfessorApi & { usuario_id: number }>('/professores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProfessor(
    id: string | number,
    data: {
      nome?: string;
      email?: string;
      senha?: string;
      contato?: string;
      situacao?: string;
    }
  ) {
    return request<ProfessorApi & { usuario_id: number }>(`/professores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async inativarProfessor(id: string | number) {
    return request<{
      id: number;
      situacao: string;
    }>(`/professores/${id}/inativar`, {
      method: 'PATCH',
    });
  },

  async reativarProfessor(id: string | number) {
    return request<{
      id: number;
      situacao: string;
    }>(`/professores/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ situacao: 'ATIVO' }),
    });
  },

    // ── Turmas / Frequência ───────────────────────────────────────────────

  async getAlunosTurma(turmaId: string | number) {
    return request<TurmaAlunosApi>(
      `/turmas/${turmaId}/alunos`
    );
  },

  async getFrequencia(
    turmaId: string | number,
    alunoId: string | number
  ) {
    return request<FrequenciaApi>(
      `/turmas/${turmaId}/alunos/${alunoId}/frequencia`
    );
  },

  async lancarFrequencia(
    turmaId: string | number,
    data: {
      aluno_id: number;
      total_aulas: number;
      presencas: number;
    }
  ) {
    return request<FrequenciaApi>(
      `/turmas/${turmaId}/frequencia`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async getMinhasTurmas() {
    return request<MinhaTurmaApi[]>('/turmas/minhas');
  },

  // ── Turmas (Coordenação) ────────────────────────────────────────────────

  async createTurma(data: { disciplina_id: number; periodo_letivo: string }) {
    return request<{
      id: number;
      disciplina_id: number;
      periodo_letivo: string;
      situacao: string;
    }>('/turmas', { method: 'POST', body: JSON.stringify(data) });
  },

  async getTurma(id: string | number) {
    return request<{
      id: number;
      disciplina_id: number;
      periodo_letivo: string;
      situacao: string;
      professores: Array<{ id: number; nome: string }>;
      alunos: Array<{ id: number; nome: string }>;
    }>(`/turmas/${id}`);
  },

  async vincularProfessor(turmaId: string | number, professorId: number) {
    return request<{ id: number; turma_id: number; professor_id: number }>(
      `/turmas/${turmaId}/professores`,
      { method: 'POST', body: JSON.stringify({ professor_id: professorId }) }
    );
  },

  async matricularAluno(turmaId: string | number, alunoId: number) {
    return request<{
      id: number;
      turma_id: number;
      aluno_id: number;
      data_matricula: string;
    }>(`/turmas/${turmaId}/matriculas`, {
      method: 'POST',
      body: JSON.stringify({ aluno_id: alunoId }),
    });
  },

  // ── Notas ──────────────────────────────────────────────────────────────

  async lancarNota(
    turmaId: string | number,
    data: { aluno_id: number; tipo_avaliacao: string; peso: number; valor: number }
  ) {
    return request<{
      id: number;
      aluno_id: number;
      disciplina_id: number;
      turma_id: number;
      tipo_avaliacao: string;
      peso: number;
      valor: number;
      professor_lancador_id: number;
      data_lancamento: string;
    }>(`/turmas/${turmaId}/notas`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMedia(turmaId: string | number, alunoId: string | number) {
    return request<{
      aluno_id: number;
      disciplina_id: number;
      notas: Array<{ tipo_avaliacao: string; peso: number; valor: number | null }>;
      media_final: number | null;
    }>(`/turmas/${turmaId}/alunos/${alunoId}/media`);
  },

    // ── Aluno ──────────────────────────────────────────────────────────────
  async getMeuBoletim(): Promise<ItemBoletim[]> {
    const data = await request<
      Array<{
        turma_id: number;
        disciplina: string;
        notas: Array<{
          tipo: string;
          valor: number | null;
        }>;
        media: number | null;
        frequencia: number | null;
      }>
    >('/alunos/me/boletim');

    return data.map(item => ({
      turmaId: String(item.turma_id),
      disciplina: item.disciplina,
      notas: item.notas,
      media: item.media,
      frequencia: item.frequencia,
    }));
  },
};