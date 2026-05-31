import { useEffect, useState } from 'react';
import { FiLogOut, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Button, Card, ErrorText, Input } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { session } from '../lib/session';
import type { AdminCase } from '../types';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Novo caso
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  async function load() {
    try {
      const { data } = await api.get<AdminCase[]>('/admin/cases');
      setCases(data);
      if (!selectedId && data[0]) setSelectedId(data[0].id);
    } catch (err) {
      setError(errorMessage(err));
      // Token de admin invalido/expirado.
      if ((err as { response?: { status?: number } }).response?.status === 401) {
        session.clearAdmin();
        navigate('/');
      }
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createCase(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post<AdminCase>('/admin/cases', {
        title: newTitle,
        description: newDesc,
      });
      setNewTitle('');
      setNewDesc('');
      setSelectedId(data.id);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function deleteCase(id: string) {
    if (!confirm('Excluir este caso e todas as suas pistas?')) return;
    await api.delete(`/admin/cases/${id}`);
    if (selectedId === id) setSelectedId(null);
    load();
  }

  function logout() {
    session.clearAdmin();
    navigate('/');
  }

  const selected = cases.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between border-b border-line pb-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Painel do administrador</p>
          <h1 className="font-serif text-2xl text-parchment">Casos &amp; Pistas</h1>
        </div>
        <Button variant="ghost" onClick={logout}>
          <FiLogOut /> Sair
        </Button>
      </header>

      <ErrorText>{error}</ErrorText>

      <div className="mt-4 grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Lista de casos + criar */}
        <aside className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">
              Novo caso
            </h2>
            <form onSubmit={createCase} className="space-y-3">
              <Input
                placeholder="Título do caso"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Input
                placeholder="Descrição (opcional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={!newTitle.trim()}>
                <FiPlus /> Criar caso
              </Button>
            </form>
          </Card>

          <ul className="space-y-2">
            {cases.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                    c.id === selectedId
                      ? 'border-brass bg-brass/10 text-brass-soft'
                      : 'border-line bg-coal/60 text-parchment hover:border-brass/50'
                  }`}
                >
                  <span className="truncate">{c.title}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted">
                    {c.clues.length} pistas
                  </span>
                </button>
              </li>
            ))}
            {cases.length === 0 && (
              <li className="text-sm text-muted">Nenhum caso cadastrado ainda.</li>
            )}
          </ul>
        </aside>

        {/* Detalhe do caso selecionado */}
        <section>
          {selected ? (
            <CaseEditor key={selected.id} theCase={selected} onChange={load} onDelete={deleteCase} />
          ) : (
            <Card className="text-center text-muted">
              Selecione ou crie um caso para gerenciar as pistas.
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function CaseEditor({
  theCase,
  onChange,
  onDelete,
}: {
  theCase: AdminCase;
  onChange: () => void;
  onDelete: (id: string) => void;
}) {
  const [code, setCode] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  async function addClue(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/admin/cases/${theCase.id}/clues`, { code, content });
      setCode('');
      setContent('');
      onChange();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function removeClue(clueId: string) {
    await api.delete(`/admin/clues/${clueId}`);
    onChange();
  }

  return (
    <Card>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="font-serif text-xl text-parchment">{theCase.title}</h2>
          {theCase.description && (
            <p className="mt-1 text-sm text-muted">{theCase.description}</p>
          )}
        </div>
        <Button variant="danger" onClick={() => onDelete(theCase.id)}>
          <FiTrash2 /> Excluir
        </Button>
      </div>

      {/* Adicionar pista */}
      <form
        onSubmit={addClue}
        className="mb-5 grid gap-3 rounded-lg border border-line bg-coal/60 p-4 sm:grid-cols-[100px_1fr_auto] sm:items-end"
      >
        <Input
          label="Código"
          placeholder="12"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Input
          label="Conteúdo da pista"
          placeholder="O que o jogador descobre..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button type="submit" disabled={!code.trim() || !content.trim()}>
          <FiPlus /> Adicionar
        </Button>
      </form>
      <ErrorText>{error}</ErrorText>

      {/* Lista de pistas */}
      <ul className="divide-y divide-line">
        {theCase.clues.map((clue) => (
          <li key={clue.id} className="flex items-start gap-3 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brass/20 font-serif text-brass-soft">
              {clue.code}
            </span>
            <p className="flex-1 text-sm leading-relaxed text-parchment">{clue.content}</p>
            <button
              onClick={() => removeClue(clue.id)}
              className="text-muted transition hover:text-rust"
              title="Remover pista"
            >
              <FiTrash2 />
            </button>
          </li>
        ))}
        {theCase.clues.length === 0 && (
          <li className="py-3 text-sm text-muted">Nenhuma pista cadastrada.</li>
        )}
      </ul>
    </Card>
  );
}
