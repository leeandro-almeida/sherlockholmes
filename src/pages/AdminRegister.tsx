import { useState } from 'react';
import { FiArrowLeft, FiUserPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Crest, ErrorText, Input } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { session } from '../lib/session';

export default function AdminRegister() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function registerAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('O usuário deve ter ao menos 3 caracteres');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/register', {
        username: username.trim(),
        password,
      });
      // O backend já devolve um token — entra direto no painel.
      session.setAdminToken(data.token);
      navigate('/admin');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Crest subtitle="Criar um novo administrador" />

        <Card>
          <form onSubmit={registerAdmin} className="space-y-4">
            <Input
              label="Usuário"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Confirmar senha"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <ErrorText>{error}</ErrorText>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Criando...' : (<><FiUserPlus /> Criar administrador</>)}
            </Button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex w-full items-center justify-center gap-2 text-center text-xs text-muted transition hover:text-parchment"
            >
              <FiArrowLeft /> Voltar para o login
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
