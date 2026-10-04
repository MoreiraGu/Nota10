import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError, api } from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

interface AlunoComMedia {
  aluno_id: number;
  nome: string;
  email: string;
  notas: Array<{
    tipo_avaliacao: string;
    peso: number;
    valor: number | null;
  }>;
  media_final: number | null;
}

interface NovaNotaForm {
  tipo_avaliacao: string;
  peso: string;
  valor: string;
}

export function LancarNotas() {
  const { id } = useParams();
  const { toast } = useToast();

  const [turmaNome, setTurmaNome] = useState('');
  const [alunos, setAlunos] = useState<AlunoComMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [forms, setForms] = useState<Record<number, NovaNotaForm>>({});
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  async function carregarDados() {
    if (!id) { setLoading(false); return; }
    try {
      setLoading(true);
      const turmaData = await api.getAlunosTurma(id);
      setTurmaNome(turmaData.nome);

      // Para cada aluno, busca a média atual
      const alunosComMedia = await Promise.all(
        turmaData.alunos.map(async aluno => {
          try {
            const media = await api.getMedia(id, aluno.aluno_id);
            return {
              aluno_id: aluno.aluno_id,
              nome: aluno.nome,
              email: aluno.email,
              notas: media.notas,
              media_final: media.media_final,
            };
          } catch {
            return {
              aluno_id: aluno.aluno_id,
              nome: aluno.nome,
              email: aluno.email,
              notas: [],
              media_final: null,
            };
          }
        })
      );
      setAlunos(alunosComMedia);

      // Inicializa formulários vazios por aluno
      const initForms: Record<number, NovaNotaForm> = {};
      alunosComMedia.forEach(a => {
        initForms[a.aluno_id] = { tipo_avaliacao: '', peso: '1', valor: '' };
      });
      setForms(initForms);
    } catch (e) {
      if (e instanceof ApiError) toast(e.message, 'error');
      else toast('Não foi possível carregar a turma.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [id, toast]);

  const updateForm = (alunoId: number, field: keyof NovaNotaForm, value: string) => {
    setForms(prev => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], [field]: value },
    }));
    setErrors(prev => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], [field]: '' },
    }));
  };

  const handleLancar = async (alunoId: number) => {
    if (!id) return;
    const form = forms[alunoId];
    const errs: Record<string, string> = {};

    if (!form.tipo_avaliacao.trim()) errs.tipo_avaliacao = 'Tipo é obrigatório.';
    const peso = parseFloat(form.peso);
    if (isNaN(peso) || peso <= 0) errs.peso = 'Peso deve ser maior que zero.';
    const valor = parseFloat(form.valor.replace(',', '.'));
    if (isNaN(valor) || valor < 0 || valor > 10) errs.valor = 'Nota deve estar entre 0 e 10.';

    if (Object.keys(errs).length) {
      setErrors(prev => ({ ...prev, [alunoId]: errs }));
      return;
    }

    setSaving(alunoId);
    try {
      await api.lancarNota(id, {
        aluno_id: alunoId,
        tipo_avaliacao: form.tipo_avaliacao.trim(),
        peso,
        valor,
      });

      // Recarrega média do backend (não calcula no frontend)
      const media = await api.getMedia(id, alunoId);
      setAlunos(prev =>
        prev.map(a =>
          a.aluno_id === alunoId
            ? { ...a, notas: media.notas, media_final: media.media_final }
            : a
        )
      );

      // Limpa formulário do aluno
      setForms(prev => ({
        ...prev,
        [alunoId]: { tipo_avaliacao: '', peso: '1', valor: '' },
      }));
      toast('Nota lançada com sucesso.');
    } catch (e) {
      if (e instanceof ApiError) toast(e.message, 'error');
      else toast('Erro ao lançar nota.', 'error');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-sm text-[#948F7C]">Carregando notas...</div>;
  }

  if (!turmaNome && alunos.length === 0) {
    return <div className="text-center py-20 text-sm text-[#948F7C]">Turma não encontrada ou você não possui acesso.</div>;
  }

  return (
    <div>
      <PageHeader
        title={`Notas — ${turmaNome}`}
        description="Lançamento de notas por aluno. A média é calculada pelo backend."
        backTo={`/minhas-turmas/${id}`}
        breadcrumbs={[
          { label: 'Minhas Turmas', href: '/minhas-turmas' },
          { label: turmaNome, href: `/minhas-turmas/${id}` },
          { label: 'Lançar notas' },
        ]}
      />

      <div className="bg-[#FFF7DD] border border-[#F0DFA0] rounded-lg px-4 py-3 mb-5 text-sm text-[#8A6D00]">
        A média é calculada pelo backend (Template Method). O frontend apenas exibe o resultado.
      </div>

      <div className="space-y-5">
        {alunos.map(aluno => {
          const form = forms[aluno.aluno_id] || { tipo_avaliacao: '', peso: '1', valor: '' };
          const errs = errors[aluno.aluno_id] || {};

          return (
            <div key={aluno.aluno_id} className="card-surface overflow-hidden">
              {/* Cabeçalho do aluno */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAD98C]">
                <div>
                  <div className="text-sm font-semibold text-[#211C10]">{aluno.nome}</div>
                  <div className="text-xs text-[#948F7C]">{aluno.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="text-[#5B5645]">Média: </span>
                    {aluno.media_final !== null ? (
                      <span className={`font-bold ${aluno.media_final >= 6 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {aluno.media_final.toFixed(2).replace('.', ',')}
                      </span>
                    ) : (
                      <span className="text-[#B08A00] font-semibold">–</span>
                    )}
                    <span className="text-[10px] text-[#948F7C] ml-1">(backend)</span>
                  </div>
                </div>
              </div>

              {/* Notas já lançadas */}
              {aluno.notas.length > 0 && (
                <div className="divide-y divide-[#F1E9C8] px-5">
                  {aluno.notas.map((nota, idx) => (
                    <div key={idx} className="flex items-center gap-4 py-2.5 text-sm">
                      <div className="flex-1 font-medium text-[#211C10]">{nota.tipo_avaliacao}</div>
                      <div className="text-xs text-[#948F7C]">Peso {nota.peso}</div>
                      <div className={`font-semibold w-12 text-right ${nota.valor !== null && nota.valor >= 6 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {nota.valor !== null ? nota.valor.toFixed(1).replace('.', ',') : '–'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulário para nova nota */}
              <div className="px-5 py-4 bg-[#FFFDF4] border-t border-[#F1E9C8]">
                <p className="text-xs font-semibold text-[#5B5645] mb-3">Lançar nova avaliação</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Tipo (ex: Prova 1)"
                      value={form.tipo_avaliacao}
                      onChange={e => updateForm(aluno.aluno_id, 'tipo_avaliacao', e.target.value)}
                      className={`w-full px-3 py-1.5 text-sm border rounded-[6px] bg-white ${errs.tipo_avaliacao ? 'border-red-400' : 'border-[#D2CFC7] hover:border-[#E6A700]'}`}
                    />
                    {errs.tipo_avaliacao && <p className="text-xs text-red-600 mt-1">{errs.tipo_avaliacao}</p>}
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="Peso (ex: 2)"
                      value={form.peso}
                      onChange={e => updateForm(aluno.aluno_id, 'peso', e.target.value)}
                      className={`w-full px-3 py-1.5 text-sm border rounded-[6px] bg-white ${errs.peso ? 'border-red-400' : 'border-[#D2CFC7] hover:border-[#E6A700]'}`}
                    />
                    {errs.peso && <p className="text-xs text-red-600 mt-1">{errs.peso}</p>}
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="Nota (0-10)"
                      value={form.valor}
                      onChange={e => updateForm(aluno.aluno_id, 'valor', e.target.value)}
                      className={`w-full px-3 py-1.5 text-sm border rounded-[6px] bg-white ${errs.valor ? 'border-red-400' : 'border-[#D2CFC7] hover:border-[#E6A700]'}`}
                    />
                    {errs.valor && <p className="text-xs text-red-600 mt-1">{errs.valor}</p>}
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button
                    size="sm"
                    loading={saving === aluno.aluno_id}
                    onClick={() => handleLancar(aluno.aluno_id)}
                  >
                    Lançar nota
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {alunos.length === 0 && (
        <div className="text-center py-16 text-[#948F7C]">
          <p className="text-sm">Nenhum aluno matriculado nesta turma.</p>
        </div>
      )}
    </div>
  );
}
