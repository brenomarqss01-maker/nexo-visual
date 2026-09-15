import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  loadOrganizationStatisticsForViewer,
  resetOrganizationStatisticsForViewer,
} from "@/services/database/mongo";
import { requireAuthenticatedDiscordSession } from "@/services/auth/discordSession";

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
    return resetOrganizationStatisticsForViewer(data.guildId, viewer, data.scope);
  });
