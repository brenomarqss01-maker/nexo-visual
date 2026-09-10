import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  loadOrganizationStatisticsForViewer,
  resetOrganizationStatisticsForViewer,
} from "@/services/database/mongo";

const viewerSchema = z.object({
  guildId: z.string().regex(/^\d{15,22}$/, "ID do servidor inválido."),
  discordId: z.string().regex(/^\d{15,22}$/, "ID do Discord inválido."),
});

const resetSchema = viewerSchema.extend({
  scope: z.enum(["all", "recruitments", "sales"]),
});

export const getOrganizationStatistics = createServerFn({ method: "POST" })
  .validator(viewerSchema)
  .handler(({ data }) => loadOrganizationStatisticsForViewer(data.guildId, data.discordId));

export const resetOrganizationStatistics = createServerFn({ method: "POST" })
  .validator(resetSchema)
  .handler(({ data }) =>
    resetOrganizationStatisticsForViewer(data.guildId, data.discordId, data.scope),
  );
