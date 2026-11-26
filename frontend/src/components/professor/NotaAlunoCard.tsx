import { useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

export interface AlunoComNotas {
  aluno_id: number;
  nome: string;
  email: string;
  notas: { tipo_avaliacao: string; peso: number; valor: number | null }[];
  media_final: number | null;
}

interface Props {
  turmaId: string;
  aluno: AlunoComNotas;
  onSalvo: () => void;
}

const inputClass = 'w-full px-3 py-1.5 text-sm border border-[#D2CFC7] rounded-[6px] bg-white hover:border-[#E6A700]';

export function NotaAlunoCard({ turmaId, aluno, onSalvo }: Props) {
  const { toast } = useToast();
  const [tipo, setTipo] = useState('');
  const [peso, setPeso] = useState('1');
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);

  const handleLancar = async () => {
    const pesoNumero = parseFloat(peso);
    const valorNumero = parseFloat(valor.replace(',', '.'));

    if (!tipo.trim()) return setErro('Informe o tipo da avaliação.');
    if (isNaN(pesoNumero) || pesoNumero <= 0) return setErro('Peso deve ser maior que zero.');
    if (isNaN(valorNumero) || valorNumero < 0 || valorNumero > 10) return setErro('Nota deve estar entre 0 e 10.');

    setErro('');
    setSaving(true);
    try {
      await api.lancarNota(turmaId, {
        aluno_id: aluno.aluno_id,
        tipo_avaliacao: tipo.trim(),
        peso: pesoNumero,
        valor: valorNumero,
      });
      toast('Nota lançada com sucesso.');
      setTipo('');
      setPeso('1');
      setValor('');
      onSalvo();
    } catch (err: any) {
      toast(err?.message || 'Erro ao lançar nota.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAD98C]">
        <div>
          <div className="text-sm font-semibold text-[#211C10]">{aluno.nome}</div>
          <div className="text-xs text-[#948F7C]">{aluno.email}</div>
        </div>
        <div className="text-sm text-[#5B5645]">
          Média: <strong className="text-[#211C10]">{aluno.media_final === null ? '–' : aluno.media_final.toFixed(2).replace('.', ',')}</strong>
        </div>
      </div>

      {aluno.notas.length > 0 && (
        <div className="divide-y divide-[#F1E9C8] px-5">
          {aluno.notas.map((nota, i) => (
            <div key={i} className="flex items-center gap-4 py-2.5 text-sm">
              <div className="flex-1 font-medium text-[#211C10]">{nota.tipo_avaliacao}</div>
              <div className="text-xs text-[#948F7C]">Peso {nota.peso}</div>
              <div className="font-semibold w-12 text-right">
                {nota.valor === null ? '–' : nota.valor.toFixed(1).replace('.', ',')}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-5 py-4 bg-[#FFFDF4] border-t border-[#F1E9C8]">
        <p className="text-xs font-semibold text-[#5B5645] mb-3">Lançar nova avaliação</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" placeholder="Tipo (ex: Prova 1)" value={tipo} onChange={e => setTipo(e.target.value)} className={inputClass} />
          <input type="number" step="0.1" min="0.1" placeholder="Peso" value={peso} onChange={e => setPeso(e.target.value)} className={inputClass} />
          <input type="number" step="0.1" min="0" max="10" placeholder="Nota (0-10)" value={valor} onChange={e => setValor(e.target.value)} className={inputClass} />
        </div>
        {erro && <p className="text-xs text-red-600 mt-2">{erro}</p>}
        <div className="flex justify-end mt-3">
          <Button size="sm" loading={saving} onClick={handleLancar}>Lançar nota</Button>
        </div>
      </div>
    </div>
  );
}
