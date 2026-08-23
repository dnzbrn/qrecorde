import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";

const runtime = env as unknown as { DB: D1Database; BETTER_AUTH_SECRET?: string; BETTER_AUTH_URL?: string };
const cloudflareProductionURL = "https://qrecorde.brunonevesdiniz.workers.dev";
const authBaseURL = runtime.BETTER_AUTH_URL || cloudflareProductionURL;

export const auth = betterAuth({
  database: runtime.DB,
  secret: runtime.BETTER_AUTH_SECRET || "local-development-secret-change-before-production-32chars",
  baseURL: authBaseURL,
  trustedOrigins: Array.from(new Set([cloudflareProductionURL, authBaseURL])),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: { deleteUser: { enabled: true } },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
});
