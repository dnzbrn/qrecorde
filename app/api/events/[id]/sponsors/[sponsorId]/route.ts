import { json, requireSession, runtimeEnv } from "../../../../../../lib/server";

async function ownedSponsor(request: Request, eventId: string, sponsorId: string) {
  const session = await requireSession(request);
  const sponsor = await runtimeEnv.DB.prepare("SELECT sponsors.id FROM sponsors JOIN events ON events.id=sponsors.event_id WHERE sponsors.id=? AND sponsors.event_id=? AND events.owner_id=?").bind(sponsorId, eventId, session.user.id).first();
  return { session, sponsor };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; sponsorId: string }> }) {
  try {
    const { id, sponsorId } = await params; const { sponsor } = await ownedSponsor(request, id, sponsorId);
    if (!sponsor) return json({ error: "Patrocinador não encontrado." }, 404);
    const body = await request.json() as { name?: string; tier?: string; tagline?: string };
    const tier = ["master", "sponsor", "supporter"].includes(body.tier || "") ? body.tier : "sponsor";
    await runtimeEnv.DB.prepare("UPDATE sponsors SET name=?,tier=?,tagline=?,updated_at=? WHERE id=?").bind(body.name?.trim() || "Patrocinador", tier, body.tagline?.trim() || "", Date.now(), sponsorId).run();
    return json({ ok: true });
  } catch (error) { return error instanceof Response ? error : json({ error: "Não foi possível salvar." }, 500); }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; sponsorId: string }> }) {
  try {
    const { id, sponsorId } = await params; const { session, sponsor } = await ownedSponsor(request, id, sponsorId);
    if (!sponsor) return json({ error: "Patrocinador não encontrado." }, 404);
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File) || !file.type.startsWith("image/")) return json({ error: "Envie uma imagem válida." }, 400);
    if (file.size > 5 * 1024 * 1024) return json({ error: "A imagem deve ter até 5 MB." }, 400);
    const ext = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
    const key = `organizers/${session.user.id}/events/${id}/sponsors/${sponsorId}-${crypto.randomUUID()}.${ext}`;
    await runtimeEnv.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { ownerId: session.user.id, eventId: id } });
    await runtimeEnv.DB.prepare("UPDATE sponsors SET logo_key=?,updated_at=? WHERE id=?").bind(key, Date.now(), sponsorId).run();
    return json({ key, url: `/media/${key}` }, 201);
  } catch (error) { return error instanceof Response ? error : json({ error: "Falha no upload." }, 500); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; sponsorId: string }> }) {
  try { const { id, sponsorId } = await params; const { sponsor } = await ownedSponsor(request, id, sponsorId); if (!sponsor) return json({ error: "Patrocinador não encontrado." }, 404); await runtimeEnv.DB.prepare("DELETE FROM sponsors WHERE id=?").bind(sponsorId).run(); return json({ ok: true }); }
  catch (error) { return error instanceof Response ? error : json({ error: "Não foi possível excluir." }, 500); }
}
