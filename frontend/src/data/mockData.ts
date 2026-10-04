import type { Estudante, Professor, Curso, Disciplina, Turma, Nota, Frequencia, ItemBoletim } from '../types';

export const mockEstudantes: Estudante[] = [
  { id: 'e1', nome: 'Rafael Almeida', email: 'rafael.almeida@sgca.edu.br', telefone: '(11) 98765-4321', cursoId: 'c1', curso: 'Sistemas de Informação', situacao: 'ativo' },
  { id: 'e2', nome: 'Mariana Souza', email: 'mariana.souza@sgca.edu.br', telefone: '(11) 97654-3210', cursoId: 'c2', curso: 'Engenharia de Software', situacao: 'ativo' },
  { id: 'e3', nome: 'Lucas Oliveira', email: 'lucas.oliveira@sgca.edu.br', telefone: '(21) 96543-2109', cursoId: 'c3', curso: 'Ciência de Dados', situacao: 'ativo' },
  { id: 'e4', nome: 'Beatriz Santos', email: 'beatriz.santos@sgca.edu.br', telefone: '(21) 95432-1098', cursoId: 'c1', curso: 'Sistemas de Informação', situacao: 'inativo' },
  { id: 'e5', nome: 'Gabriel Costa', email: 'gabriel.costa@sgca.edu.br', telefone: '(31) 94321-0987', cursoId: 'c2', curso: 'Engenharia de Software', situacao: 'ativo' },
];

export const mockProfessores: Professor[] = [
  { id: 'p1', nome: 'Ana Martins', email: 'ana.martins@sgca.edu.br', telefone: '(11) 98888-1111', situacao: 'ativo' },
  { id: 'p2', nome: 'Carlos Mendes', email: 'carlos.mendes@sgca.edu.br', telefone: '(11) 97777-2222', situacao: 'ativo' },
  { id: 'p3', nome: 'Juliana Ferreira', email: 'juliana.ferreira@sgca.edu.br', telefone: '(21) 96666-3333', situacao: 'inativo' },
];

export const mockCursos: Curso[] = [
  { id: 'c1', nome: 'Sistemas de Informação', totalDisciplinas: 3 },
  { id: 'c2', nome: 'Engenharia de Software', totalDisciplinas: 2 },
  { id: 'c3', nome: 'Ciência de Dados', totalDisciplinas: 1 },
];

export const mockDisciplinas: Disciplina[] = [
  { id: 'd1', nome: 'Programação Web', cursoId: 'c1', curso: 'Sistemas de Informação', situacao: 'ativa', temTurmaAtiva: true, temNotas: true },
  { id: 'd2', nome: 'Banco de Dados', cursoId: 'c1', curso: 'Sistemas de Informação', situacao: 'ativa', temTurmaAtiva: false, temNotas: false },
  { id: 'd3', nome: 'Engenharia de Software', cursoId: 'c2', curso: 'Engenharia de Software', situacao: 'ativa', temTurmaAtiva: true, temNotas: false },
  { id: 'd4', nome: 'Estruturas de Dados', cursoId: 'c2', curso: 'Engenharia de Software', situacao: 'inativa', temTurmaAtiva: false, temNotas: true },
];

export const mockTurmas: Turma[] = [
  {
    id: 't1',
    disciplinaId: 'd1',
    disciplina: 'Programação Web',
    periodoLetivo: '2026.2',
    situacao: 'ativa',
    totalAlunos: 3,
    professoresVinculados: [
      { professorId: 'p1', nome: 'Ana Martins', email: 'ana.martins@sgca.edu.br', situacao: 'ativo' },
    ],
    alunosMatriculados: [
      { estudanteId: 'e1', nome: 'Rafael Almeida', email: 'rafael.almeida@sgca.edu.br', curso: 'Sistemas de Informação', dataMatricula: '2026-07-15' },
      { estudanteId: 'e2', nome: 'Mariana Souza', email: 'mariana.souza@sgca.edu.br', curso: 'Engenharia de Software', dataMatricula: '2026-07-15' },
      { estudanteId: 'e5', nome: 'Gabriel Costa', email: 'gabriel.costa@sgca.edu.br', curso: 'Engenharia de Software', dataMatricula: '2026-07-16' },
    ],
  },
  {
    id: 't2',
    disciplinaId: 'd3',
    disciplina: 'Engenharia de Software',
    periodoLetivo: '2026.1',
    situacao: 'encerrada',
    totalAlunos: 2,
    professoresVinculados: [
      { professorId: 'p2', nome: 'Carlos Mendes', email: 'carlos.mendes@sgca.edu.br', situacao: 'ativo' },
    ],
    alunosMatriculados: [
      { estudanteId: 'e2', nome: 'Mariana Souza', email: 'mariana.souza@sgca.edu.br', curso: 'Engenharia de Software', dataMatricula: '2026-02-10' },
      { estudanteId: 'e3', nome: 'Lucas Oliveira', email: 'lucas.oliveira@sgca.edu.br', curso: 'Ciência de Dados', dataMatricula: '2026-02-11' },
    ],
  },
  {
    id: 't3',
    disciplinaId: 'd2',
    disciplina: 'Banco de Dados',
    periodoLetivo: '2026.2',
    situacao: 'ativa',
    totalAlunos: 0,
    professoresVinculados: [],
    alunosMatriculados: [],
  },
];

