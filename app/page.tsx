"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type View = "dashboard" | "page" | "qrcodes" | "sponsors";

const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="icon" aria-hidden="true">{children}</span>
);

const stats = [
  { label: "Visualizações", value: "12.486", change: "+18,4%", icon: "↗" },
  { label: "Presentes enviados", value: "847", change: "+12,1%", icon: "♡" },
  { label: "Conversão", value: "6,8%", change: "+0,9%", icon: "◎" },
  { label: "Valor arrecadado", value: "R$ 38.920", change: "+23,7%", icon: "◇" },
];

const nav: { id: View; label: string; icon: string }[] = [
  { id: "dashboard", label: "Visão geral", icon: "⌂" },
  { id: "page", label: "Página pública", icon: "◫" },
  { id: "qrcodes", label: "QR Codes", icon: "⌗" },
  { id: "sponsors", label: "Patrocinadores", icon: "✦" },
];

function MiniChart() {
  const bars = [31, 38, 34, 49, 52, 47, 61, 67, 63, 78, 83, 92, 86, 99];
  return (
    <div className="chart-wrap" aria-label="Gráfico de visualizações dos últimos 14 dias">
      <div className="chart-grid"><span>1.500</span><span>1.000</span><span>500</span><span>0</span></div>
      <div className="bars">
        {bars.map((h, i) => <span key={i} className={i === bars.length - 2 ? "active" : ""} style={{ height: `${h}%` }} />)}
      </div>
      <div className="chart-days"><span>01 ago</span><span>05 ago</span><span>09 ago</span><span>14 ago</span></div>
    </div>
  );
}

function QrCard({ compact = false }: { compact?: boolean }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL("https://mimo-qr.com/e/padre-eustaquio?utm_source=qr_principal", {
      width: compact ? 180 : 300, margin: 1, color: { dark: "#18151c", light: "#fffdf8" }, errorCorrectionLevel: "H"
    }).then(setSrc);
  }, [compact]);
  return src ? <img className="qr-image" src={src} alt="QR Code para a página da Festa do Beato Padre Eustáquio" /> : <div className="qr-loading" />;
}

function PublicPage() {
  return (
    <div className="public-shell">
      <header className="public-nav">
        <div className="public-brand"><span className="brand-gem">◆</span><span>Mimo</span><b>QR</b></div>
        <button className="ghost-btn" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}>Conheça os apoiadores</button>
      </header>
      <main className="public-hero">
        <div className="halo one" /><div className="halo two" />
        <div className="saint-medallion" aria-hidden="true"><span>✦</span><small>BPE</small></div>
        <div className="eyebrow">23 a 30 de agosto • Belo Horizonte</div>
        <h1>Festa do Beato<br/><em>Padre Eustáquio</em></h1>
        <p>Uma celebração de fé, encontro e generosidade. Deixe o seu gesto de carinho e ajude esta festa a continuar transformando vidas.</p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={() => alert("Fluxo de presente iniciado — no produto final, aqui entra o Pix ou checkout.")}>Enviar um presente <span>→</span></button>
          <span className="secure-note">● Pagamento seguro</span>
        </div>
        <div className="public-proof"><b>847</b> pessoas já deixaram seu presente <span>♡</span></div>
      </main>
      <section className="impact-section">
        <div><div className="eyebrow">Seu gesto faz a diferença</div><h2>Todo presente<br/>vira <em>cuidado.</em></h2></div>
        <div className="impact-list">
          <article><b>01</b><span><strong>Obras sociais</strong> Apoio a famílias e iniciativas da comunidade.</span></article>
          <article><b>02</b><span><strong>Preservação da memória</strong> Cuidado com o Santuário e seu patrimônio.</span></article>
          <article><b>03</b><span><strong>Uma festa ainda mais bonita</strong> Estrutura e acolhimento para todos.</span></article>
        </div>
      </section>
      <section className="sponsor-strip"><span>Realização</span><b>Santuário<br/>Padre Eustáquio</b><i /><span>Apoio</span><b>Vallourec</b><b>Unimed</b><b>Supermercados BH</b></section>
      <footer className="public-footer"><div className="public-brand"><span className="brand-gem">◆</span><span>Mimo</span><b>QR</b></div><p>Presentes digitais. Memórias reais.</p><span>© 2026</span></footer>
    </div>
  );
}

function Dashboard() {
  return <>
    <div className="welcome"><div><span className="kicker">SEXTA-FEIRA, 14 DE AGOSTO</span><h1>Boa tarde, Mariana <span>✦</span></h1><p>A sua celebração está alcançando cada vez mais pessoas.</p></div><button className="period-btn">Últimos 14 dias <span>⌄</span></button></div>
    <div className="stats-grid">{stats.map((s) => <article className="stat-card" key={s.label}><div className="stat-top"><Icon>{s.icon}</Icon><span className="up">↗ {s.change}</span></div><strong>{s.value}</strong><p>{s.label}</p></article>)}</div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-head"><div><h2>Alcance da página</h2><p>Visualizações nos últimos 14 dias</p></div><span className="legend"><i /> Visualizações</span></div><MiniChart /></section>
      <section className="panel qr-panel"><div className="panel-head"><div><h2>QR Code principal</h2><p>Pronto para compartilhar</p></div><button className="more" aria-label="Mais opções">•••</button></div><div className="qr-content"><div className="qr-box"><QrCard compact /></div><div className="qr-meta"><span className="live"><i/> Ativo</span><b>7.294</b><small>leituras totais</small><button onClick={() => navigator.clipboard?.writeText("https://mimo-qr.com/e/padre-eustaquio")}>Copiar link</button></div></div></section>
      <section className="panel activity-panel"><div className="panel-head"><div><h2>Atividade recente</h2><p>Acontecendo agora</p></div><button className="text-btn">Ver tudo →</button></div><div className="activity-list">
        <div><span className="avatar purple">AM</span><p><b>Alessandra M.</b> enviou um presente<small>Há 2 minutos</small></p><strong>R$ 50</strong></div>
        <div><span className="avatar gold">QR</span><p><b>QR Code “Entrada principal”</b> foi lido<small>Há 7 minutos</small></p><strong>+1</strong></div>
        <div><span className="avatar blue">RC</span><p><b>Ricardo C.</b> enviou um presente<small>Há 12 minutos</small></p><strong>R$ 100</strong></div>
      </div></section>
    </div>
  </>;
}

