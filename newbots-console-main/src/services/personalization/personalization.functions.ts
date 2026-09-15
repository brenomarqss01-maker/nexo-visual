import { createServerFn } from "@tanstack/react-start";
import { requireAuthenticatedDiscordSession } from "@/services/auth/discordSession";
import { loadPersonalizationApplicationsForViewer } from "@/services/database/mongo";

export const getPersonalizationApplications = createServerFn({ method: "GET" }).handler(
  async () => {
    const viewer = await requireAuthenticatedDiscordSession();
    return loadPersonalizationApplicationsForViewer(viewer);
  },
);
