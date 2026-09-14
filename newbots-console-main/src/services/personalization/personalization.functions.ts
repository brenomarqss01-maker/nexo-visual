import { createServerFn } from "@tanstack/react-start";
import { requireAuthenticatedDiscordId } from "@/services/auth/discordSession";
import { loadPersonalizationApplicationsForViewer } from "@/services/database/mongo";

export const getPersonalizationApplications = createServerFn({ method: "GET" }).handler(
  async () => {
    const discordId = await requireAuthenticatedDiscordId();
    return loadPersonalizationApplicationsForViewer(discordId);
  },
);
