import { Input } from '../ui/Input';
import { formatarTelefone } from '../../utils/telefone';
import type { DadosPessoa } from '../../utils/validacao';

interface Props {
  dados: DadosPessoa;
  erros: Record<string, string>;
  editando: boolean;
  onChange: (campo: keyof DadosPessoa, valor: string) => void;
}

export function CamposPessoa({ dados, erros, onChange }: Props) {
  return (
    <section className="card-surface p-6">
      <h2 className="text-sm font-bold text-[#211C10] mb-4">Dados pessoais</h2>
      <div className="grid gap-4">
        <Input
          label="Nome completo"
          required
          value={dados.nome}
          onChange={e => onChange('nome', e.target.value)}
          error={erros.nome}
        />
        <Input
          label="E-mail"
          type="email"
          required
          value={dados.email}
          onChange={e => onChange('email', e.target.value)}
          error={erros.email}
          placeholder="email@exemplo.com"
        />
        <Input
          label="Telefone"
          value={dados.telefone}
          onChange={e => onChange('telefone', formatarTelefone(e.target.value))}
          placeholder="(00) 00000-0000"
        />
      </div>
    </section>
  );
}

export function CamposSenha({ dados, erros, editando, onChange }: Props) {
  return (
    <section className="card-surface p-6">
      <h2 className="text-sm font-bold text-[#211C10] mb-4">Acesso</h2>
      <div className="grid gap-4">
        <Input
          label={editando ? 'Nova senha' : 'Senha'}
          type="password"
          required={!editando}
          autoComplete="new-password"
          value={dados.senha}
          onChange={e => onChange('senha', e.target.value)}
          error={erros.senha}
          placeholder={editando ? 'Deixe em branco para manter a atual' : 'Senha de acesso'}
          hint="Mínimo de 6 caracteres."
        />
        {(dados.senha || !editando) && (
          <Input
            label="Confirmar senha"
            type="password"
            required
            autoComplete="new-password"
            value={dados.confirmarSenha}
            onChange={e => onChange('confirmarSenha', e.target.value)}
            error={erros.confirmarSenha}
          />
        )}
      </div>
    </section>
  );
}
