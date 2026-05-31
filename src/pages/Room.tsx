import { useCallback, useEffect, useState } from 'react';
import {
  FiCheck,
  FiCopy,
  FiEye,
  FiLogOut,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { session } from '../lib/session';
import { useRoomSocket } from '../lib/useRoomSocket';
import type { RoomClue, RoomState } from '../types';

export default function Room() {
  const navigate = useNavigate();
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState('');
  const [selectedClue, setSelectedClue] = useState<RoomClue | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const token = session.getPlayerToken();

  // Recarrega o estado da sala a partir do servidor.
  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<RoomState>('/rooms/current');
      setState(data);
      // Mantem o modal do master sincronizado.
      setSelectedClue((prev) =>
        prev ? data.clues.find((c) => c.id === prev.id) ?? null : null,
      );
    } catch (err) {
      // Sessao invalida -> volta ao lobby.
      session.clearPlayer();
      navigate('/lobby');
      setError(errorMessage(err));
    }
  }, [navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // WebSocket: reage a eventos do servidor em tempo real.
  useRoomSocket(token, (event) => {
    if (event.type === 'clue_revealed') {
      setFlash(`Nova pista liberada para você: nº ${event.clue.code}`);
      setTimeout(() => setFlash(null), 5000);
      refresh();
    } else if (event.type === 'players_updated') {
      refresh();
    } else if (event.type === 'room_finished') {
      setFlash('A partida foi encerrada pelo mestre.');
      refresh();
    }
  });

  async function reveal(clueId: string, playerId: string) {
    try {
      await api.post('/rooms/reveal', { clueId, playerId });
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function leave() {
    try {
      await api.post('/rooms/leave');
    } catch {
      /* ignora */
    }
    session.clearPlayer();
    navigate('/lobby');
  }

  function copyCode() {
    if (state) navigator.clipboard.writeText(state.room.code);
  }

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Carregando a mesa...
      </div>
    );
  }

  const isMaster = state.isMaster;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Cabecalho */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Caso em investigação</p>
          <h1 className="font-serif text-2xl text-parchment">{state.case.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyCode}
            title="Copiar código da sala"
            className="flex items-center gap-2 rounded-lg border border-brass/40 bg-brass/10 px-4 py-2 font-serif text-lg tracking-[0.3em] text-brass-soft transition hover:bg-brass/20"
          >
            {state.room.code} <FiCopy className="text-sm" />
          </button>
          <Button variant="ghost" onClick={leave}>
            <FiLogOut /> Sair
          </Button>
        </div>
      </header>

      {flash && (
        <div className="mb-5 rounded-lg border border-brass/40 bg-brass/10 px-4 py-3 text-sm text-brass-soft">
          {flash}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-lg border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        {/* Coluna principal */}
        <div>
          {isMaster ? (
            <MasterBoard clues={state.clues} onSelect={setSelectedClue} />
          ) : (
            <PlayerNotebook clues={state.clues} />
          )}
        </div>

        {/* Painel lateral de jogadores */}
        <aside>
          <div className="rounded-xl border border-line bg-coal/80 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted">
              <FiUsers /> Jogadores ({state.players.length})
            </h2>
            <ul className="space-y-2">
              {state.players.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-line/60 bg-slate/40 px-3 py-2 text-sm"
                >
                  <span className="text-parchment">
                    {p.name}
                    {p.id === state.me?.id && (
                      <span className="text-muted"> (você)</span>
                    )}
                  </span>
                  {p.isMaster && (
                    <span className="rounded bg-brass/20 px-2 py-0.5 text-xs text-brass-soft">
                      mestre
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {isMaster && (
            <p className="mt-4 px-1 text-xs leading-relaxed text-muted">
              Toque em um código de pista para escolher qual jogador poderá vê-la.
            </p>
          )}
        </aside>
      </div>

      {/* Modal do master para liberar pista */}
      {isMaster && selectedClue && (
        <RevealModal
          clue={selectedClue}
          players={state.players.filter((p) => !p.isMaster)}
          onReveal={(playerId) => reveal(selectedClue.id, playerId)}
          onClose={() => setSelectedClue(null)}
        />
      )}
    </div>
  );
}

// ---- Tabuleiro do mestre: todos os codigos ----
function MasterBoard({
  clues,
  onSelect,
}: {
  clues: RoomClue[];
  onSelect: (clue: RoomClue) => void;
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted">
        Pistas do caso
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {clues.map((clue) => {
          const given = clue.assignedTo.length;
          return (
            <button
              key={clue.id}
              onClick={() => onSelect(clue)}
              className="group relative flex aspect-square flex-col items-center justify-center rounded-xl border border-line bg-slate/40 transition hover:border-brass hover:bg-slate"
            >
              <span className="font-serif text-2xl text-parchment group-hover:text-brass-soft">
                {clue.code}
              </span>
              {given > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brass px-1 text-xs font-semibold text-ink">
                  {given}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {clues.length === 0 && (
        <p className="text-sm text-muted">Este caso não possui pistas cadastradas.</p>
      )}
    </div>
  );
}

// ---- Caderno do jogador: somente pistas liberadas a ele ----
function PlayerNotebook({ clues }: { clues: RoomClue[] }) {
  const revealed = clues.filter((c) => c.content);
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted">
        Seu caderno de pistas
      </h2>
      {revealed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-coal/40 px-6 py-12 text-center text-muted">
          <FiEye className="mx-auto mb-3 text-2xl opacity-50" />
          Nenhuma pista liberada ainda. Quando você chegar a um local no tabuleiro,
          informe o código ao mestre.
        </div>
      ) : (
        <ul className="space-y-3">
          {revealed.map((clue) => (
            <li
              key={clue.id}
              className="rounded-xl border border-line bg-slate/40 p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brass/20 font-serif text-brass-soft">
                  {clue.code}
                </span>
                <span className="text-xs uppercase tracking-widest text-muted">
                  Pista
                </span>
              </div>
              <p className="leading-relaxed text-parchment">{clue.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- Modal de liberacao (master escolhe o jogador) ----
function RevealModal({
  clue,
  players,
  onReveal,
  onClose,
}: {
  clue: RoomClue;
  players: { id: string; name: string }[];
  onReveal: (playerId: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-line bg-coal p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brass/20 font-serif text-xl text-brass-soft">
              {clue.code}
            </span>
            <h3 className="font-serif text-lg text-parchment">Liberar pista</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-parchment">
            <FiX />
          </button>
        </div>

        {clue.content && (
          <p className="mb-4 rounded-md border border-line bg-slate/40 p-3 text-sm leading-relaxed text-parchment">
            {clue.content}
          </p>
        )}

        <p className="mb-2 text-xs uppercase tracking-widest text-muted">
          Quem poderá ver esta pista?
        </p>
        <ul className="space-y-2">
          {players.length === 0 && (
            <li className="text-sm text-muted">Nenhum jogador entrou na sala ainda.</li>
          )}
          {players.map((p) => {
            const already = clue.assignedTo.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  onClick={() => !already && onReveal(p.id)}
                  disabled={already}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-sm transition ${
                    already
                      ? 'cursor-default border-emerald/40 bg-emerald/10 text-emerald'
                      : 'border-line bg-slate/40 text-parchment hover:border-brass hover:bg-slate'
                  }`}
                >
                  {p.name}
                  {already ? (
                    <span className="flex items-center gap-1 text-xs">
                      <FiCheck /> liberada
                    </span>
                  ) : (
                    <FiEye className="text-muted" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
