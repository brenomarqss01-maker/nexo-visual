import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { recordOrganizationEvent, StatisticsAuthorizationError } from "@/services/database/mongo";

const discordIdentitySchema = z.object({
  discordId: z.string().regex(/^\d{15,22}$/),
  name: z.string().trim().min(1).max(100),
});

const organizationEventSchema = z
  .object({
    eventId: z.string().trim().min(1).max(128),
    guildId: z.string().regex(/^\d{15,22}$/),
    type: z.enum(["recruitment", "sale"]),
    actor: discordIdentitySchema,
    recruited: discordIdentitySchema.optional(),
    product: z
      .object({
        id: z.string().trim().min(1).max(100),
        name: z.string().trim().min(1).max(100),
      })
      .optional(),
    quantity: z.number().int().min(1).max(1_000).default(1),
    revenue: z.number().finite().min(0).max(1_000_000_000).default(0),
    occurredAt: z.string().datetime({ offset: true }).optional(),
  })
  .superRefine((event, context) => {
    if (event.type === "sale" && !event.product) {
      context.addIssue({
        code: "custom",
        path: ["product"],
        message: "Produto é obrigatório para eventos de venda.",
      });
    }
  });

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/statistics/events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization") ?? "";
        if (!authorization.startsWith("Bot ")) {
          return json({ ok: false, error: "Autenticação do bot ausente." }, 401);
        }

        const contentLength = Number(request.headers.get("content-length") ?? "0");
        if (contentLength > 64 * 1024) {
          return json({ ok: false, error: "Corpo da requisição muito grande." }, 413);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "JSON inválido." }, 400);
        }
        const parsed = organizationEventSchema.safeParse(body);
        if (!parsed.success) {
          return json(
            { ok: false, error: "Evento inválido.", fields: parsed.error.flatten().fieldErrors },
            400,
          );
        }

        try {
          const result = await recordOrganizationEvent(parsed.data, authorization.slice(4));
          return json({ ok: true, ...result }, result.duplicate ? 200 : 201);
        } catch (error) {
          if (error instanceof StatisticsAuthorizationError) {
            return json({ ok: false, error: error.message }, 403);
          }
          console.error("Não foi possível registrar o evento de estatísticas.", error);
          return json({ ok: false, error: "Não foi possível registrar o evento." }, 500);
        }
      },
    },
  },
});
