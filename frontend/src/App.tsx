import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { EstudantesList } from './pages/estudantes/EstudantesList';
import { EstudantesForm } from './pages/estudantes/EstudantesForm';
import { ProfessoresList } from './pages/professores/ProfessoresList';
import { ProfessoresForm } from './pages/professores/ProfessoresForm';
import { Cursos } from './pages/Cursos';
import { Disciplinas } from './pages/Disciplinas';
import { TurmasList } from './pages/turmas/TurmasList';
import { TurmasCreate } from './pages/turmas/TurmasCreate';
import { TurmaDetalhe } from './pages/turmas/TurmaDetalhe';
import { MinhasTurmas } from './pages/professor/MinhasTurmas';
import { MinhasTurmaDetalhe } from './pages/professor/MinhasTurmaDetalhe';
import { LancarNotas } from './pages/professor/LancarNotas';
import { LancarFrequencia } from './pages/professor/LancarFrequencia';
import { MeuBoletim } from './pages/aluno/MeuBoletim';
import type { ReactNode } from 'react';

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.perfil)) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-[#211C10] mb-1">Acesso não autorizado</h2>
          <p className="text-sm text-[#5B5645] text-center max-w-sm">
            Você não tem permissão para acessar este recurso. Entre em contato com a Coordenação caso precise de acesso.
          </p>
        </div>
      </AppShell>
    );
  }
  return <AppShell>{children}</AppShell>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* Coordenação */}
      <Route path="/estudantes" element={<ProtectedRoute roles={['coordenacao']}><EstudantesList /></ProtectedRoute>} />
      <Route path="/estudantes/novo" element={<ProtectedRoute roles={['coordenacao']}><EstudantesForm /></ProtectedRoute>} />
      <Route path="/estudantes/:id" element={<ProtectedRoute roles={['coordenacao']}><EstudantesForm /></ProtectedRoute>} />
      <Route path="/professores" element={<ProtectedRoute roles={['coordenacao']}><ProfessoresList /></ProtectedRoute>} />
      <Route path="/professores/novo" element={<ProtectedRoute roles={['coordenacao']}><ProfessoresForm /></ProtectedRoute>} />
      <Route path="/professores/:id" element={<ProtectedRoute roles={['coordenacao']}><ProfessoresForm /></ProtectedRoute>} />
      <Route path="/cursos" element={<ProtectedRoute roles={['coordenacao']}><Cursos /></ProtectedRoute>} />
      <Route path="/disciplinas" element={<ProtectedRoute roles={['coordenacao']}><Disciplinas /></ProtectedRoute>} />
      <Route path="/turmas" element={<ProtectedRoute roles={['coordenacao']}><TurmasList /></ProtectedRoute>} />
      <Route path="/turmas/novo" element={<ProtectedRoute roles={['coordenacao']}><TurmasCreate /></ProtectedRoute>} />
      <Route path="/turmas/:id" element={<ProtectedRoute roles={['coordenacao']}><TurmaDetalhe /></ProtectedRoute>} />

      {/* Professor */}
      <Route path="/minhas-turmas" element={<ProtectedRoute roles={['professor']}><MinhasTurmas /></ProtectedRoute>} />
      <Route path="/minhas-turmas/:id" element={<ProtectedRoute roles={['professor']}><MinhasTurmaDetalhe /></ProtectedRoute>} />
      <Route path="/minhas-turmas/:id/notas" element={<ProtectedRoute roles={['professor']}><LancarNotas /></ProtectedRoute>} />
      <Route path="/minhas-turmas/:id/frequencia" element={<ProtectedRoute roles={['professor']}><LancarFrequencia /></ProtectedRoute>} />

      {/* Aluno */}
      <Route path="/boletim" element={<ProtectedRoute roles={['aluno']}><MeuBoletim /></ProtectedRoute>} />
      <Route path="/minhas-turmas-aluno" element={<ProtectedRoute roles={['aluno']}><div className="text-sm text-[#5B5645] py-8">Em breve.</div></ProtectedRoute>} />
      <Route path="/historico" element={<ProtectedRoute roles={['aluno']}><div className="text-sm text-[#5B5645] py-8">Em breve.</div></ProtectedRoute>} />
      <Route path="/meus-dados" element={<ProtectedRoute roles={['aluno']}><div className="text-sm text-[#5B5645] py-8">Em breve.</div></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
