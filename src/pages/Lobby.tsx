import { useEffect, useState } from 'react';
import { FiArrowLeft, FiLogIn, FiPlusCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Crest, ErrorText, Input } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { session } from '../lib/session';
import type { CaseSummary } from '../types';

type Tab = 'create' | 'join';

export default function Lobby() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('create');
  const [name, setName] = useState(session.getName());

  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [caseId, setCaseId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sem nome, volta para a tela inicial.
  useEffect(() => {
    if (!session.getName()) navigate('/');
  }, [navigate]);

  // Carrega os casos disponiveis para o master escolher.
  useEffect(() => {
    api
      .get<CaseSummary[]>('/cases')
      .then(({ data }) => {
        setCases(data);
        if (data[0]) setCaseId(data[0].id);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!caseId) {
      setError('Selecione um caso');
      return;
    }
    setLoading(true);
    try {
      session.setName(name.trim());
      const { data } = await api.post('/rooms', { name: name.trim(), caseId });
      session.setPlayerToken(data.token);
      navigate('/room');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function joinRoom(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      session.setName(name.trim());
      const { data } = await api.post('/rooms/join', {
        name: name.trim(),
        code: code.trim().toUpperCase(),
      });
      session.setPlayerToken(data.token);
      navigate('/room');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Crest subtitle={`Olá, ${name || 'detetive'}`} />

        <Card>
          <div className="mb-6 flex rounded-lg border border-line p-1">
            <TabButton active={tab === 'create'} onClick={() => setTab('create')}>
              <FiPlusCircle /> Criar sala
            </TabButton>
            <TabButton active={tab === 'join'} onClick={() => setTab('join')}>
              <FiLogIn /> Entrar com código
            </TabButton>
          </div>

          {tab === 'create' ? (
            <form onSubmit={createRoom} className="space-y-4">
              <Input
                label="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted">
                  Caso da partida
                </span>
                <select
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full rounded-md border border-line bg-coal px-3.5 py-2.5 text-parchment outline-none focus:border-brass"
                >
                  {cases.length === 0 && <option value="">Nenhum caso cadastrado</option>}
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <ErrorText>{error}</ErrorText>
              <Button type="submit" className="w-full" disabled={loading || !caseId}>
                {loading ? 'Criando...' : 'Criar e ser o mestre'}
              </Button>
              <p className="text-center text-xs text-muted">
                Você será o dono da sala e controlará as pistas.
              </p>
            </form>
          ) : (
            <form onSubmit={joinRoom} className="space-y-4">
              <Input
                label="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Código da sala"
                placeholder="Ex.: K7P2Q"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={5}
                className="font-serif text-lg tracking-[0.3em]"
              />
              <ErrorText>{error}</ErrorText>
              <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
                {loading ? 'Entrando...' : 'Entrar na partida'}
              </Button>
            </form>
          )}
        </Card>

        <button
          onClick={() => navigate('/')}
          className="mx-auto mt-5 flex items-center gap-2 text-sm text-muted transition hover:text-parchment"
        >
          <FiArrowLeft /> Voltar
        </button>
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
