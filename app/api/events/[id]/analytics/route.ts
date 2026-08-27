import { json, requireSession, runtimeEnv } from "../../../../../lib/server";
import { analyticsDay, dayStart, DAY_MS, localDaySQL, localHourSQL, metricSQL } from "../../../../../lib/analytics";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const event = await runtimeEnv.DB.prepare("SELECT id FROM events WHERE id=? AND owner_id=?").bind(id, session.user.id).first();
    if (!event) return json({ error: "Página não encontrada." }, 404);
    const today = analyticsDay();
    const since = dayStart(today) - 13 * DAY_MS;
    const [totals, daily, hourly, recent] = await Promise.all([
      runtimeEnv.DB.prepare("SELECT COALESCE(SUM(views),0) views,COALESCE(SUM(opens),0) opens,COALESCE(SUM(downloads),0) downloads,COALESCE(SUM(stories),0) stories FROM analytics_daily WHERE event_id=?").bind(id).first(),
      runtimeEnv.DB.prepare(`SELECT ${localDaySQL} day,${metricSQL} FROM activity_events WHERE event_id=? AND created_at>=? AND created_at<? GROUP BY day ORDER BY day`).bind(id, since, dayStart(today) + DAY_MS).all(),
      runtimeEnv.DB.prepare(`SELECT ${localDaySQL} day,${localHourSQL} hour,${metricSQL} FROM activity_events WHERE event_id=? AND created_at>=? AND created_at<? GROUP BY day,hour ORDER BY day,hour`).bind(id, since, dayStart(today) + DAY_MS).all(),
      runtimeEnv.DB.prepare("SELECT id,action,source,created_at as createdAt FROM activity_events WHERE event_id=? ORDER BY created_at DESC LIMIT 12").bind(id).all(),
    ]);
    return Response.json({ totals, daily: daily.results, hourly: hourly.results, recent: recent.results, today }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return error instanceof Response ? error : json({ error: "Não foi possível carregar as métricas." }, 500);
  }
}
