// Persistencia da sessao no localStorage para que o jogador nao perca a
// partida ao recarregar ou cair a internet.

const PLAYER_KEY = 'sherlock.player.token';
const PLAYER_NAME_KEY = 'sherlock.player.name';
const ADMIN_KEY = 'sherlock.admin.token';

export const session = {
  // ---- Jogador ----
  getPlayerToken(): string | null {
    return localStorage.getItem(PLAYER_KEY);
  },
  setPlayerToken(token: string) {
    localStorage.setItem(PLAYER_KEY, token);
  },
  clearPlayer() {
    localStorage.removeItem(PLAYER_KEY);
  },

  // Nome digitado na entrada do app (lembrado entre sessoes).
  getName(): string {
    return localStorage.getItem(PLAYER_NAME_KEY) ?? '';
  },
  setName(name: string) {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  },

  // ---- Admin ----
  getAdminToken(): string | null {
    return localStorage.getItem(ADMIN_KEY);
  },
  setAdminToken(token: string) {
    localStorage.setItem(ADMIN_KEY, token);
  },
  clearAdmin() {
    localStorage.removeItem(ADMIN_KEY);
  },
};
