import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAuthenticatedDiscordId } from "@/services/auth/discordSession";
import {
  loadPersonalizationContextForViewer,
  saveBotCustomizationForViewer,
} from "@/services/database/mongo";
import {
  reportCustomizationTechnicalError,
  sendCustomizationRequest,
} from "@/services/personalization/discordNotification";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_REQUEST_SIZE = 4_250_000;
const IMAGE_TYPES = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);

const customizationSchema = z.object({
  clientId: z.string().trim().min(1).max(100),
  requestedName: z.string().trim().min(2).max(32),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida."),
  presenceStatus: z.enum(["online", "idle", "dnd", "invisible"]),
  statusMessages: z.array(z.string().trim().min(1).max(128)).min(1).max(8),
});

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function uploadedFile(value: FormDataEntryValue | null): File | undefined {
  return typeof value === "string" || !value || value.size === 0 ? undefined : value;
}

function validateImage(file: File | undefined, label: string): string | undefined {
  if (!file) return undefined;
  if (!IMAGE_TYPES.has(file.type)) return `${label} deve ser PNG, JPG, WEBP ou GIF.`;
  if (file.size > MAX_FILE_SIZE) return `${label} deve ter no máximo 2 MB.`;
  return undefined;
}

export const Route = createFileRoute("/api/personalization")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const contentLength = Number(request.headers.get("content-length") ?? "0");
        if (contentLength > MAX_REQUEST_SIZE) {
          return json({ ok: false, error: "Os arquivos enviados ultrapassam 4 MB." }, 413);
        }

        let discordId: string;
        try {
          discordId = await requireAuthenticatedDiscordId();
        } catch (error) {
          return json(
            {
              ok: false,
              error: error instanceof Error ? error.message : "Sua sessão expirou.",
            },
            401,
          );
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return json({ ok: false, error: "Não foi possível ler os dados enviados." }, 400);
        }
        let statusMessages: unknown = [];
        try {
          statusMessages = JSON.parse(String(form.get("statusMessages") ?? "[]"));
        } catch {
          return json({ ok: false, error: "A lista de status é inválida." }, 400);
        }
        const parsed = customizationSchema.safeParse({
          clientId: form.get("clientId"),
          requestedName: form.get("requestedName"),
          accentColor: form.get("accentColor"),
          presenceStatus: form.get("presenceStatus"),
          statusMessages,
        });
        if (!parsed.success) {
          return json(
            {
              ok: false,
              error: parsed.error.issues[0]?.message ?? "Preencha todos os campos corretamente.",
            },
            400,
          );
        }

        const avatar = uploadedFile(form.get("avatar"));
        const banner = uploadedFile(form.get("banner"));
        const imageError =
          validateImage(avatar, "A foto de perfil") ?? validateImage(banner, "O banner");
        if (imageError) return json({ ok: false, error: imageError }, 400);

        let context;
        try {
          context = await loadPersonalizationContextForViewer(parsed.data.clientId, discordId);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Não foi possível abrir esta aplicação.";
          const accessError = /não possui acesso|não possui um bot/i.test(message);
          if (!accessError) {
            await reportCustomizationTechnicalError({
              error,
              stage: "Carregar aplicação",
              requesterId: discordId,
              clientId: parsed.data.clientId,
            });
          }
          return json({ ok: false, error: message }, accessError ? 403 : 500);
        }

        if (!avatar && !context.application.customization?.avatarUrl) {
          return json(
            { ok: false, error: "Envie uma foto de perfil para a primeira solicitação." },
            400,
          );
        }
        if (!banner && !context.application.customization?.bannerUrl) {
          return json({ ok: false, error: "Envie um banner para a primeira solicitação." }, 400);
        }

        let notification;
        try {
          notification = await sendCustomizationRequest({
            application: context.application,
            customization: parsed.data,
            requesterId: discordId,
            requesterName: context.requesterName,
            fallbackToken: context.token,
            avatar,
            banner,
          });
        } catch (error) {
          await reportCustomizationTechnicalError({
            error,
            stage: "Enviar solicitação ao Discord",
            requesterId: discordId,
            clientId: context.application.clientId,
            guildId: context.application.guildId,
            fallbackToken: context.token,
          });
          return json(
            {
              ok: false,
              error:
                "Não foi possível enviar a solicitação ao Discord. A equipe técnica foi avisada.",
            },
            502,
          );
        }

        try {
          const customization = await saveBotCustomizationForViewer(
            {
              ...parsed.data,
              avatarUrl: notification.avatarUrl ?? context.application.customization?.avatarUrl,
              bannerUrl: notification.bannerUrl ?? context.application.customization?.bannerUrl,
            },
            discordId,
          );
          return json({ ok: true, customization, notificationId: notification.messageId }, 201);
        } catch (error) {
          await reportCustomizationTechnicalError({
            error,
            stage: "Salvar personalização no MongoDB",
            requesterId: discordId,
            clientId: context.application.clientId,
            guildId: context.application.guildId,
            fallbackToken: context.token,
          });
          return json(
            {
              ok: false,
              error: "A solicitação chegou ao Discord, mas não foi salva. A equipe foi avisada.",
            },
            500,
          );
        }
      },
    },
  },
});
