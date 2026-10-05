import { useAuth } from '../contexts/AuthContext';
import { mockEstudantes, mockProfessores, mockTurmas, mockDisciplinas } from '../data/mockData';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type {
  MinhaTurmaApi,
  TurmaListApi,
  ProfessorApi,
} from '../services/api';

function ResumoStrip({ items }: { items: { label: string; value: string | number; sub?: string }[] }) {
  return (
    <div className="card-surface p-6 flex flex-wrap mb-8">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`flex-1 min-w-[140px] px-6 first:pl-0 last:pr-0 ${i > 0 ? 'border-l-[1.5px] border-[#EAD98C]' : ''}`}
        >
          <div className="text-3xl font-bold text-[#211C10] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            {item.value}
          </div>
          <div className="text-sm font-semibold text-[#5B5645]">{item.label}</div>
          {item.sub && <div className="text-xs text-[#948F7C] mt-0.5">{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function ProfessorDashboard({ nome }: { nome: string }) {
  const [turmas, setTurmas] = useState<MinhaTurmaApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        setErro(false);

        const data = await api.getMinhasTurmas();

        if (ativo) {
          setTurmas(data);
        }
      } catch (error) {
        console.error(
          'Erro ao carregar turmas do professor:',
          error
        );

        if (ativo) {
          setTurmas([]);
          setErro(true);
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  const totalTurmas = turmas.length;

  const totalAlunos = turmas.reduce(
    (total, turma) => total + turma.total_alunos,
    0
  );

  return (
    <div>
      <h1
        className="text-2xl font-bold text-[#211C10] mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Olá, {nome.split(' ')[0]}
      </h1>

      <p className="text-sm text-[#5B5645] mb-6">
        Resumo das suas turmas
      </p>

      <div className="max-w-sm">
        <ResumoStrip
          items={[
            {
              label: 'Minhas turmas',
              value: loading ? '—' : totalTurmas,
            },
            {
              label: 'Total de alunos',
              value: loading ? '—' : totalAlunos,
            },
          ]}
        />
      </div>

      {erro && (
        <div className="text-center py-8 text-[#948F7C]">
          <p className="text-sm">
            Não foi possível carregar o resumo das suas turmas.
          </p>
        </div>
      )}

      {!loading && !erro && turmas.length === 0 && (
        <div className="text-center py-12 text-[#948F7C]">
          <p className="text-sm">
            Nenhuma turma vinculada no momento.
          </p>
        </div>
      )}
    </div>
  );
}

const PERIODO_ATUAL = '2026.2';

type EstudanteDashboard = {
  id: number;
  nome: string;
  email: string;
  curso_id: number;
  curso?: string;
  situacao: string;
};

type DisciplinaDashboard = {
  id: number;
  nome: string;
  curso_id: number;
  curso: string;
  situacao: string;
};

function CoordenacaoDashboard() {
  const [estudantes, setEstudantes] =
    useState<EstudanteDashboard[]>([]);

  const [professores, setProfessores] =
    useState<ProfessorApi[]>([]);

  const [turmas, setTurmas] =
    useState<TurmaListApi[]>([]);

  const [disciplinas, setDisciplinas] =
    useState<DisciplinaDashboard[]>([]);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        setErro(false);

        const [
          estudantesData,
          professoresData,
          turmasData,
          disciplinasData,
        ] = await Promise.all([
          api.getEstudantes(),
          api.getProfessores(),
          api.getTurmas(),
          api.getDisciplinas(),
        ]);

        if (!ativo) {
          return;
        }

        setEstudantes(estudantesData);
        setProfessores(professoresData);
        setTurmas(turmasData);
        setDisciplinas(disciplinasData);

      } catch (error) {
        console.error(
          'Erro ao carregar Dashboard da Coordenação:',
          error
        );

        if (ativo) {
          setErro(true);
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  const estudantesAtivos = estudantes.filter(
    estudante =>
      estudante.situacao.toUpperCase() === 'ATIVO'
  ).length;

  const professoresAtivos = professores.filter(
    professor =>
      professor.situacao.toUpperCase() === 'ATIVO'
  ).length;

  const turmasAtivas = turmas.filter(
    turma =>
      turma.situacao.toUpperCase() === 'ATIVA'
  ).length;

  const disciplinasAtivas = disciplinas.filter(
    disciplina =>
      disciplina.situacao.toUpperCase() === 'ATIVA'
  ).length;

  const turmasPeriodoAtual = turmas.filter(
    turma =>
      turma.periodo_letivo === PERIODO_ATUAL &&
      turma.situacao.toUpperCase() === 'ATIVA'
  );

  if (erro) {
    return (
      <div>
        <h1
          className="text-2xl font-bold text-[#211C10] mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Painel da Coordenação
        </h1>

        <div className="text-center py-12 text-[#948F7C]">
          <p className="text-sm">
            Não foi possível carregar os dados do Dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="text-2xl font-bold text-[#211C10] mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Painel da Coordenação
      </h1>

      <p className="text-sm text-[#5B5645] mb-6">
        Resumo geral do período letivo {PERIODO_ATUAL}
      </p>

      <ResumoStrip
        items={[
          {
            label: 'Estudantes ativos',
            value: loading ? '—' : estudantesAtivos,
            sub: loading
              ? ''
              : `${estudantes.length} total`,
          },
          {
            label: 'Professores',
            value: loading ? '—' : professoresAtivos,
            sub: 'ativos',
          },
          {
            label: 'Turmas ativas',
            value: loading ? '—' : turmasAtivas,
            sub: PERIODO_ATUAL,
          },
          {
            label: 'Disciplinas',
            value: loading ? '—' : disciplinasAtivas,
            sub: 'ativas',
          },
        ]}
      />

      <div className="card-surface-plain p-6">
        <h2 className="text-base font-bold text-[#211C10] mb-4">
          Turmas em andamento — {PERIODO_ATUAL}
        </h2>

        {loading ? (
          <div className="py-8 text-center text-sm text-[#948F7C]">
            Carregando turmas...
          </div>
        ) : turmasPeriodoAtual.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#948F7C]">
            Nenhuma turma ativa neste período.
          </div>
        ) : (
          <div className="divide-y divide-[#F1E9C8]">
            {turmasPeriodoAtual.map(turma => (
              <div
                key={turma.id}
                className="flex items-center justify-between py-3.5"
              >
                <div>
                  <div className="text-sm font-semibold text-[#211C10]">
                    {turma.disciplina}
                  </div>

                  <div className="text-xs text-[#948F7C]">
                    {turma.periodo_letivo}
                  </div>
                </div>

                <div className="text-sm text-[#5B5645] font-medium">
                  {turma.total_alunos}{' '}
                  aluno{turma.total_alunos !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();

  if (user?.perfil === 'coordenacao') {
  return <CoordenacaoDashboard />;
}

  if (user?.perfil === 'professor') {
  return (
    <ProfessorDashboard nome={user.nome} />
  );
}

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#211C10] mb-1" style={{ fontFamily: 'var(--font-display)' }}>Olá, {user?.nome.split(' ')[0]}</h1>
      <p className="text-sm text-[#5B5645] mb-6">Acompanhe seu desempenho acadêmico.</p>
      <div className="card-surface p-6 max-w-sm">
        <p className="text-sm text-[#5B5645]">Período letivo atual: <span className="font-bold text-[#211C10]">2026.2</span></p>
      </div>
    </div>
  );
}
