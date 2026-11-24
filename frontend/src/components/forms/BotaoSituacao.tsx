import { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface Props {
  ativo: boolean;
  tipo: 'estudante' | 'professor';
  nome: string;
  onInativar: () => Promise<void>;
  onReativar: () => Promise<void>;
}

export function BotaoSituacao({ ativo, tipo, nome, onInativar, onReativar }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const executar = async (acao: () => Promise<void>) => {
    setCarregando(true);
    try {
      await acao();
      setModalAberto(false);
    } finally {
      setCarregando(false);
    }
  };

  if (!ativo) {
    return (
      <Button type="button" className="ml-auto" loading={carregando} onClick={() => executar(onReativar)}>
        Reativar {tipo}
      </Button>
    );
  }

  return (
    <>
      <Button type="button" variant="destructive" className="ml-auto" onClick={() => setModalAberto(true)}>
        Inativar {tipo}
      </Button>

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title={`Inativar ${tipo}?`}>
        <p className="text-sm text-[#5B5645] mb-6">
          <strong>{nome}</strong> não poderá fazer login nem ser incluído em novas turmas. Os registros anteriores continuam salvos.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setModalAberto(false)}>Cancelar</Button>
          <Button variant="destructive" loading={carregando} onClick={() => executar(onInativar)}>
            Inativar {tipo}
          </Button>
        </div>
      </Modal>
    </>
  );
}
