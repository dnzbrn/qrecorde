import { json, requireSession, runtimeEnv, slugify } from "../../../lib/server";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { const session = await requireSession(request); const result = await runtimeEnv.DB.prepare("SELECT id, slug, status, name, page_title as pageTitle, updated_at as updatedAt FROM events WHERE owner_id = ? ORDER BY updated_at DESC").bind(session.user.id).all(); return json(result.results); }
  catch (error) { return error instanceof Response ? error : json({ error: "Não foi possível carregar os presentes." }, 500); }
}
export async function POST(request: Request) {
  try {
    const session = await requireSession(request); const body = await request.json() as { name?: string }; const name = body.name?.trim() || "Novo presente"; const id = crypto.randomUUID(); let slug = slugify(name); const exists = await runtimeEnv.DB.prepare("SELECT id FROM events WHERE slug = ?").bind(slug).first(); if (exists) slug += `-${id.slice(0, 6)}`; const now = Date.now();
    await runtimeEnv.DB.prepare("INSERT INTO events (id, owner_id, slug, status, name, eyebrow, page_title, page_message, cta_text, gift_title, gift_message, accent_color, created_at, updated_at) VALUES (?, ?, ?, 'draft', ?, '', ?, '', 'Abrir meu presente', 'Um presente para você', '', '#6b29d9', ?, ?)").bind(id, session.user.id, slug, name, name, now, now).run();
    await runtimeEnv.DB.prepare("INSERT INTO qr_codes (id, event_id, name, campaign, scans, created_at) VALUES (?, ?, 'QR principal', 'principal', 0, ?)").bind(crypto.randomUUID(), id, now).run();
    return json({ id, slug, status: "draft", name }, 201);
  } catch (error) { return error instanceof Response ? error : json({ error: "Não foi possível criar o presente." }, 500); }
}
