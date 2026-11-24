import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { Carregando, Erro, Vazio } from '../../components/ui/Estado';
import { ResumoStrip, Saudacao } from '../../components/dashboard/ResumoStrip';

function buscarTudo() {
  return Promise.all([
    api.getEstudantes(),
    api.getProfessores(),
    api.getTurmas(),
    api.getDisciplinas(),
  ]);
}

export function DashboardCoordenacao() {
  const { data, loading, error, recarregar } = useApi(buscarTudo);

  const [estudantes, professores, turmas, disciplinas] = data ?? [[], [], [], []];

  const periodoAtual = turmas.map(t => t.periodo_letivo).sort().pop() ?? '';
  const turmasDoPeriodo = turmas.filter(t => t.periodo_letivo === periodoAtual && t.situacao === 'ATIVA');

  const contar = (lista: { situacao: string }[], valor: string) =>
    lista.filter(item => item.situacao.toUpperCase() === valor).length;

  const valor = (n: number) => (loading ? '—' : n);

  return (
    <div>
      <Saudacao
        titulo="Painel da Coordenação"
        subtitulo={periodoAtual ? `Resumo do período letivo ${periodoAtual}` : 'Resumo geral'}
      />

      {error && <Erro texto={error} onTentarNovamente={recarregar} />}

      <ResumoStrip
        items={[
          { label: 'Estudantes ativos', value: valor(contar(estudantes, 'ATIVO')), sub: `${estudantes.length} no total` },
          { label: 'Professores ativos', value: valor(contar(professores, 'ATIVO')) },
          { label: 'Turmas ativas', value: valor(contar(turmas, 'ATIVA')) },
          { label: 'Disciplinas ativas', value: valor(contar(disciplinas, 'ATIVA')) },
        ]}
      />

      <div className="card-surface-plain p-6">
        <h2 className="text-base font-bold text-[#211C10] mb-4">Turmas em andamento {periodoAtual}</h2>

        {loading ? (
          <Carregando texto="Carregando turmas..." />
        ) : turmasDoPeriodo.length === 0 ? (
          <Vazio texto="Nenhuma turma ativa neste período." />
        ) : (
          <div className="divide-y divide-[#F1E9C8]">
            {turmasDoPeriodo.map(turma => (
              <div key={turma.id} className="flex items-center justify-between py-3.5">
                <div className="text-sm font-semibold text-[#211C10]">{turma.disciplina}</div>
                <div className="text-sm text-[#5B5645]">{turma.total_alunos} aluno(s)</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
