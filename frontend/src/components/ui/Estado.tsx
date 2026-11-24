import type { ReactNode } from 'react';

export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div className="card-surface-plain flex items-center justify-center py-16 text-[#948F7C]">
      <p className="text-sm font-semibold">{texto}</p>
    </div>
  );
}

export function Vazio({ texto, children }: { texto: string; children?: ReactNode }) {
  return (
    <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C] gap-3">
      <p className="text-sm">{texto}</p>
      {children}
    </div>
  );
}

export function Erro({ texto, onTentarNovamente }: { texto: string; onTentarNovamente?: () => void }) {
  return (
    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between gap-4">
      <span>{texto}</span>
      {onTentarNovamente && (
        <button onClick={onTentarNovamente} className="font-semibold underline cursor-pointer shrink-0">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
