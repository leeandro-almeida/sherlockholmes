export type CaseSummary = {
  id: string;
  title: string;
  description: string | null;
};

export type AdminClue = {
  id: string;
  caseId: string;
  code: string;
  content: string;
};

export type AdminCase = CaseSummary & {
  clues: AdminClue[];
};

export type RoomPlayer = {
  id: string;
  name: string;
  isMaster: boolean;
};

export type RoomClue = {
  id: string;
  code: string;
  content: string | null; // null quando o jogador ainda nao pode ver
  assignedTo: string[]; // ids dos jogadores que receberam a pista
};

export type RoomState = {
  room: { id: string; code: string; status: string };
  case: { id?: string; title?: string; description?: string | null };
  me: { id: string; name: string; isMaster: boolean } | null;
  isMaster: boolean;
  players: RoomPlayer[];
  clues: RoomClue[];
};
