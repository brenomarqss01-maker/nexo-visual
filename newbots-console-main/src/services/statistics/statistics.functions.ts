import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  loadOrganizationStatisticsForViewer,
  resetOrganizationStatisticsForViewer,
} from "@/services/database/mongo";
import { requireAuthenticatedDiscordSession } from "@/services/auth/discordSession";
import { sendSiteLog } from "@/services/discordSiteLog";

const guildSchema = z.object({
  guildId: z.string().regex(/^\d{15,22}$/, "ID do servidor inválido."),
});

const resetSchema = guildSchema.extend({
  scope: z.enum(["all", "recruitments", "sales"]),
});

export const getOrganizationStatistics = createServerFn({ method: "POST" })
  .validator(guildSchema)
  .handler(async ({ data }) => {
    const viewer = await requireAuthenticatedDiscordSession();
    return loadOrganizationStatisticsForViewer(data.guildId, viewer);
  });

export const resetOrganizationStatistics = createServerFn({ method: "POST" })
  .validator(resetSchema)
  .handler(async ({ data }) => {
    const viewer = await requireAuthenticatedDiscordSession();
    const statistics = await resetOrganizationStatisticsForViewer(data.guildId, viewer, data.scope);
    await sendSiteLog({
      category: "changes",
      title: "Estatísticas restauradas",
      actorId: viewer.discordId,
      fields: [
        { name: "Servidor", value: data.guildId, inline: true },
        {
          name: "Escopo",
          value:
            data.scope === "all"
              ? "Todos os indicadores"
              : data.scope === "recruitments"
                ? "Recrutamentos"
                : "Vendas",
          inline: true,
        },
      ],
    });
    return statistics;
  });
