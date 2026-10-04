import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError, api } from '../../services/api';
import type { MinhaTurmaApi } from '../../services/api';

import { PageHeader } from '../../components/ui/PageHeader';
import {
  Ficha,
  FichaIcons,
  FichaWatermarks,
} from '../../components/ui/Ficha';
import { useToast } from '../../components/ui/Toast';


export function MinhasTurmas() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [turmas, setTurmas] = useState<MinhaTurmaApi[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function carregarTurmas() {
      try {
        setLoading(true);

        const data = await api.getMinhasTurmas();

        setTurmas(data);

      } catch (error) {
        if (error instanceof ApiError) {
          toast(error.message, 'error');
        } else {
          toast('Não foi possível carregar suas turmas.', 'error');
        }

        setTurmas([]);

      } finally {
        setLoading(false);
      }
    }

    carregarTurmas();
  }, [toast]);


  return (
    <div>
      <PageHeader
        title="Minhas Turmas"
        description="Turmas em que você está vinculado como professor."
      />

      {loading ? (
        <div className="card-surface-plain flex items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm font-medium">
            Carregando turmas...
          </p>
        </div>
      ) : turmas.length === 0 ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm font-medium">
            Você não está vinculado a nenhuma turma.
          </p>

          <p className="text-xs mt-1">
            Entre em contato com a Coordenação.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {turmas.map(turma => (
            <Ficha
              key={turma.turma_id}
              eyebrow={`Turma #${turma.turma_id}`}
              title={turma.nome}
              watermark={FichaWatermarks.turma}
              stats={[
                {
                  icon: FichaIcons.turma,
                  label: `${turma.total_alunos} aluno${
                    turma.total_alunos !== 1 ? 's' : ''
                  } matriculado${
                    turma.total_alunos !== 1 ? 's' : ''
                  }`,
                },
              ]}
              actions={
                <button
                  onClick={() =>
                    navigate(`/minhas-turmas/${turma.turma_id}`)
                  }
                  className="text-xs font-bold hover:underline cursor-pointer"
                  style={{ color: '#3A2E00' }}
                >
                  Ver turma →
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}