function QrDashboard() {
  return <div className="feature-layout"><div className="feature-copy"><span className="kicker">QR CODE RASTREÁVEL</span><h1>Um código.<br/>Muitos encontros.</h1><p>Use este QR em cartazes, mesas, totens e redes sociais. Cada leitura aparece no painel com origem, horário e conversão.</p><div className="feature-stats"><div><b>7.294</b><span>leituras</span></div><div><b>6,8%</b><span>conversão</span></div></div><button className="primary-btn" onClick={() => window.print()}>Baixar para impressão <span>↓</span></button></div><div className="large-qr-card"><div className="qr-label"><span className="brand-gem">◆</span><b>Festa do Beato<br/>Padre Eustáquio</b></div><QrCard/><h3>Aponte a câmera e presenteie</h3><p>mimo-qr.com/e/padre-eustaquio</p><span className="track-tag">● Rastreamento ativo</span></div></div>;
}

function Sponsors() {
  const items = [{n:"Vallourec",tier:"Patrocinador ouro",views:"4.812"},{n:"Unimed BH",tier:"Patrocinador prata",views:"3.276"},{n:"Supermercados BH",tier:"Apoiador",views:"2.940"}];
  return <><div className="welcome compact"><div><span className="kicker">PARCERIAS</span><h1>Patrocinadores</h1><p>Valorize quem torna esta celebração possível.</p></div><button className="primary-btn">Adicionar patrocinador <span>+</span></button></div><div className="sponsor-grid">{items.map((x,i)=><article key={x.n}><div className={`sponsor-mark s${i}`}>{x.n.split(" ")[0]}</div><span>{x.tier}</span><h2>{x.n}</h2><div><p>Exibições da marca</p><b>{x.views}</b></div><button>Editar detalhes →</button></article>)}</div><div className="panel sponsor-note"><div className="icon">✦</div><div><h2>Marcas em boa companhia</h2><p>Os patrocinadores aparecem com elegância na página pública, sem competir com a mensagem principal do evento.</p></div><span>85% de visibilidade média</span></div></>;
}

function PageEditor() {
  return <div className="editor-layout"><section className="editor-controls"><span className="kicker">PERSONALIZAÇÃO</span><h1>Sua página,<br/>do seu jeito.</h1><p>Conte a história do evento com uma experiência bonita, clara e pronta para receber presentes.</p><label>Título do evento<input defaultValue="Festa do Beato Padre Eustáquio" /></label><label>Mensagem principal<textarea defaultValue="Uma celebração de fé, encontro e generosidade." /></label><label>Cor de destaque<div className="colors"><button className="selected" aria-label="Violeta"/><button aria-label="Dourado"/><button aria-label="Azul"/><button aria-label="Verde"/></div></label><button className="primary-btn">Salvar alterações <span>✓</span></button></section><div className="phone-preview"><div className="phone-bar"><i/><i/><i/></div><div className="phone-body"><span className="brand-gem">◆</span><small>23 A 30 DE AGOSTO</small><h2>Festa do Beato<br/><em>Padre Eustáquio</em></h2><p>Uma celebração de fé, encontro e generosidade.</p><button>Enviar um presente →</button><div className="phone-count">♡ 847 pessoas já participaram</div></div></div></div>;
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [publicMode, setPublicMode] = useState(false);
  const title = useMemo(() => nav.find(n => n.id === view)?.label, [view]);
  if (publicMode) return <div><button className="back-dashboard" onClick={() => setPublicMode(false)}>← Voltar ao painel</button><PublicPage/></div>;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-gem">◆</span><span>Mimo</span><b>QR</b></div>
      <div className="event-switch"><span>FE</span><div><b>Festa Pe. Eustáquio</b><small>Evento ativo</small></div><i>⌄</i></div>
      <nav aria-label="Navegação principal">{nav.map(n=><button key={n.id} className={view===n.id?"active":""} onClick={()=>setView(n.id)}><Icon>{n.icon}</Icon>{n.label}</button>)}</nav>
      <div className="sidebar-bottom"><button><Icon>⚙</Icon>Configurações</button><div className="help-card"><span>?</span><b>Precisa de ajuda?</b><p>Fale com nosso time.</p><button>Conversar agora</button></div><div className="user-card"><span>MN</span><div><b>Mariana Nunes</b><small>Administradora</small></div><i>⌄</i></div></div>
    </aside>
    <main className="main-content"><header className="topbar"><div className="mobile-brand brand"><span className="brand-gem">◆</span><span>Mimo</span><b>QR</b></div><span className="crumb">Evento <b>/</b> {title}</span><div className="top-actions"><button className="icon-btn" aria-label="Notificações">♢<i/></button><button className="preview-btn" onClick={()=>setPublicMode(true)}>Visualizar página <span>↗</span></button></div></header><div className="content-wrap">{view==="dashboard"&&<Dashboard/>}{view==="page"&&<PageEditor/>}{view==="qrcodes"&&<QrDashboard/>}{view==="sponsors"&&<Sponsors/>}</div></main>
  </div>;
}
