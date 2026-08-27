import { json } from "../../../../lib/server";
import { getPublicEvent } from "../../../../lib/public-event";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  return event ? json(event) : json({ error: "Presente não encontrado." }, 404);
}
