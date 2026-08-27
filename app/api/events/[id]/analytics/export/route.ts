import { json, requireSession, runtimeEnv } from "../../../../../../lib/server";
import { rawActivityCSV, rawCSVHeader, rawActivitySQL, reportRange, type RawActivity } from "../../../../../../lib/analytics";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const event = await runtimeEnv.DB.prepare("SELECT id,name,slug FROM events WHERE id=? AND owner_id=?").bind(id, session.user.id).first<{id:string;name:string;slug:string}>();
    if (!event) return json({ error: "Página não encontrada." }, 404);
    const url = new URL(request.url);
    let range;
    try { range = reportRange(url.searchParams.get("from"), url.searchParams.get("to")); }
    catch (error) { return json({ error: (error as Error).message }, 400); }
    // Keep memory bounded without truncating the export; use a stable timestamp/id cursor.
    const end = Math.min(range.end, Date.now() + 1);
    const readBatch = (time: number, rowId: string) => runtimeEnv.DB.prepare(rawActivitySQL).bind(id, range.start, end, time, time, rowId).all<RawActivity>();
    let batch = (await readBatch(range.start - 1, '')).results;
    const encoder = new TextEncoder();
    let headerSent = false;
    let finished = false;
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (finished) return;
        try {
          if (!headerSent) { controller.enqueue(encoder.encode(rawCSVHeader)); headerSent = true; return; }
          if (request.signal.aborted) { finished = true; controller.close(); return; }
          const current = batch;
          if (!current.length) { finished = true; controller.close(); return; }
          controller.enqueue(encoder.encode(rawActivityCSV(event, current)));
          if (current.length < 1000) { finished = true; controller.close(); return; }
          const last = current[current.length - 1];
          batch = (await readBatch(Number(last.createdAt), last.id)).results;
        } catch (error) { finished = true; controller.error(error); }
      },
      cancel() { finished = true; },
    });
    return new Response(stream, { headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="analytics-raw-${url.searchParams.get("from")}-${url.searchParams.get("to")}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    return error instanceof Response ? error : json({ error: "Não foi possível exportar o relatório." }, 500);
  }
}
