import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useData } from "@/data/store";
import { ADMIN_DISCORD_ID } from "@/data/seed";
import type { AppUser, Client } from "@/data/types";

const SESSION_KEY = "nexo-network.session.v1";

interface AuthContextValue {
  ready: boolean;
  discordId: string | null;
  user: AppUser | null;
  client: Client | null;
  clients: Client[];
  isAdmin: boolean;
  signIn: (discordId: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { db } = useData();
  const [discordId, setDiscordId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedDiscordId = window.localStorage.getItem(SESSION_KEY)?.trim() || null;
    setDiscordId(storedDiscordId);
    setReady(true);
  }, []);

  const signIn = useCallback((id: string) => {
    const discordId = id.trim();
    window.localStorage.setItem(SESSION_KEY, discordId);
    setDiscordId(discordId);
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    setDiscordId(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = discordId
      ? (db.users.find((u) => u.discordId === discordId) ?? {
          discordId,
          name: `Usuário ${discordId.slice(-4)}`,
          role: discordId === ADMIN_DISCORD_ID ? ("admin" as const) : ("client" as const),
          avatarColor: "#4f7fd6",
        })
      : null;
    const userWithAccessRole = user
      ? { ...user, role: discordId === ADMIN_DISCORD_ID ? ("admin" as const) : ("client" as const) }
      : null;
    const clients = discordId ? db.clients.filter((c) => c.discordId === discordId) : [];
    const client = clients[0] ?? null;
    return {
      ready,
      discordId,
      user: userWithAccessRole,
      client,
      clients,
      isAdmin: discordId === ADMIN_DISCORD_ID,
      signIn,
      signOut,
    };
  }, [db, discordId, ready, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
