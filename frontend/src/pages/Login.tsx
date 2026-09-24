import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mockUsers } from '../data/mockData';
import { Button } from '../components/ui/Button';

type LoginState = 'idle' | 'loading' | 'credentials' | 'inactive' | 'validation';

const mosaicIcons = [
  <path key="a" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  <path key="b" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42A12.083 12.083 0 0112 20.055 12.083 12.083 0 015.84 10.58L12 14z" />,
  <path key="c" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  <path key="d" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />,
  <path key="e" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  <path key="f" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
];

function MosaicTile({ i }: { i: number }) {
  const shades = ['#FFC700', '#FFD84D', '#FFE9A3', '#F2B705', '#E6A700', '#33290A'];
  const bg = shades[i % shades.length];
  const isDark = bg === '#33290A';
  return (
    <div className="aspect-square flex items-center justify-center" style={{ background: bg }}>
      <svg className="w-7 h-7" fill="none" stroke={isDark ? '#FFD84D' : '#33290A'} viewBox="0 0 24 24" style={{ opacity: 0.75 }}>
        {mosaicIcons[i % mosaicIcons.length]}
      </svg>
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [state, setState] = useState<LoginState>('idle');
  const [errors, setErrors] = useState<{ email?: string; senha?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'E-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Informe um e-mail válido.';
    if (!senha) e.senha = 'Senha é obrigatória.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { setState('validation'); return; }
    setState('loading');
    await new Promise(r => setTimeout(r, 1200));
    const user = mockUsers.find(u => u.email === email && u.senha === senha);
    if (!user) { setState('credentials'); return; }
    if (!user.ativo) { setState('inactive'); return; }
    login({ id: user.id, nome: user.nome, email: user.email, perfil: user.perfil, professorId: (user as any).professorId, estudanteId: (user as any).estudanteId });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Painel esquerdo — identidade + formulário */}
      <div className="w-full lg:w-[440px] shrink-0 flex flex-col" style={{ background: '#211C10' }}>
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-12">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-md flex items-center justify-center shrink-0" style={{ background: '#FFC700' }}>
              <svg className="w-6 h-6" fill="none" stroke="#33290A" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Nota10</div>
              <div className="text-xs text-[#B7AE8F]">Sistema de Gestão Acadêmica</div>
            </div>
          </div>

          <h1 className="text-xl font-bold text-white mb-1">Entrar no sistema</h1>
          <p className="text-sm text-[#B7AE8F] mb-7">Use suas credenciais institucionais.</p>

          {state === 'credentials' && (
            <div className="mb-5 px-3.5 py-2.5 rounded-[8px] text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }}>
              E-mail ou senha inválidos.
            </div>
          )}
          {state === 'inactive' && (
            <div className="mb-5 px-3.5 py-2.5 rounded-[8px] text-sm" style={{ background: 'rgba(230,167,0,0.18)', color: '#FFD84D' }}>
              Usuário inativo. Entre em contato com a Coordenação.
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#B7AE8F] mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); setState('idle'); }}
                placeholder="seu@email.com"
                className="w-full bg-transparent border-0 border-b-2 py-1.5 text-sm text-white placeholder:text-[#6B6350] focus:outline-none transition-colors"
                style={{ borderColor: errors.email ? '#EF4444' : '#4A422A' }}
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#B7AE8F] mb-1.5">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => { setSenha(e.target.value); setErrors(prev => ({ ...prev, senha: undefined })); setState('idle'); }}
                placeholder="••••••••"
                className="w-full bg-transparent border-0 border-b-2 py-1.5 text-sm text-white placeholder:text-[#6B6350] focus:outline-none transition-colors"
                style={{ borderColor: errors.senha ? '#EF4444' : '#4A422A' }}
              />
              {errors.senha && <p className="text-xs text-red-400 mt-1">{errors.senha}</p>}
            </div>
            <Button type="submit" loading={state === 'loading'} className="w-full justify-center mt-2">
              {state === 'loading' ? 'Autenticando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid #4A422A' }}>
            <p className="text-xs text-[#B7AE8F] mb-3 font-semibold">Perfis disponíveis para teste</p>
            <div className="space-y-2">
              {[
                { label: 'Coordenação', email: 'coordenacao@sgca.edu.br', role: 'coordenacao' },
                { label: 'Professor', email: 'ana.martins@sgca.edu.br', role: 'professor' },
                { label: 'Aluno', email: 'rafael.almeida@sgca.edu.br', role: 'aluno' },
              ].map(p => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => { setEmail(p.email); setSenha('123456'); setState('idle'); setErrors({}); }}
                  className="w-full text-left px-3.5 py-2.5 rounded-[8px] transition-colors text-xs cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <span className="font-semibold text-white">{p.label}</span>
                  <span className="text-[#8A8062] ml-2">{p.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Painel direito — mosaico decorativo */}
      <div className="hidden lg:grid flex-1 grid-cols-6 grid-rows-4">
        {Array.from({ length: 24 }).map((_, i) => <MosaicTile key={i} i={i} />)}
      </div>
    </div>
  );
}
