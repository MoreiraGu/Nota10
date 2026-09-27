export type UserRole = 'coordenacao' | 'professor' | 'aluno';

export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: UserRole;
  ativo: boolean;
}

export interface Estudante {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  curso: string;
  cursoId: string;
  situacao: 'ativo' | 'inativo';
}

export interface Professor {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  situacao: 'ativo' | 'inativo';
}

export interface Curso {
  id: string;
  nome: string;
  totalDisciplinas: number;
}

export interface Disciplina {
  id: string;
  nome: string;
  cursoId: string;
  curso: string;
  situacao: 'ativa' | 'inativa';
  temTurmaAtiva: boolean;
  temNotas: boolean;
}

export interface Turma {
  id: string;
  disciplinaId: string;
  disciplina: string;
  periodoLetivo: string;
  situacao: 'ativa' | 'encerrada';
  totalAlunos: number;
  professoresVinculados: ProfessorVinculo[];
  alunosMatriculados: AlunoMatricula[];
}

export interface ProfessorVinculo {
  professorId: string;
  nome: string;
  email: string;
  situacao: 'ativo' | 'inativo';
}

export interface AlunoMatricula {
  estudanteId: string;
  nome: string;
  email: string;
  curso: string;
  dataMatricula: string;
}

export interface Nota {
  id: string;
  estudanteId: string;
  estudanteNome: string;
  tipoAvaliacao: string;
  peso: number;
  valor: number | null;
  mediaAtual: number | null;
}

export interface Frequencia {
  id: string;
  estudanteId: string;
  estudanteNome: string;
  totalAulas: number;
  totalPresencas: number;
  percentual: number | null;
}

export interface ItemBoletim {
  disciplina: string;
  notas: { tipo: string; valor: number | null }[];
  media: number | null;
  frequencia: number | null;
}
