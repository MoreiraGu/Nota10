import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  label: string;
  href: string;
}

const navByRole: Record<string, NavItem[]> = {
  coordenacao: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Estudantes', href: '/estudantes' },
    { label: 'Professores', href: '/professores' },
    { label: 'Cursos', href: '/cursos' },
    { label: 'Disciplinas', href: '/disciplinas' },
    { label: 'Turmas', href: '/turmas' },
  ],
  professor: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Minhas Turmas', href: '/minhas-turmas' },
  ],
  aluno: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Minhas Turmas', href: '/minhas-turmas-aluno' },
    { label: 'Meu Boletim', href: '/boletim' },
    { label: 'Meu Histórico', href: '/historico' },
    { label: 'Meus Dados', href: '/meus-dados' },
  ],
};

const roleLabel: Record<string, string> = {
  coordenacao: 'Coordenação',
  professor: 'Professor',
  aluno: 'Aluno',
};

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const items = navByRole[user.perfil] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 w-full" style={{ background: 'var(--color-navbar)', boxShadow: '0 2px 6px rgba(33,28,16,0.10)' }}>
      <div className="flex items-center h-16 px-4 lg:px-6 gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="#3A2E00" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-bold" style={{ color: 'var(--color-navbar-text)' }}>Nota10</div>
            <div className="text-[10px]" style={{ color: 'var(--color-navbar-text-muted)' }}>Gestão Acadêmica</div>
          </div>
        </button>

        {/* Nav links */}
        <nav className="flex-1 overflow-x-auto">
          <ul className="flex items-center gap-1 min-w-max">
            {items.map(item => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <button
                    onClick={() => navigate(item.href)}
                    className="px-3.5 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    style={{
                      background: isActive ? 'var(--color-navbar-active)' : 'transparent',
                      color: 'var(--color-navbar-text)',
                      boxShadow: isActive ? '0 1px 3px rgba(33,28,16,0.15)' : 'none',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-navbar-hover)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + logout */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:block text-right leading-tight">
            <div className="text-xs font-semibold" style={{ color: 'var(--color-navbar-text)' }}>{user.nome}</div>
            <div className="text-[11px]" style={{ color: 'var(--color-navbar-text-muted)' }}>{roleLabel[user.perfil]}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md bg-white hover:bg-white/80 transition-colors cursor-pointer"
            style={{ color: 'var(--color-navbar-text)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
