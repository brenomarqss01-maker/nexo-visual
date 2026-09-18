import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ADMIN_DISCORD_ID } from "@/data/seed";
import { requireAuthenticatedDiscordSession } from "@/services/auth/discordSession";
import { assertClientAccessForViewer } from "@/services/database/mongo";
import { sendSiteLog } from "@/services/discordSiteLog";

const accessSchema = z.discriminatedUnion("area", [
  z.object({ area: z.literal("admin") }),
  z.object({
    area: z.literal("application"),
    clientId: z.string().trim().min(1).max(100),
    guildId: z.string().regex(/^\d{15,22}$/),
  }),
]);

export const recordPanelAccess = createServerFn({ method: "POST" })
  .validator(accessSchema)
  .handler(async ({ data }) => {
    const viewer = await requireAuthenticatedDiscordSession();

    if (data.area === "admin") {
      if (viewer.discordId !== ADMIN_DISCORD_ID) {
        throw new Error("Você não possui acesso ao painel administrativo.");
      }
      await sendSiteLog({
        category: "access",
        title: "Painel administrativo acessado",
        actorId: viewer.discordId,
        fields: [{ name: "Área", value: "Administração NEXO", inline: true }],
      });
      return { ok: true };
    }

    const client = await assertClientAccessForViewer(data.clientId, data.guildId, viewer);
    await sendSiteLog({
      category: "access",
      title: "Aplicação acessada",
      actorId: viewer.discordId,
      fields: [
        { name: "Aplicação", value: client.appName, inline: true },
        { name: "Servidor", value: client.guildId, inline: true },
        { name: "Cliente", value: client.id, inline: true },
      ],
    });
    return { ok: true };
  });
