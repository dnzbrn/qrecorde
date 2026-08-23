import { env } from "cloudflare:workers";
import { auth } from "./auth";

export const runtimeEnv = env as unknown as { DB: D1Database; MEDIA: R2Bucket };
export async function requireSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Response("Não autorizado", { status: 401 });
  return session;
}
export const json = (data: unknown, status = 200) => Response.json(data, { status });
export function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "presente";
}
