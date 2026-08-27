"use client";

import { useState } from "react";
import { analyticsDay, DAY_MS, dayStart, emptyMetrics, reportRange, type DailyMetrics, type HourlyMetrics } from "../lib/analytics";

const formatDay = (day: string) => day.split('-').reverse().join('/');
const number = (value: number) => value.toLocaleString('pt-BR');
export function AnalyticsPanel({ eventId, daily, hourly, today, loaded }: { eventId: string; daily: DailyMetrics[]; hourly: HourlyMetrics[]; today: string; loaded: boolean }) {
  const [selected, setSelected] = useState(today);
  const [from, setFrom] = useState(analyticsDay(dayStart(today) - 13 * DAY_MS));
  const [to, setTo] = useState(today);
  const [exporting, setExporting] = useState(false);
  const [note, setNote] = useState('');
  const days = Array.from({ length: 14 }, (_, index) => {
    const day = analyticsDay(dayStart(today) - (13 - index) * DAY_MS);
    return daily.find(item => item.day === day) || { day, ...emptyMetrics() };
  });
  const current = days.find(item => item.day === selected) || days[13];
  const max = Math.max(1, ...days.map(item => item.views));
  const hours = Array.from({ length: 24 }, (_, index) => {
    const hour = String(index).padStart(2, '0');
    return hourly.find(item => item.day === current.day && item.hour === hour) || { day: current.day, hour, ...emptyMetrics() };
  });
  const exportReport = async () => {
    setNote('');
    try {
      reportRange(from, to);
      setExporting(true);
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/analytics/export?${new URLSearchParams({ from, to })}`);
      if (!response.ok) { const result = await response.json().catch(() => null); throw new Error(result?.error || 'Não foi possível exportar. Tente novamente.'); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-raw-${from}-${to}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNote('Dados brutos exportados: uma linha por interação, sem agrupamento.');
    } catch (error) { setNote(error instanceof Error ? error.message : 'Não foi possível exportar.'); }
    finally { setExporting(false); }
  };
  return <section className="panel chart-panel analytics-panel">
    <div className="panel-head"><div><h2>Alcance da página</h2><p>Últimos 14 dias · Horário de Brasília (UTC−03:00)</p></div></div>
    {!loaded ? <p role="status">Métricas indisponíveis ou carregando. Recarregue a página se persistir.</p> : <>
      <div className="chart-wrap" aria-label="Visualizações por dia">
        <div className="chart-grid" aria-hidden="true"><span>{number(max)}</span><span>{number(Math.round(max * .66))}</span><span>{number(Math.round(max * .33))}</span><span>0</span></div>
        <div className="bars analytics-bars">{days.map(item => <button type="button" key={item.day} onClick={() => setSelected(item.day)} aria-pressed={item.day === current.day} aria-label={`${formatDay(item.day)}: ${number(item.views)} acessos. Ver detalhes.`} title={`${formatDay(item.day)}: ${number(item.views)} acessos`}><span style={{ height: `${Math.max(item.views ? 5 : 1, item.views / max * 100)}%` }} /></button>)}</div>
        <div className="chart-days"><span>{formatDay(days[0].day).slice(0,5)}</span><span>{formatDay(days[4].day).slice(0,5)}</span><span>{formatDay(days[9].day).slice(0,5)}</span><span>Hoje</span></div>
      </div>
      <p className="analytics-hint">Clique ou toque em uma barra para ver os números do dia.</p>
      <div className="analytics-day" aria-live="polite"><h3>{formatDay(current.day)}</h3><dl>{[['Acessos', current.views], ['Presente aberto', current.opens], ['Imagem baixada', current.downloads], ['Story baixado', current.stories]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{number(Number(value))}</dd></div>)}</dl></div>
      <details className="analytics-hours"><summary>Ver os números por horário de {formatDay(current.day)}</summary><div className="analytics-table-scroll"><table><caption>Interações por hora · Brasília</caption><thead><tr><th scope="col">Hora</th><th scope="col">Acessos</th><th scope="col">Aberturas</th><th scope="col">Imagem</th><th scope="col">Story</th></tr></thead><tbody>{hours.map(item => <tr key={item.hour}><th scope="row">{item.hour}:00</th><td>{number(item.views)}</td><td>{number(item.opens)}</td><td>{number(item.downloads)}</td><td>{number(item.stories)}</td></tr>)}</tbody></table></div></details>
    </>}
    <div className="analytics-export"><h3>Exportar relatório</h3><p>Dados brutos: uma linha por acesso, abertura, download da imagem ou do Story, com dia, horário completo e origem registrada. Até 366 dias por exportação.</p><div className="analytics-filters"><label>De<input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label><label>Até<input type="date" value={to} onChange={event => setTo(event.target.value)} /></label><button className="primary-btn" type="button" disabled={exporting || !eventId} onClick={exportReport}>{exporting ? 'Exportando…' : 'Exportar dados brutos CSV ↓'}</button></div><p role="status">{note}</p></div>
    <p className="analytics-hint">Contamos interações, não visitantes únicos. “Abertura” é a janela do presente; imagem e Story são downloads. O relatório usa os registros detalhados disponíveis.</p>
  </section>;
}
