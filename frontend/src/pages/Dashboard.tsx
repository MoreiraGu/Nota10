import { useAuth } from '../contexts/AuthContext';
import { mockEstudantes, mockProfessores, mockTurmas, mockDisciplinas } from '../data/mockData';

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

export function Dashboard() {
  const { user } = useAuth();

  if (user?.perfil === 'coordenacao') {
    const ativos = mockEstudantes.filter(e => e.situacao === 'ativo').length;
    const turmasAtivas = mockTurmas.filter(t => t.situacao === 'ativa').length;
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#211C10] mb-1" style={{ fontFamily: 'var(--font-display)' }}>Painel da Coordenação</h1>
        <p className="text-sm text-[#5B5645] mb-6">Resumo geral do período letivo 2026.2</p>
        <ResumoStrip
          items={[
            { label: 'Estudantes ativos', value: ativos, sub: `${mockEstudantes.length} total` },
            { label: 'Professores', value: mockProfessores.filter(p => p.situacao === 'ativo').length, sub: 'ativos' },
            { label: 'Turmas ativas', value: turmasAtivas, sub: '2026.2' },
            { label: 'Disciplinas', value: mockDisciplinas.filter(d => d.situacao === 'ativa').length, sub: 'ativas' },
          ]}
        />
        <div className="card-surface-plain p-6">
          <h2 className="text-base font-bold text-[#211C10] mb-4">Turmas em andamento — 2026.2</h2>
          <div className="divide-y divide-[#F1E9C8]">
            {mockTurmas.filter(t => t.periodoLetivo === '2026.2').map(t => (
              <div key={t.id} className="flex items-center justify-between py-3.5">
                <div>
                  <div className="text-sm font-semibold text-[#211C10]">{t.disciplina}</div>
                  <div className="text-xs text-[#948F7C]">{t.periodoLetivo}</div>
                </div>
                <div className="text-sm text-[#5B5645] font-medium">{t.totalAlunos} aluno{t.totalAlunos !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (user?.perfil === 'professor') {
    const minhasTurmas = mockTurmas.filter(t =>
      t.professoresVinculados.some(p => p.professorId === user.professorId)
    );
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#211C10] mb-1" style={{ fontFamily: 'var(--font-display)' }}>Olá, {user.nome.split(' ')[0]}</h1>
        <p className="text-sm text-[#5B5645] mb-6">Suas turmas do período letivo 2026.2</p>
        <div className="max-w-sm">
          <ResumoStrip
            items={[
              { label: 'Minhas turmas', value: minhasTurmas.length },
              { label: 'Total de alunos', value: minhasTurmas.reduce((a, t) => a + t.totalAlunos, 0) },
            ]}
          />
        </div>
        {minhasTurmas.length === 0 && (
          <div className="text-center py-12 text-[#948F7C]">
            <p className="text-sm">Nenhuma turma vinculada no momento.</p>
          </div>
        )}
      </div>
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
