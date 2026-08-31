import { json, requireSession, runtimeEnv } from "../../../../../lib/server";
import { analyticsDay, dayStart, DAY_MS, localDaySQL, localHourSQL, metricSQL, reportRange } from "../../../../../lib/analytics";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const event = await runtimeEnv.DB.prepare("SELECT id FROM events WHERE id=? AND owner_id=?").bind(id, session.user.id).first();
    if (!event) return json({ error: "Página não encontrada." }, 404);
    const today = analyticsDay();
    const url = new URL(request.url);
    const from = url.searchParams.get("from") || analyticsDay(dayStart(today) - 13 * DAY_MS);
    const to = url.searchParams.get("to") || today;
    let range;
    try { range = reportRange(from, to); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Período inválido." }, 400); }
    const [totals, daily, hourly, recent, qr] = await Promise.all([
      runtimeEnv.DB.prepare("SELECT COALESCE(SUM(CASE WHEN action='view' THEN 1 ELSE 0 END),0) views,COALESCE(SUM(CASE WHEN action='open' THEN 1 ELSE 0 END),0) opens,COALESCE(SUM(CASE WHEN action='download' THEN 1 ELSE 0 END),0) downloads,COALESCE(SUM(CASE WHEN action='story' THEN 1 ELSE 0 END),0) stories FROM activity_events WHERE event_id=? AND created_at>=? AND created_at<?").bind(id, range.start, range.end).first(),
      runtimeEnv.DB.prepare(`SELECT ${localDaySQL} day,${metricSQL} FROM activity_events WHERE event_id=? AND created_at>=? AND created_at<? GROUP BY day ORDER BY day`).bind(id, range.start, range.end).all(),
      runtimeEnv.DB.prepare(`SELECT ${localDaySQL} day,${localHourSQL} hour,${metricSQL} FROM activity_events WHERE event_id=? AND created_at>=? AND created_at<? GROUP BY day,hour ORDER BY day,hour`).bind(id, range.start, range.end).all(),
      runtimeEnv.DB.prepare("SELECT id,action,source,created_at as createdAt FROM activity_events WHERE event_id=? AND created_at>=? AND created_at<? ORDER BY created_at DESC LIMIT 12").bind(id, range.start, range.end).all(),
      runtimeEnv.DB.prepare("SELECT COUNT(*) scans FROM activity_events WHERE event_id=? AND action='view' AND source LIKE 'qr_%' AND created_at>=? AND created_at<?").bind(id, range.start, range.end).first(),
    ]);
    return Response.json({ totals, daily: daily.results, hourly: hourly.results, recent: recent.results, qrScans: Number(qr?.scans || 0), today, from, to }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return error instanceof Response ? error : json({ error: "Não foi possível carregar as métricas." }, 500);
  }
}
