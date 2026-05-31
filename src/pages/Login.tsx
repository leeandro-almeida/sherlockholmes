import { useState } from 'react';
import { FiArrowRight, FiLock, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Crest, ErrorText, Input } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { session } from '../lib/session';

type Mode = 'player' | 'admin';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('player');

  const [name, setName] = useState(session.getName());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasOngoing = Boolean(session.getPlayerToken());

  function enterAsPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Digite seu nome para continuar');
      return;
    }
    session.setName(name.trim());
    navigate('/lobby');
  }

  async function loginAsAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/login', { username, password });
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
        <Crest subtitle="Mesa de investigação para Sherlock Holmes" />

        {hasOngoing && (
          <button
            onClick={() => navigate('/room')}
            className="mb-4 w-full rounded-lg border border-brass/40 bg-brass/10 px-4 py-3 text-left text-sm text-brass-soft transition hover:bg-brass/20"
          >
            ↩︎ Você tem uma partida em andamento — voltar para a mesa
          </button>
        )}

        <Card>
          {/* Alternador entre os dois modos de entrada */}
          <div className="mb-6 flex rounded-lg border border-line p-1">
            <TabButton active={mode === 'player'} onClick={() => setMode('player')}>
              <FiUser /> Jogador
            </TabButton>
            <TabButton active={mode === 'admin'} onClick={() => setMode('admin')}>
              <FiLock /> Administrador
            </TabButton>
          </div>

          {mode === 'player' ? (
            <form onSubmit={enterAsPlayer} className="space-y-4">
              <Input
                label="Seu nome"
                placeholder="Ex.: Watson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <ErrorText>{error}</ErrorText>
              <Button type="submit" className="w-full">
                Entrar <FiArrowRight />
              </Button>
              <p className="text-center text-xs text-muted">
                Você poderá criar uma sala ou entrar em uma com o código.
              </p>
            </form>
          ) : (
            <form onSubmit={loginAsAdmin} className="space-y-4">
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
              <ErrorText>{error}</ErrorText>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Acessar painel'}
              </Button>
              <button
                type="button"
                onClick={() => navigate('/admin/register')}
                className="w-full text-center text-xs text-muted transition hover:text-parchment"
              >
                Não tem conta? Criar administrador
              </button>
              <p className="text-center text-xs text-muted">
                Área restrita para cadastrar casos e pistas.
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
        active ? 'bg-brass text-ink' : 'text-muted hover:text-parchment'
      }`}
    >
      {children}
    </button>
  );
}
