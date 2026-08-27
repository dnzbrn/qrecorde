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
export function analyticsCSV(eventName: string, rows: Array<HourlyMetrics & { source: string }>) {
  const cell = (value: string | number) => {
    const text = String(value);
    // Quoting alone does not prevent spreadsheet formula execution.
    return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
  };
  const header = ["Página / evento", "Data", "Hora (Brasília UTC-03:00)", "Origem", "Acessos à página", "Aberturas do presente", "Downloads da imagem do presente", "Downloads da figurinha do Story"];
  return '\uFEFF' + [header, ...rows.map(row => [eventName, row.day, `${row.hour}:00`, row.source, row.views, row.opens, row.downloads, row.stories])].map(row => row.map(cell).join(';')).join('\r\n') + '\r\n';
}
