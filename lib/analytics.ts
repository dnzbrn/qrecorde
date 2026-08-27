export const DAY_MS = 86400000;
export const analyticsDay = (time = Date.now()) => new Date(time - 3 * 3600000).toISOString().slice(0, 10);
export const dayStart = (day: string) => Date.parse(`${day}T00:00:00-03:00`);
export type Metrics = { views: number; opens: number; downloads: number; stories: number };
export type DailyMetrics = Metrics & { day: string };
export type HourlyMetrics = DailyMetrics & { hour: string };
export const emptyMetrics = (): Metrics => ({ views: 0, opens: 0, downloads: 0, stories: 0 });
export function reportRange(from: string | null, to: string | null) {
  const valid = (day: string | null): day is string => !!day && /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(dayStart(day)) && analyticsDay(dayStart(day)) === day;
  if (!valid(from) || !valid(to)) throw new Error("Informe datas válidas.");
  const start = dayStart(from), end = dayStart(to) + DAY_MS;
  if (end <= start || end - start > 366 * DAY_MS) throw new Error("Selecione um período de até 366 dias, com início anterior ou igual ao fim.");
  return { start, end };
}
export const metricSQL = "SUM(CASE WHEN action='view' THEN 1 ELSE 0 END) views, SUM(CASE WHEN action='open' THEN 1 ELSE 0 END) opens, SUM(CASE WHEN action='download' THEN 1 ELSE 0 END) downloads, SUM(CASE WHEN action='story' THEN 1 ELSE 0 END) stories";
export const localDaySQL = "strftime('%Y-%m-%d',created_at/1000,'unixepoch','-3 hours')";
export const localHourSQL = "strftime('%H',created_at/1000,'unixepoch','-3 hours')";
export type RawActivity = { id: string; action: string; source: string; createdAt: number };
export const rawActivitySQL = "SELECT id,action,source,created_at AS createdAt FROM activity_events WHERE event_id=? AND created_at>=? AND created_at<? AND (created_at>? OR (created_at=? AND id>?)) ORDER BY created_at,id LIMIT 1000";
const csvCell = (value: string | number) => {
  const text = String(value);
  return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
};
export const rawCSVHeader = '\uFEFF' + ['ID do registro','ID da página','Nome atual da página','Slug atual da página','Dia (Brasília)','Horário (Brasília UTC-03:00)','Data/hora UTC','Timestamp Unix (ms)','Origem / campanha registrada','Ação registrada','Descrição','Conteúdo'].map(csvCell).join(';') + '\r\n';
export function rawActivityCSV(event: {id:string;name:string;slug:string}, rows: RawActivity[]) {
  const actions: Record<string, [string, string]> = {
    view: ['Acesso à página', 'Página'],
    open: ['Abertura do presente', 'Janela do presente'],
    download: ['Download da imagem', 'Imagem'],
    story: ['Download da figurinha', 'Story'],
  };
  return rows.map(row => {
    const utc = new Date(Number(row.createdAt)).toISOString();
    const local = new Date(Number(row.createdAt) - 3 * 3600000).toISOString();
    const [description, content] = actions[row.action] || [row.action, 'Não informado'];
    return [row.id,event.id,event.name,event.slug,local.slice(0,10),local.slice(11,23),utc,row.createdAt,row.source,row.action,description,content].map(csvCell).join(';') + '\r\n';
  }).join('');
}
