export interface DadosPessoa {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
}

export const pessoaVazia: DadosPessoa = {
  nome: '',
  email: '',
  telefone: '',
  senha: '',
  confirmarSenha: '',
};

export function validarPessoa(dados: DadosPessoa, editando: boolean) {
  const erros: Record<string, string> = {};

  if (!dados.nome.trim()) erros.nome = 'Nome completo é obrigatório.';

  if (!dados.email.trim()) erros.email = 'E-mail é obrigatório.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) erros.email = 'Informe um e-mail válido.';

  if (!editando && !dados.senha) erros.senha = 'Senha é obrigatória no cadastro.';
  else if (dados.senha && dados.senha.length < 6) erros.senha = 'A senha deve ter no mínimo 6 caracteres.';

  if (dados.senha && dados.senha !== dados.confirmarSenha) erros.confirmarSenha = 'As senhas não conferem.';

  return erros;
}

export function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, '');
}
