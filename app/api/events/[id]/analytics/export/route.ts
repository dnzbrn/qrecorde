import { json, requireSession, runtimeEnv } from "../../../../../../lib/server";
import { analyticsCSV, reportRange, localDaySQL, localHourSQL, metricSQL, type HourlyMetrics } from "../../../../../../lib/analytics";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const event = await runtimeEnv.DB.prepare("SELECT name FROM events WHERE id=? AND owner_id=?").bind(id, session.user.id).first<{ name: string }>();
    if (!event) return json({ error: "Página não encontrada." }, 404);
    const url = new URL(request.url);
    let range;
    try { range = reportRange(url.searchParams.get("from"), url.searchParams.get("to")); }
    catch (error) { return json({ error: (error as Error).message }, 400); }
    const rows = await runtimeEnv.DB.prepare(`SELECT ${localDaySQL} day,${localHourSQL} hour,source,${metricSQL} FROM activity_events WHERE event_id=? AND created_at>=? AND created_at<? GROUP BY day,hour,source ORDER BY day,hour,source`).bind(id, range.start, range.end).all<HourlyMetrics & { source: string }>();
    return new Response(analyticsCSV(event.name, rows.results), { headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="analytics-${url.searchParams.get("from")}-${url.searchParams.get("to")}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    return error instanceof Response ? error : json({ error: "Não foi possível exportar o relatório." }, 500);
  }
}
