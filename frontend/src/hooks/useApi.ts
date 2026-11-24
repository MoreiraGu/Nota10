import { useEffect, useState } from 'react';

export function useApi<T>(buscar: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;

    setLoading(true);
    setError(null);

    buscar()
      .then(resultado => {
        if (ativo) setData(resultado);
      })
      .catch(err => {
        if (ativo) setError(err?.message || 'Não foi possível carregar os dados.');
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [...deps, versao]);

  const recarregar = () => setVersao(v => v + 1);

  return { data, loading, error, recarregar };
}
