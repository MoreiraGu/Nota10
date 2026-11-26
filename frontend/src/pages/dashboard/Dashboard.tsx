import { useAuth } from '../../contexts/AuthContext';
import { DashboardCoordenacao } from './DashboardCoordenacao';
import { DashboardProfessor } from './DashboardProfessor';
import { DashboardAluno } from './DashboardAluno';

export function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const primeiroNome = user.nome.split(' ')[0];

  if (user.perfil === 'coordenacao') return <DashboardCoordenacao />;
  if (user.perfil === 'professor') return <DashboardProfessor nome={primeiroNome} />;
  return <DashboardAluno nome={primeiroNome} />;
}
