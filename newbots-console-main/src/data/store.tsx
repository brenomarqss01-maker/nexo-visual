import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { repository } from "./repository";
import { ADMIN_DISCORD_ID, createEmptyDatabase } from "./seed";
import type {
  AppUser,
  BotSystem,
  Client,
  ConfigRecord,
  Database,
  License,
  Settings,
  SystemConfig,
  SystemField,
} from "./types";
import { addDays, slugify, uid } from "@/lib/dates";

export type OrganizationStatsReset = "all" | "recruitments" | "sales";

interface DataContextValue {
  db: Database;
  ready: boolean;
  databaseError: string | null;
  // sistemas
  createSystem: (input: {
    name: string;
    description?: string | undefined;
    fields: Omit<SystemField, "id">[];
  }) => BotSystem;
  updateSystem: (
    id: string,
    input: { name: string; description?: string | undefined; fields: SystemField[] },
  ) => void;
  deleteSystem: (id: string) => void;
  // clientes
  createClient: (input: {
    id?: string | undefined;
    appName: string;
    discordId: string;
    guildId: string;
    accessRoleId?: string | undefined;
    systemIds: string[];
    expirationDays: number;
  }) => Client;
  updateClient: (
    id: string,
    input: {
      appName: string;
      discordId: string;
      guildId: string;
      accessRoleId?: string | undefined;
    },
  ) => void;
  deleteClient: (id: string) => void;
  // licenças
  setClientSystems: (clientId: string, systemIds: string[], expirationDays: number) => void;
  updateLicenseExpiration: (licenseId: string, expiresAt: string) => void;
  // configurações
  saveConfig: (clientId: string, systemId: string, values: SystemConfig) => void;
  getConfig: (guildId: string, systemId: string) => SystemConfig;
  resetOrganizationStats: (guildId: string, scope: OrganizationStatsReset) => void;
  // usuários / settings
  upsertUser: (user: AppUser) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  resetDatabase: () => void;
  log: (actor: string, action: string, detail?: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(() => createEmptyDatabase());
  const [ready, setReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let alive = true;
    void repository
      .load()
      .then((loaded) => {
        if (!alive) return;
        setDb(loaded);
        setDatabaseError(null);
      })
      .catch((error) => {
        console.error("Não foi possível carregar os dados do MongoDB.", error);
        if (alive) {
          setDatabaseError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os dados do MongoDB.",
          );
        }
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((database: Database) => {
    saveQueue.current = saveQueue.current
      .catch(() => undefined)
      .then(() => repository.save(database))
      .catch((error) => console.error("Não foi possível salvar no MongoDB.", error));
  }, []);

  const commit = useCallback(
    (mutate: (draft: Database) => void) => {
      setDb((prev) => {
        const next: Database = JSON.parse(JSON.stringify(prev));
        mutate(next);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const log = useCallback(
    (actor: string, action: string, detail?: string) => {
      commit((draft) => {
        draft.logs.unshift({ id: uid("log"), at: new Date().toISOString(), actor, action, detail });
        draft.logs = draft.logs.slice(0, 100);
      });
    },
    [commit],
  );

  const value = useMemo<DataContextValue>(() => {
    const createSystem: DataContextValue["createSystem"] = ({ name, description, fields }) => {
      const system: BotSystem = {
        id: slugify(name) || uid("sistema"),
        name,
        description,
        createdAt: new Date().toISOString(),
        fields: fields.map((f) => ({ ...f, id: uid("f") })),
      };
      commit((draft) => {
        const exists = draft.systems.some((s) => s.id === system.id);
        if (exists) system.id = uid(system.id);
        draft.systems.push(system);
        draft.logs.unshift({
          id: uid("log"),
          at: new Date().toISOString(),
          actor: "Administrador",
          action: "Sistema criado",
          detail: name,
        });
      });
      return system;
    };

    const updateSystem: DataContextValue["updateSystem"] = (id, input) => {
      commit((draft) => {
        const system = draft.systems.find((s) => s.id === id);
        if (!system) return;
        system.name = input.name;
        system.description = input.description;
        system.fields = input.fields;
        draft.logs.unshift({
          id: uid("log"),
          at: new Date().toISOString(),
          actor: "Administrador",
          action: "Sistema atualizado",
          detail: input.name,
        });
      });
    };

    const deleteSystem: DataContextValue["deleteSystem"] = (id) => {
      commit((draft) => {
        draft.systems = draft.systems.filter((s) => s.id !== id);
        draft.licenses = draft.licenses.filter((l) => l.systemId !== id);
        draft.configs = draft.configs.filter((c) => c.systemId !== id);
      });
    };

    const createClient: DataContextValue["createClient"] = ({
      id,
      appName,
      discordId,
      guildId,
      accessRoleId,
      systemIds,
      expirationDays,
    }) => {
      const client: Client = {
        id: id ?? uid("cli"),
        appName,
        discordId,
        guildId,
        accessRoleId,
        createdAt: new Date().toISOString(),
      };
      commit((draft) => {
        draft.clients.push(client);
        const expiresAt = addDays(expirationDays);
        for (const systemId of systemIds) {
          draft.licenses.push({
            id: uid("lic"),
            clientId: client.id,
            systemId,
            createdAt: client.createdAt,
            expiresAt,
          });
        }
        if (!draft.users.some((u) => u.discordId === discordId)) {
          draft.users.push({
            discordId,
            name: appName,
            role: discordId === ADMIN_DISCORD_ID ? "admin" : "client",
            avatarColor: "#4f7fd6",
          });
        }
        draft.logs.unshift({
          id: uid("log"),
          at: new Date().toISOString(),
          actor: "Administrador",
          action: "Cliente criado",
          detail: appName,
        });
      });
      return client;
    };

    const updateClient: DataContextValue["updateClient"] = (id, input) => {
      commit((draft) => {
        const client = draft.clients.find((c) => c.id === id);
        if (!client) return;
        const previousGuildId = client.guildId;
        client.appName = input.appName;
        client.discordId = input.discordId;
        client.guildId = input.guildId;
        client.accessRoleId = input.accessRoleId;
        if (previousGuildId !== input.guildId) {
          draft.configs
            .filter((config) => config.clientId === id && config.guildId === previousGuildId)
            .forEach((config) => {
              config.guildId = input.guildId;
            });
        }
      });
    };

    const deleteClient: DataContextValue["deleteClient"] = (id) => {
      commit((draft) => {
        draft.clients = draft.clients.filter((c) => c.id !== id);
        draft.licenses = draft.licenses.filter((l) => l.clientId !== id);
        draft.configs = draft.configs.filter((c) => c.clientId !== id);
      });
    };

    const setClientSystems: DataContextValue["setClientSystems"] = (
      clientId,
      systemIds,
      expirationDays,
    ) => {
      commit((draft) => {
        const current = draft.licenses.filter((l) => l.clientId === clientId);
        // remove os desmarcados
        draft.licenses = draft.licenses.filter(
          (l) => l.clientId !== clientId || systemIds.includes(l.systemId),
        );
        // adiciona os novos
        for (const systemId of systemIds) {
          if (!current.some((l) => l.systemId === systemId)) {
            draft.licenses.push({
              id: uid("lic"),
              clientId,
              systemId,
              createdAt: new Date().toISOString(),
              expiresAt: addDays(expirationDays),
            });
          }
        }
      });
    };

    const updateLicenseExpiration: DataContextValue["updateLicenseExpiration"] = (
      licenseId,
      expiresAt,
    ) => {
      commit((draft) => {
        const license = draft.licenses.find((l) => l.id === licenseId);
        if (license) license.expiresAt = expiresAt;
      });
    };

    const saveConfig: DataContextValue["saveConfig"] = (clientId, systemId, values) => {
      commit((draft) => {
        const client = draft.clients.find((item) => item.id === clientId);
        if (!client) return;
        const existing = draft.configs.find(
          (c) => c.guildId === client.guildId && c.systemId === systemId,
        );
        const updatedAt = new Date().toISOString();
        if (existing) {
          existing.values = values;
          existing.updatedAt = updatedAt;
        } else {
          const record: ConfigRecord = {
            guildId: client.guildId,
            clientId,
            systemId,
            values,
            updatedAt,
          };
          draft.configs.push(record);
        }
        const system = draft.systems.find((s) => s.id === systemId);
        draft.logs.unshift({
          id: uid("log"),
          at: updatedAt,
          actor: draft.clients.find((c) => c.id === clientId)?.appName ?? clientId,
          action: "Configuração salva",
          detail: system?.name,
        });
      });
    };

    const getConfig: DataContextValue["getConfig"] = (guildId, systemId) =>
      db.configs.find((c) => c.guildId === guildId && c.systemId === systemId)?.values ?? {};

    const resetOrganizationStats: DataContextValue["resetOrganizationStats"] = (guildId, scope) => {
      commit((draft) => {
        const statistics = draft.organizationStats.find((item) => item.guildId === guildId);
        if (!statistics) return;

        if (scope === "all" || scope === "recruitments") {
          statistics.recruitmentsTotal = 0;
          statistics.recruiters = [];
        }
        if (scope === "all" || scope === "sales") {
          statistics.salesTotal = 0;
          statistics.organizationRevenue = 0;
          statistics.products = [];
          statistics.sellers = [];
        }
        statistics.updatedAt = new Date().toISOString();
        draft.logs.unshift({
          id: uid("log"),
          at: statistics.updatedAt,
          actor: draft.clients.find((client) => client.guildId === guildId)?.appName ?? guildId,
          action: "Estatísticas limpas",
          detail:
            scope === "all"
              ? "Todos os indicadores"
              : scope === "recruitments"
                ? "Registros e recrutadores"
                : "Vendas, receita, produtos e vendedores",
        });
      });
    };

    const upsertUser: DataContextValue["upsertUser"] = (user) => {
      commit((draft) => {
        const idx = draft.users.findIndex((u) => u.discordId === user.discordId);
        if (idx >= 0) draft.users[idx] = user;
        else draft.users.push(user);
      });
    };

    const updateSettings: DataContextValue["updateSettings"] = (settings) => {
      commit((draft) => {
        draft.settings = { ...draft.settings, ...settings };
      });
    };

    const resetDatabase = () => {
      void repository
        .reset()
        .then(setDb)
        .catch((error) => console.error("Não foi possível restaurar o MongoDB.", error));
    };

    return {
      db,
      ready,
      databaseError,
      createSystem,
      updateSystem,
      deleteSystem,
      createClient,
      updateClient,
      deleteClient,
      setClientSystems,
      updateLicenseExpiration,
      saveConfig,
      getConfig,
      resetOrganizationStats,
      upsertUser,
      updateSettings,
      resetDatabase,
      log,
    };
  }, [db, ready, databaseError, commit, log]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData deve ser usado dentro de <DataProvider>");
  return ctx;
}

/** Selectors */
export function useClientLicenses(clientId: string | undefined): License[] {
  const { db } = useData();
  return useMemo(
    () => (clientId ? db.licenses.filter((l) => l.clientId === clientId) : []),
    [db.licenses, clientId],
  );
}

export function useSystem(systemId: string | undefined): BotSystem | undefined {
  const { db } = useData();
  return useMemo(() => db.systems.find((s) => s.id === systemId), [db.systems, systemId]);
}