export const mockNotas: Nota[] = [
  { id: 'n1', estudanteId: 'e1', estudanteNome: 'Rafael Almeida', tipoAvaliacao: 'Prova 1', peso: 3, valor: 8.5, mediaAtual: 7.8 },
  { id: 'n2', estudanteId: 'e1', estudanteNome: 'Rafael Almeida', tipoAvaliacao: 'Prova 2', peso: 3, valor: null, mediaAtual: 7.8 },
  { id: 'n3', estudanteId: 'e1', estudanteNome: 'Rafael Almeida', tipoAvaliacao: 'Trabalho', peso: 4, valor: 7.0, mediaAtual: 7.8 },
  { id: 'n4', estudanteId: 'e2', estudanteNome: 'Mariana Souza', tipoAvaliacao: 'Prova 1', peso: 3, valor: 9.0, mediaAtual: 8.7 },
  { id: 'n5', estudanteId: 'e2', estudanteNome: 'Mariana Souza', tipoAvaliacao: 'Prova 2', peso: 3, valor: 8.5, mediaAtual: 8.7 },
  { id: 'n6', estudanteId: 'e2', estudanteNome: 'Mariana Souza', tipoAvaliacao: 'Trabalho', peso: 4, valor: 8.5, mediaAtual: 8.7 },
  { id: 'n7', estudanteId: 'e5', estudanteNome: 'Gabriel Costa', tipoAvaliacao: 'Prova 1', peso: 3, valor: null, mediaAtual: null },
  { id: 'n8', estudanteId: 'e5', estudanteNome: 'Gabriel Costa', tipoAvaliacao: 'Prova 2', peso: 3, valor: null, mediaAtual: null },
  { id: 'n9', estudanteId: 'e5', estudanteNome: 'Gabriel Costa', tipoAvaliacao: 'Trabalho', peso: 4, valor: null, mediaAtual: null },
];

export const mockFrequencia: Frequencia[] = [
  { id: 'f1', estudanteId: 'e1', estudanteNome: 'Rafael Almeida', totalAulas: 20, totalPresencas: 18, percentual: 90 },
  { id: 'f2', estudanteId: 'e2', estudanteNome: 'Mariana Souza', totalAulas: 20, totalPresencas: 20, percentual: 100 },
  { id: 'f3', estudanteId: 'e5', estudanteNome: 'Gabriel Costa', totalAulas: 20, totalPresencas: 14, percentual: 70 },
];

export const mockBoletim: ItemBoletim[] = [
  {
    disciplina: 'Programação Web',
    notas: [{ tipo: 'Prova 1', valor: 8.5 }, { tipo: 'Prova 2', valor: null }, { tipo: 'Trabalho', valor: 7.0 }],
    media: 7.8,
    frequencia: 90,
  },
  {
    disciplina: 'Banco de Dados',
    notas: [{ tipo: 'Prova 1', valor: 7.0 }, { tipo: 'Prova 2', valor: 8.0 }, { tipo: 'Trabalho', valor: 9.0 }],
    media: 8.0,
    frequencia: 85,
  },
  {
    disciplina: 'Engenharia de Software',
    notas: [{ tipo: 'Prova 1', valor: null }, { tipo: 'Trabalho', valor: null }],
    media: null,
    frequencia: null,
  },
];

export const mockUsers = [
  { id: 'u1', nome: 'Coordenação Acadêmica', email: 'coordenacao@sgca.edu.br', senha: '123456', perfil: 'coordenacao' as const, ativo: true },
  { id: 'u2', nome: 'Ana Martins', email: 'ana.martins@sgca.edu.br', senha: '123456', perfil: 'professor' as const, ativo: true, professorId: 'p1' },
  { id: 'u3', nome: 'Rafael Almeida', email: 'rafael.almeida@sgca.edu.br', senha: '123456', perfil: 'aluno' as const, ativo: true, estudanteId: 'e1' },
  { id: 'u4', nome: 'Beatriz Santos', email: 'beatriz.santos@sgca.edu.br', senha: '123456', perfil: 'aluno' as const, ativo: false, estudanteId: 'e4' },
];
