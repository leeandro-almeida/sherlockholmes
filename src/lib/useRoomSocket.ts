import { useEffect, useRef } from 'react';

const wsURL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3333';

type ServerEvent =
  | { type: 'connected' }
  | { type: 'clue_revealed'; clue: { id: string; code: string; content: string } }
  | { type: 'players_updated' }
  | { type: 'room_finished' };

// Mantem uma conexao WebSocket viva, reconectando automaticamente se a
// internet cair. Chama onEvent para cada mensagem do servidor.
export function useRoomSocket(
  token: string | null,
  onEvent: (event: ServerEvent) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!token) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByUs = false;

    const connect = () => {
      socket = new WebSocket(`${wsURL}/ws?token=${encodeURIComponent(token)}`);

      socket.onmessage = (msg) => {
        try {
          onEventRef.current(JSON.parse(msg.data));
        } catch {
          /* ignora mensagens malformadas */
        }
      };

      socket.onclose = () => {
        if (closedByUs) return;
        // Tenta reconectar apos 2s (ex.: queda de internet).
        reconnectTimer = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      closedByUs = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [token]);
}
