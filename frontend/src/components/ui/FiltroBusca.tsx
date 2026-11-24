interface FiltroBuscaProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  situacao: string;
  onSituacaoChange: (valor: string) => void;
  total: string;
}

export function FiltroBusca({ busca, onBuscaChange, situacao, onSituacaoChange, total }: FiltroBuscaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <input
        type="text"
        placeholder="Buscar por nome..."
        value={busca}
        onChange={e => onBuscaChange(e.target.value)}
        className="flex-1 min-w-[220px] max-w-xs px-4 py-2.5 text-sm border-[1.5px] border-[#D2CFC7] rounded-full bg-white hover:border-[#E6A700] focus:border-[#E6A700]"
      />
      <select
        value={situacao}
        onChange={e => onSituacaoChange(e.target.value)}
        className="px-4 py-2.5 text-sm border-[1.5px] border-[#D2CFC7] rounded-full bg-white hover:border-[#E6A700] cursor-pointer"
      >
        <option value="">Todas as situações</option>
        <option value="ativo">Ativo</option>
        <option value="inativo">Inativo</option>
      </select>
      <span className="text-xs font-semibold text-[#948F7C] ml-auto">{total}</span>
    </div>
  );
}
