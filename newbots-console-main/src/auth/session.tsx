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
import { endDiscordSession } from "@/services/auth/discordOAuth.functions";
import { getPersonalizationApplications } from "@/services/personalization/personalization.functions";
import type { PersonalizationApplication } from "@/services/personalization/personalization.types";

const SESSION_KEY = "nexo-network.session.v1";
const SELECTED_APPLICATION_KEY = "nexo-network.selected-application.v1";

interface AuthContextValue {
  ready: boolean;
  discordId: string | null;
  user: AppUser | null;
  client: Client | null;
  clients: Client[];
  applications: PersonalizationApplication[];
  accessError: string | null;
  selectedClientId: string | null;
  isAdmin: boolean;
  signIn: (discordId: string) => void;
  signOut: () => Promise<void>;
  selectClient: (clientId: string) => void;
  clearSelectedClient: () => void;
  refreshApplications: () => Promise<PersonalizationApplication[]>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { db, ready: dataReady } = useData();
  const [discordId, setDiscordId] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
  const [applications, setApplications] = useState<PersonalizationApplication[]>([]);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    const storedDiscordId = window.localStorage.getItem(SESSION_KEY)?.trim() || null;
    setDiscordId(storedDiscordId);
    setSelectedClientId(window.localStorage.getItem(SELECTED_APPLICATION_KEY)?.trim() || null);
    setSessionReady(true);
  }, []);

  const refreshApplications = useCallback(async (): Promise<PersonalizationApplication[]> => {
    if (!discordId) {
      setApplications([]);
      setAccessError(null);
      return [];
    }
    try {
      const items = await getPersonalizationApplications();
      setApplications(items);
      setAccessError(null);
      return items;
    } catch (error) {
      setApplications([]);
      setAccessError(
        error instanceof Error ? error.message : "Não foi possível validar suas aplicações.",
      );
      return [];
    }
  }, [discordId]);

  useEffect(() => {
    if (!sessionReady) return;
    let active = true;
    setAccessReady(false);
    void refreshApplications().finally(() => {
      if (active) setAccessReady(true);
    });
    return () => {
      active = false;
    };
  }, [sessionReady, refreshApplications]);

  useEffect(() => {
    if (!accessReady || !selectedClientId) return;
    if (applications.some((application) => application.clientId === selectedClientId)) return;
    window.localStorage.removeItem(SELECTED_APPLICATION_KEY);
    setSelectedClientId(null);
  }, [accessReady, applications, selectedClientId]);

  const signIn = useCallback((id: string) => {
    const discordId = id.trim();
    window.localStorage.setItem(SESSION_KEY, discordId);
    window.localStorage.removeItem(SELECTED_APPLICATION_KEY);
    setSelectedClientId(null);
    setDiscordId(discordId);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await endDiscordSession();
    } finally {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(SELECTED_APPLICATION_KEY);
      setApplications([]);
      setSelectedClientId(null);
      setDiscordId(null);
    }
  }, []);

  const selectClient = useCallback(
    (clientId: string) => {
      if (!applications.some((application) => application.clientId === clientId)) return;
      window.localStorage.setItem(SELECTED_APPLICATION_KEY, clientId);
      setSelectedClientId(clientId);
    },
    [applications],
  );

  const clearSelectedClient = useCallback(() => {
    window.localStorage.removeItem(SELECTED_APPLICATION_KEY);
    setSelectedClientId(null);
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
    const selectedClient = selectedClientId
      ? db.clients.find(
          (client) =>
            client.id === selectedClientId &&
            applications.some((application) => application.clientId === client.id),
        )
      : undefined;
    const clients = selectedClient ? [selectedClient] : [];
    return {
      ready: sessionReady && dataReady && (!discordId || accessReady),
      discordId,
      user: userWithAccessRole,
      client: selectedClient ?? null,
      clients,
      applications,
      accessError,
      selectedClientId,
      isAdmin: discordId === ADMIN_DISCORD_ID,
      signIn,
      signOut,
      selectClient,
      clearSelectedClient,
      refreshApplications,
    };
  }, [
    accessError,
    accessReady,
    applications,
    clearSelectedClient,
    dataReady,
    db.clients,
    db.users,
    discordId,
    refreshApplications,
    selectClient,
    selectedClientId,
    sessionReady,
    signIn,
    signOut,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
