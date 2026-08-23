"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { authClient } from "../lib/auth-client";

type View = "dashboard" | "page" | "qrcodes" | "sponsors";
type MediaAsset = { src: string; type: "image"; name: string; file?: File };

const fileToAsset = (file: File): MediaAsset => ({
  src: URL.createObjectURL(file),
  type: "image",
  name: file.name,
  file,
});

function Media({ asset, className = "" }: { asset: MediaAsset; className?: string }) {
  return <img className={className} src={asset.src} alt={asset.name} />;
}

const loadCanvasImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="icon" aria-hidden="true">{children}</span>
);

const stats = [
  { label: "Visualizações", value: "12.486", change: "+18,4%", icon: "↗" },
  { label: "Presentes entregues", value: "847", change: "+12,1%", icon: "♡" },
  { label: "Taxa de resgate", value: "68,4%", change: "+4,9%", icon: "◎" },
  { label: "Resgates concluídos", value: "579", change: "+23,7%", icon: "◇" },
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

function QrCard({ compact = false, url }: { compact?: boolean; url: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(`${url}?utm_source=qr_principal`, {
      width: compact ? 180 : 300, margin: 1, color: { dark: "#18151c", light: "#fffdf8" }, errorCorrectionLevel: "H"
    }).then(setSrc);
  }, [compact, url]);
  return src ? <img className="qr-image" src={src} alt="QR Code para a página da Festa do Beato Padre Eustáquio" /> : <div className="qr-loading" />;
}

export function PublicPage({ eventMedia, giftMedia, sponsorMedia, sponsorNames = ["Vallourec", "Unimed BH", "Supermercados BH"], giftTitle, giftMessage, pageEyebrow, pageTitle, pageMessage, ctaText, trackingSlug }: { eventMedia: MediaAsset; giftMedia: MediaAsset; sponsorMedia: (MediaAsset | null)[]; sponsorNames?: string[]; giftTitle: string; giftMessage: string; pageEyebrow: string; pageTitle: string; pageMessage: string; ctaText: string; trackingSlug?: string }) {
  const [giftOpen, setGiftOpen] = useState(false);
  const [shareNote, setShareNote] = useState("");
  const track = (action: "view" | "open" | "download" | "story") => { if (trackingSlug) fetch(`/api/public/${trackingSlug}/track`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, source: new URLSearchParams(window.location.search).get("utm_source") || "direct" }) }).catch(() => undefined); };
  useEffect(() => { track("view"); }, [trackingSlug]);
  const drawWrappedText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) => {
    const words = text.split(/\s+/); let line = ""; const lines: string[] = [];
    for (const word of words) { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test; }
    if (line) lines.push(line); lines.slice(0, maxLines).forEach((item, i) => ctx.fillText(item, x, y + i * lineHeight, maxWidth));
  };
  const createSouvenir = async (transparent: boolean) => {
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = 1080; canvas.height = transparent ? 1350 : 1080;
    const ctx = canvas.getContext("2d")!;
    if (!transparent) {
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1080); gradient.addColorStop(0, "#321a45"); gradient.addColorStop(.55, "#771f38"); gradient.addColorStop(1, "#ad7130"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1080);
      const photo = await loadCanvasImage(giftMedia.src);
      ctx.save(); ctx.beginPath(); ctx.arc(540, 350, 275, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(photo, 265, 75, 550, 550); ctx.restore();
      ctx.strokeStyle = "#e2bc66"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(540, 350, 287, 0, Math.PI * 2); ctx.stroke();
    } else {
      const sticker = await loadCanvasImage("/padre-eustaquio-sticker.png");
      ctx.drawImage(sticker, 255, 335, 570, 855);
    }
    ctx.textAlign = "center"; ctx.fillStyle = transparent ? "#ffffff" : "#fff8eb"; ctx.shadowColor = "#26132988"; ctx.shadowBlur = transparent ? 14 : 0;
    ctx.font = "700 38px Arial"; ctx.fillText(pageTitle.toUpperCase(), 540, transparent ? 205 : 745, 940);
    ctx.font = "600 24px Arial"; ctx.fillText("FESTA DAS NAÇÕES • 2026", 540, transparent ? 260 : 795);
    if (!transparent) { ctx.fillStyle = "#fff8eb"; ctx.font = "italic 28px Georgia"; drawWrappedText(ctx, giftMessage, 540, 855, 820, 38, 3); ctx.strokeStyle = "#ffffff35"; ctx.beginPath(); ctx.moveTo(110, 995); ctx.lineTo(970, 995); ctx.stroke(); ctx.fillStyle = "#e9c873"; ctx.font = "700 17px Arial"; ctx.fillText("PATROCINADOR MASTER  •  VALLOUREC", 540, 1025); ctx.fillStyle = "#fff8eb"; ctx.font = "600 15px Arial"; ctx.fillText("UNIMED BH   •   SUPERMERCADOS BH", 540, 1055); }
    else { ctx.shadowBlur = 0; ctx.fillStyle = "#f0c96b"; ctx.font = "700 20px Arial"; ctx.fillText("QRECORDE  ✦  PRESENTE DIGITAL", 540, 1285); }
    return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Falha ao criar imagem")), "image/png"));
  };
  const downloadSouvenir = async () => { const blob = await createSouvenir(false); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "meu-presente-digital.png"; a.click(); URL.revokeObjectURL(url); track("download"); setShareNote("Seu presente foi salvo."); };
  const shareStory = async () => {
    const blob = await createSouvenir(true); const file = new File([blob], "meu-presente-stories.png", { type: "image/png" });
    try {
      if (navigator.clipboard && "ClipboardItem" in window) { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); track("story"); setShareNote("Figurinha copiada! Abra um Story, escolha uma foto e toque em colar — como no Strava."); }
      else if (navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "Meu presente — Festa do Beato Padre Eustáquio" }); setShareNote("Figurinha compartilhada. No Instagram, use-a sobre uma foto do seu Story."); }
      else { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "figurinha-meu-presente-stories.png"; a.click(); URL.revokeObjectURL(url); setShareNote("Figurinha salva. Abra o Instagram e adicione-a sobre uma foto do seu Story."); }
    } catch { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "figurinha-meu-presente-stories.png"; a.click(); URL.revokeObjectURL(url); setShareNote("A cópia não foi permitida pelo navegador; baixamos a figurinha para você adicionar ao Story."); }
  };
  return (
    <div className="public-shell">
      <header className="public-nav">
        <div className="public-brand"><span className="brand-gem">◆</span><span>QR</span><b>ecorde</b></div>
        <button className="ghost-btn" onClick={() => document.getElementById("apoiadores")?.scrollIntoView({ behavior: "smooth" })}>Conheça os apoiadores</button>
      </header>
      <main className="public-hero public-hero-rich">
        <div className="halo one" /><div className="halo two" />
        <div className="public-hero-grid">
          <div className="public-hero-copy">
            <div className="eyebrow">{pageEyebrow}</div>
            <h1>{pageTitle}</h1>
            <p>{pageMessage}</p>
            <div className="hero-actions">
              <button className="primary-btn" onClick={() => { setGiftOpen(true); track("open"); }}>{ctaText} <span>→</span></button>
              <span className="secure-note">● Presente gratuito e exclusivo do evento</span>
            </div>
            <div className="public-proof"><b>847</b> pessoas já receberam este mimo <span>♡</span></div>
          </div>
          <div className="event-visual"><Media asset={eventMedia} className="event-media"/><span>Imagem oficial da celebração</span></div>
        </div>
        <div className="hero-sponsor-dock">
          <div><small>ESTE PRESENTE É OFERECIDO POR</small><b>Parceiros da festa</b></div>
          {sponsorNames.slice(0, 3).map((name, i) => <article className={i === 0 ? "dock-master" : ""} key={`${name}-${i}`}>{i === 0 && <small>MASTER</small>}{sponsorMedia[i] ? <Media asset={sponsorMedia[i]!} className="dock-logo"/> : <strong>{name}</strong>}</article>)}
          <button onClick={() => document.getElementById("apoiadores")?.scrollIntoView({ behavior: "smooth" })}>Ver parceiros ↓</button>
        </div>
      </main>
      <section className="public-sponsors" id="apoiadores">
        <div className="sponsors-heading"><div><div className="eyebrow">UM PRESENTE OFERECIDO POR</div><h2>Quem acredita nesta festa<br/>também presenteia você.</h2></div><p>Este mimo digital chega até você com o apoio de organizações que valorizam a fé, a cultura e a nossa comunidade.</p></div>
        <div className="public-sponsor-grid">
          {sponsorNames.map((name,i)=><article className={i===0?"featured master":""} key={`${name}-full`}><span>{i===0?"Patrocinador master":"Parceiro da celebração"}</span>{sponsorMedia[i]&&<Media asset={sponsorMedia[i]!} className="public-sponsor-logo"/>}<strong>{name}</strong><p>{i===0?"O principal parceiro desta experiência.":"Junto de quem faz a festa acontecer."}</p>{i===0&&<div className="master-badge">✦ MASTER</div>}</article>)}
        </div>
        <div className="sponsor-thanks"><span>✦</span><p><b>Nosso agradecimento</b> O apoio destas marcas torna possível oferecer esta experiência gratuitamente para você.</p></div>
      </section>
      <section className="impact-section">
        <div><div className="eyebrow">FEITO PARA VOCÊ</div><h2>Um presente para<br/>guardar a <em>memória.</em></h2></div>
        <div className="impact-list">
          <article><b>01</b><span><strong>Uma lembrança exclusiva</strong> Conteúdo digital criado especialmente para esta celebração.</span></article>
          <article><b>02</b><span><strong>Receba em instantes</strong> Abra o presente e salve no seu celular, sem cadastro complicado.</span></article>
          <article><b>03</b><span><strong>Leve a festa com você</strong> Uma memória para rever e compartilhar com quem você ama.</span></article>
        </div>
      </section>
      <section className="sponsor-strip"><span>Realização</span><b>Santuário<br/>Padre Eustáquio</b><i /><span>Tecnologia</span><b>QRecorde</b></section>
      <footer className="public-footer"><div className="public-brand"><span className="brand-gem">◆</span><span>QR</span><b>ecorde</b></div><p>Presentes digitais. Memórias reais.</p><span>© 2026</span></footer>
      {giftOpen && <div className="gift-overlay" role="dialog" aria-modal="true" aria-label="Seu presente digital">
        <div className="gift-modal">
          <button className="gift-close" onClick={() => setGiftOpen(false)} aria-label="Fechar presente">×</button>
          <div className="gift-glow"/><div className="gift-confetti">✦　·　✦</div>
          <span className="gift-kicker">UM MIMO PARA VOCÊ</span>
          <h2>{giftTitle}</h2>
          <div className="gift-media-frame"><Media asset={giftMedia} className="gift-media"/><span className="gift-seal">✦</span></div>
          <p>{giftMessage}</p>
          <div className="gift-actions"><button className="gift-primary" onClick={downloadSouvenir}>Baixar meu presente ↓</button><button onClick={shareStory}>Usar no meu Story ↗</button></div>
          <div className="story-guide"><span>1</span><p><b>Toque em “Usar no meu Story”</b><small>No celular, escolha o Instagram. No computador, a figurinha será copiada ou baixada.</small></p><i>→</i><span>2</span><p><b>Escolha uma foto de fundo</b><small>Cole ou adicione a figurinha transparente sobre a sua foto e publique.</small></p></div>
          {shareNote && <div className="share-note">✓ {shareNote}</div>}
          <div className="gift-by">Mensagem e identidade personalizadas especialmente para esta celebração.</div>
        </div>
      </div>}
    </div>
  );
}

function Dashboard({ publicUrl }: { publicUrl: string }) {
  return <>
    <div className="welcome"><div><span className="kicker">SEXTA-FEIRA, 14 DE AGOSTO</span><h1>Boa tarde, Mariana <span>✦</span></h1><p>A sua celebração está alcançando cada vez mais pessoas.</p></div><button className="period-btn">Últimos 14 dias <span>⌄</span></button></div>
    <div className="stats-grid">{stats.map((s) => <article className="stat-card" key={s.label}><div className="stat-top"><Icon>{s.icon}</Icon><span className="up">↗ {s.change}</span></div><strong>{s.value}</strong><p>{s.label}</p></article>)}</div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-head"><div><h2>Alcance da página</h2><p>Visualizações nos últimos 14 dias</p></div><span className="legend"><i /> Visualizações</span></div><MiniChart /></section>
      <section className="panel qr-panel"><div className="panel-head"><div><h2>QR Code principal</h2><p>Pronto para compartilhar</p></div><button className="more" aria-label="Mais opções">•••</button></div><div className="qr-content"><div className="qr-box"><QrCard compact url={publicUrl}/></div><div className="qr-meta"><span className="live"><i/> Ativo</span><b>7.294</b><small>leituras totais</small><button onClick={() => navigator.clipboard?.writeText(publicUrl)}>Copiar link</button></div></div></section>
      <section className="panel activity-panel"><div className="panel-head"><div><h2>Atividade recente</h2><p>Acontecendo agora</p></div><button className="text-btn">Ver tudo →</button></div><div className="activity-list">
        <div><span className="avatar purple">AM</span><p><b>Alessandra M.</b> abriu o presente<small>Há 2 minutos</small></p><strong>Resgatado</strong></div>
        <div><span className="avatar gold">QR</span><p><b>QR Code “Entrada principal”</b> foi lido<small>Há 7 minutos</small></p><strong>+1</strong></div>
        <div><span className="avatar blue">RC</span><p><b>Ricardo C.</b> salvou o presente<small>Há 12 minutos</small></p><strong>Concluído</strong></div>
      </div></section>
    </div>
  </>;
}

function QrDashboard({ publicUrl, eventName }: { publicUrl: string; eventName: string }) {
  return <div className="feature-layout"><div className="feature-copy"><span className="kicker">QR CODE RASTREÁVEL</span><h1>Um código.<br/>Muitos presentes.</h1><p>Use este QR em cartazes, mesas, totens e redes sociais. Cada pessoa que escanear poderá abrir o presente digital do evento, e cada etapa aparece no painel.</p><div className="feature-stats"><div><b>7.294</b><span>leituras</span></div><div><b>68,4%</b><span>taxa de resgate</span></div></div><button className="primary-btn" onClick={() => window.print()}>Baixar para impressão <span>↓</span></button></div><div className="large-qr-card"><div className="qr-label"><span className="brand-gem">◆</span><b>{eventName}</b></div><QrCard url={publicUrl}/><h3>Escaneie e receba seu presente</h3><p>{publicUrl.replace(/^https?:\/\//,"")}</p><span className="track-tag">● Rastreamento ativo</span></div></div>;
}

function Sponsors({ items, onAdd, onMedia, onChange, onDelete }: { items: SponsorSummary[]; onAdd: () => void; onMedia: (id: string, file: File) => void; onChange: (item: SponsorSummary) => void; onDelete: (id: string) => void }) {
  return <><div className="welcome compact"><div><span className="kicker">PARCERIAS</span><h1>Patrocinadores</h1><p>Adicione até 20 parceiros. O patrocinador master sempre recebe o maior destaque.</p></div><button className="primary-btn" onClick={onAdd}>Adicionar patrocinador <span>+</span></button></div><div className="sponsor-grid">{items.map((item,i)=><article key={item.id}><div className={`sponsor-mark s${i}`}>{item.logoUrl ? <img src={item.logoUrl} alt={`Logo ${item.name}`} className="sponsor-upload-preview"/> : item.name.split(" ")[0]}</div><select value={item.tier} onChange={e=>onChange({...item,tier:e.target.value})}><option value="master">Patrocinador master</option><option value="sponsor">Patrocinador</option><option value="supporter">Apoiador</option></select><input className="sponsor-name-input" value={item.name} onChange={e=>onChange({...item,name:e.target.value})}/><div><p>Posição na página</p><b>#{i+1}</b></div><label className="upload-inline">{item.logoUrl ? "Trocar imagem" : "Adicionar logotipo"}<input type="file" accept="image/*" onChange={e => e.target.files?.[0] && onMedia(item.id,e.target.files[0])}/></label><button className="sponsor-delete" onClick={()=>onDelete(item.id)}>Remover</button></article>)}</div>{!items.length&&<div className="panel sponsor-empty">Nenhum patrocinador adicionado ainda.</div>}<div className="panel sponsor-note"><div className="icon">✦</div><div><h2>Marcas em primeiro plano</h2><p>Os parceiros aparecem já na primeira tela da página pública, com destaque especial para o patrocinador master.</p></div><span>Visibilidade prioritária</span></div></>;
}

function PageEditor({ eventMedia, giftMedia, giftTitle, giftMessage, pageEyebrow, pageTitle, pageMessage, ctaText, onEventMedia, onGiftMedia, onGiftTitle, onGiftMessage, onPageEyebrow, onPageTitle, onPageMessage, onCtaText }: { eventMedia: MediaAsset; giftMedia: MediaAsset; giftTitle: string; giftMessage: string; pageEyebrow: string; pageTitle: string; pageMessage: string; ctaText: string; onEventMedia: (asset: MediaAsset) => void; onGiftMedia: (asset: MediaAsset) => void; onGiftTitle: (value: string) => void; onGiftMessage: (value: string) => void; onPageEyebrow: (value: string) => void; onPageTitle: (value: string) => void; onPageMessage: (value: string) => void; onCtaText: (value: string) => void }) {
  return <div className="editor-layout editor-media-layout"><section className="editor-controls"><span className="kicker">PERSONALIZAÇÃO</span><h1>Sua página,<br/>do seu jeito.</h1><p>Edite toda a experiência que o visitante verá antes e depois de abrir o presente.</p><div className="editor-section-title"><span>01</span><div><b>Página de entrada</b><small>Textos exibidos antes de abrir o presente</small></div></div><div className="page-copy-fields"><label>Data e local<input value={pageEyebrow} onChange={e => onPageEyebrow(e.target.value)} /></label><label>Título da página<input value={pageTitle} onChange={e => onPageTitle(e.target.value)} /></label><label className="wide">Mensagem da página<textarea value={pageMessage} onChange={e => onPageMessage(e.target.value)} /></label><label>Texto do botão<input value={ctaText} onChange={e => onCtaText(e.target.value)} /></label></div><div className="editor-section-title"><span>02</span><div><b>Presente digital</b><small>Mensagem revelada depois do clique</small></div></div><div className="gift-copy-fields"><label>Título do presente<input value={giftTitle} onChange={e => onGiftTitle(e.target.value)} placeholder="Uma bênção para você" /></label><label>Mensagem do presente<textarea value={giftMessage} onChange={e => onGiftMessage(e.target.value)} placeholder="Escreva uma mensagem especial..." /></label></div><div className="media-fields"><label className="upload-field"><span><b>Imagem da página</b><small>Banner, fotografia ou arte de apresentação</small></span><Media asset={eventMedia} className="upload-thumb"/><em>Trocar imagem</em><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && onEventMedia(fileToAsset(e.target.files[0]))}/></label><label className="upload-field"><span><b>Imagem do presente</b><small>Fotografia, cartão ou arte especial</small></span><Media asset={giftMedia} className="upload-thumb"/><em>Trocar imagem</em><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && onGiftMedia(fileToAsset(e.target.files[0]))}/></label></div><label>Cor de destaque<div className="colors"><button className="selected" aria-label="Violeta"/><button aria-label="Dourado"/><button aria-label="Azul"/><button aria-label="Verde"/></div></label><button className="primary-btn">Salvar alterações <span>✓</span></button></section><div className="phone-preview"><div className="phone-bar"><i/><i/><i/></div><div className="phone-body phone-body-media"><Media asset={eventMedia} className="phone-event-media"/><small>{pageEyebrow}</small><h2>{pageTitle}</h2><p>{pageMessage}</p><button>{ctaText} →</button><div className="phone-count">♡ 847 pessoas já receberam</div></div></div></div>;
}

function AuthScreen() {
  const [mode, setMode] = useState<"signin"|"signup">("signup");
  const [demo, setDemo] = useState(0);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(()=>{const timer=window.setInterval(()=>setDemo(current=>(current+1)%3),4200);return()=>window.clearInterval(timer);},[]);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(""); const result = mode === "signup" ? await authClient.signUp.email({ name, email, password }) : await authClient.signIn.email({ email, password }); if (result.error) setError(result.error.message || "Não foi possível continuar."); else window.location.reload(); setBusy(false); };
  const demoCopy=[{k:"01 · ENCONTRO",title:"O QR desperta a curiosidade.",text:"Na entrada, na mesa ou no telão: cada leitura vira uma experiência rastreável."},{k:"02 · SURPRESA",title:"O convidado recebe algo só dele.",text:"Uma página envolvente revela o presente, a mensagem e a identidade do evento."},{k:"03 · IMPACTO",title:"A memória continua depois da festa.",text:"Downloads, Stories e visibilidade dos parceiros aparecem no painel em tempo real."}][demo];
  return <div className="auth-shell"><section className="auth-story"><div className="brand auth-brand"><span className="brand-gem">◆</span><span>QR</span><b>ecorde</b></div><div className="auth-intro"><span className="kicker">PRESENTES DIGITAIS PARA EVENTOS</span><h1>Transforme um QR Code<br/>em uma <em>memória.</em></h1><p>Da primeira leitura ao Story: uma experiência de marca que o público leva consigo.</p><div className="auth-value-row"><span><b>3 min</b><small>para começar</small></span><span><b>1 link</b><small>pronto para divulgar</small></span><span><b>24h</b><small>de métricas ao vivo</small></span></div></div><div className={`auth-demo demo-${demo}`} aria-live="polite"><div className="demo-orbit"><i/><i/><i/><div className="demo-phone"><div className="demo-notch"/><div className="demo-screen" key={demo}>{demo===0&&<div className="demo-qr"><QrCard compact url="https://qrecorde.com/p/seu-evento"/><span>Aponte a câmera</span><small>Presente esperando por você</small></div>}{demo===1&&<div className="demo-gift"><span>✦</span><small>UM PRESENTE PARA VOCÊ</small><strong>Uma lembrança<br/>para guardar.</strong><button>Abrir presente</button></div>}{demo===2&&<div className="demo-result"><small>ACONTECENDO AGORA</small><strong>847</strong><span>presentes abertos</span><div><i style={{height:"42%"}}/><i style={{height:"65%"}}/><i style={{height:"54%"}}/><i style={{height:"82%"}}/><i style={{height:"100%"}}/></div></div>}</div></div><div className="floating-card fc-top"><span>↗</span><b>+18,4%</b><small>alcance hoje</small></div><div className="floating-card fc-bottom"><span>♡</span><b>Presente aberto</b><small>agora mesmo</small></div></div><div className="demo-caption" key={`caption-${demo}`}><span>{demoCopy.k}</span><h2>{demoCopy.title}</h2><p>{demoCopy.text}</p><div className="demo-tabs">{["Escanear","Receber","Compartilhar"].map((label,index)=><button type="button" aria-label={`Ver etapa ${label}`} aria-pressed={demo===index} className={demo===index?"active":""} onClick={()=>setDemo(index)} key={label}><i/>{label}</button>)}</div></div></div></section><section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><div className="auth-mobile-brand brand"><span className="brand-gem">◆</span><span>QR</span><b>ecorde</b></div><div className="auth-form-top"><span className="kicker">{mode === "signup" ? "COMECE GRATUITAMENTE" : "BEM-VINDO DE VOLTA"}</span><span>AMBIENTE SEGURO　●</span></div><h2>{mode === "signup" ? "Crie sua conta" : "Entre na sua conta"}</h2><p>{mode === "signup" ? "Seu primeiro presente fica pronto em poucos minutos." : "Continue criando experiências memoráveis."}</p>{mode === "signup" && <label>Seu nome<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Mariana Nunes"/></label>}<label>E-mail<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@evento.com.br"/></label><label>Senha<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres"/></label>{error&&<div className="auth-error">{error}</div>}<button className="primary-btn" disabled={busy}>{busy?"Aguarde...":mode==="signup"?"Criar minha conta →":"Entrar →"}</button><div className="auth-trust"><span>✓ Sem cartão</span><span>✓ Publique quando quiser</span></div><small>{mode==="signup"?"Já tem uma conta? ":"Ainda não tem conta? "}<button type="button" onClick={()=>setMode(mode==="signup"?"signin":"signup")}>{mode==="signup"?"Entrar":"Criar conta"}</button></small></form></section></div>;
}

type EventSummary = { id:string; slug:string; status:string; name:string; pageTitle:string };
type SponsorSummary = { id:string; name:string; tier:string; tagline:string; logoKey?:string|null; logoUrl?:string|null };

export default function Home() {
  const sessionQuery = authClient.useSession();
  const [view, setView] = useState<View>("dashboard");
  const [publicMode, setPublicMode] = useState(false);
  const [eventMedia, setEventMedia] = useState<MediaAsset>({ src: "/padre-eustaquio-2026.jpg", type: "image", name: "Festa das Nações 2026" });
  const [giftMedia, setGiftMedia] = useState<MediaAsset>({ src: "/presente-padre-eustaquio.png", type: "image", name: "Bênção do Padre Eustáquio" });
  const [giftTitle, setGiftTitle] = useState("Que esta bênção acompanhe o seu caminho.");
  const [giftMessage, setGiftMessage] = useState("Uma lembrança especial dos 20 anos de beatificação do Padre Eustáquio, oferecida com carinho pelos parceiros desta festa.");
  const [pageEyebrow, setPageEyebrow] = useState("23 a 30 de agosto • Belo Horizonte");
  const [pageTitle, setPageTitle] = useState("Festa do Beato Padre Eustáquio");
  const [pageMessage, setPageMessage] = useState("Você chegou até aqui porque alguém preparou um carinho especial. Abra agora o presente digital desta celebração.");
  const [ctaText, setCtaText] = useState("Abrir meu presente");
  const [sponsors, setSponsors] = useState<SponsorSummary[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [eventHydrated, setEventHydrated] = useState(false);
  const [saveState, setSaveState] = useState("Salvo");
  const title = useMemo(() => nav.find(n => n.id === view)?.label, [view]);
  const activeEvent = events.find(event => event.id === activeEventId);
  const publicUrl = typeof window === "undefined" ? `/p/${activeEvent?.slug || "presente"}` : `${window.location.origin}/p/${activeEvent?.slug || "presente"}`;
  useEffect(()=>{if(!sessionQuery.data?.user)return;fetch("/api/events").then(r=>r.json()).then((items:EventSummary[])=>{setEvents(items);setActiveEventId(items[0]?.id||null);setEventsLoaded(true);}).catch(()=>setEventsLoaded(true));},[sessionQuery.data?.user]);
  useEffect(()=>{if(!activeEventId)return;setEventHydrated(false);fetch(`/api/events/${activeEventId}`).then(r=>r.json()).then(data=>{setPageTitle(data.pageTitle||data.name);setPageEyebrow(data.eyebrow||"");setPageMessage(data.pageMessage||"");setCtaText(data.ctaText||"Abrir meu presente");setGiftTitle(data.giftTitle||"Um presente para você");setGiftMessage(data.giftMessage||"");if(data.coverImageKey)setEventMedia({src:`/media/${data.coverImageKey}`,type:"image",name:"Imagem da página"});if(data.giftImageKey)setGiftMedia({src:`/media/${data.giftImageKey}`,type:"image",name:"Imagem do presente"});const loadedSponsors=(data.sponsors||[]).map((item:SponsorSummary)=>({...item,logoUrl:item.logoKey?`/media/${item.logoKey}`:null}));setSponsors(loadedSponsors);setEventHydrated(true);});},[activeEventId]);
  useEffect(()=>{if(!activeEventId||!eventHydrated)return;setSaveState("Salvando...");const timer=setTimeout(()=>fetch(`/api/events/${activeEventId}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({name:pageTitle,pageTitle,pageMessage,eyebrow:pageEyebrow,ctaText,giftTitle,giftMessage})}).then(()=>setSaveState("Salvo")),650);return()=>clearTimeout(timer);},[activeEventId,eventHydrated,pageTitle,pageMessage,pageEyebrow,ctaText,giftTitle,giftMessage]);
  const createEvent=async()=>{const response=await fetch("/api/events",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:"Novo presente digital"})});const created=await response.json();if(response.ok){setEvents(current=>[created,...current]);setActiveEventId(created.id);setView("page");}};
  const publishEvent=async()=>{if(!activeEventId)return;const response=await fetch(`/api/events/${activeEventId}/publish`,{method:"POST"});const result=await response.json();if(response.ok){setEvents(current=>current.map(item=>item.id===activeEventId?{...item,status:"published"}:item));navigator.clipboard?.writeText(`${window.location.origin}${result.url}`);alert(`Publicado! Link copiado: ${window.location.origin}${result.url}`);}};
  const persistMedia=async(kind:"cover"|"gift",asset:MediaAsset)=>{kind==="cover"?setEventMedia(asset):setGiftMedia(asset);if(!activeEventId||!asset.file)return;const form=new FormData();form.set("kind",kind);form.set("file",asset.file);const response=await fetch(`/api/events/${activeEventId}/media`,{method:"POST",body:form});const result=await response.json();if(response.ok){const saved={src:result.url,type:"image" as const,name:asset.name};kind==="cover"?setEventMedia(saved):setGiftMedia(saved);}};
  const addSponsor=async()=>{if(!activeEventId)return;const response=await fetch(`/api/events/${activeEventId}/sponsors`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:"Novo patrocinador",tier:sponsors.length?"sponsor":"master"})});const item=await response.json();if(response.ok)setSponsors(current=>[...current,{id:item.id,name:"Novo patrocinador",tier:sponsors.length?"sponsor":"master",tagline:""}]);};
  const changeSponsor=(changed:SponsorSummary)=>{setSponsors(current=>current.map(item=>item.id===changed.id?changed:item));if(activeEventId)fetch(`/api/events/${activeEventId}/sponsors/${changed.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(changed)});};
  const uploadSponsor=async(id:string,file:File)=>{if(!activeEventId)return;const form=new FormData();form.set("file",file);const response=await fetch(`/api/events/${activeEventId}/sponsors/${id}`,{method:"POST",body:form});const result=await response.json();if(response.ok)setSponsors(current=>current.map(item=>item.id===id?{...item,logoKey:result.key,logoUrl:result.url}:item));};
  const deleteSponsor=async(id:string)=>{if(!activeEventId)return;await fetch(`/api/events/${activeEventId}/sponsors/${id}`,{method:"DELETE"});setSponsors(current=>current.filter(item=>item.id!==id));};
  if(sessionQuery.isPending)return <div className="app-loading"><span className="brand-gem">◆</span><p>Preparando a QRecorde...</p></div>;
  if(!sessionQuery.data?.user)return <AuthScreen/>;
  if(eventsLoaded&&!activeEventId)return <div className="empty-shell"><div className="brand"><span className="brand-gem">◆</span><span>QR</span><b>ecorde</b></div><div className="empty-card"><span>✦</span><div className="kicker">SEU PRIMEIRO PRESENTE</div><h1>Vamos criar algo<br/>inesquecível?</h1><p>Comece com um presente digital e personalize cada detalhe antes de publicar.</p><button className="primary-btn" onClick={createEvent}>Criar meu primeiro presente →</button></div><button className="signout-link" onClick={()=>authClient.signOut()}>Sair da conta</button></div>;
  if (publicMode) return <div><button className="back-dashboard" onClick={() => setPublicMode(false)}>← Voltar ao painel</button><PublicPage eventMedia={eventMedia} giftMedia={giftMedia} sponsorMedia={sponsors.map(item=>item.logoUrl?{src:item.logoUrl,type:"image",name:item.name}:null)} sponsorNames={sponsors.map(item=>item.name)} giftTitle={giftTitle} giftMessage={giftMessage} pageEyebrow={pageEyebrow} pageTitle={pageTitle} pageMessage={pageMessage} ctaText={ctaText}/></div>;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-gem">◆</span><span>QR</span><b>ecorde</b></div>
      <div className="event-switch"><span>{pageTitle.slice(0,2).toUpperCase()}</span><div><select aria-label="Selecionar presente" value={activeEventId||""} onChange={e=>setActiveEventId(e.target.value)}>{events.map(event=><option value={event.id} key={event.id}>{event.pageTitle||event.name}</option>)}</select><small>{events.find(e=>e.id===activeEventId)?.status==="published"?"Publicado":saveState}</small></div><button onClick={createEvent} aria-label="Novo presente">＋</button></div>
      <nav aria-label="Navegação principal">{nav.map(n=><button key={n.id} className={view===n.id?"active":""} onClick={()=>setView(n.id)}><Icon>{n.icon}</Icon>{n.label}</button>)}</nav>
      <div className="sidebar-bottom"><button><Icon>⚙</Icon>Configurações</button><div className="help-card"><span>?</span><b>Precisa de ajuda?</b><p>Fale com nosso time.</p><button>Conversar agora</button></div><div className="user-card"><span>{sessionQuery.data.user.name.slice(0,2).toUpperCase()}</span><div><b>{sessionQuery.data.user.name}</b><small>{sessionQuery.data.user.email}</small></div><button onClick={()=>authClient.signOut()} aria-label="Sair">↗</button></div></div>
    </aside>
    <main className="main-content"><header className="topbar"><div className="mobile-brand brand"><span className="brand-gem">◆</span><span>QR</span><b>ecorde</b></div><span className="crumb">Evento <b>/</b> {title}</span><div className="top-actions"><button className="publish-btn" onClick={publishEvent}>Publicar</button><button className="preview-btn" onClick={()=>setPublicMode(true)}>Visualizar página <span>↗</span></button></div></header><div className="content-wrap">{view==="dashboard"&&<Dashboard publicUrl={publicUrl}/>} {view==="page"&&<PageEditor eventMedia={eventMedia} giftMedia={giftMedia} giftTitle={giftTitle} giftMessage={giftMessage} pageEyebrow={pageEyebrow} pageTitle={pageTitle} pageMessage={pageMessage} ctaText={ctaText} onEventMedia={a=>persistMedia("cover",a)} onGiftMedia={a=>persistMedia("gift",a)} onGiftTitle={setGiftTitle} onGiftMessage={setGiftMessage} onPageEyebrow={setPageEyebrow} onPageTitle={setPageTitle} onPageMessage={setPageMessage} onCtaText={setCtaText}/>} {view==="qrcodes"&&<QrDashboard publicUrl={publicUrl} eventName={pageTitle}/>} {view==="sponsors"&&<Sponsors items={sponsors} onAdd={addSponsor} onMedia={uploadSponsor} onChange={changeSponsor} onDelete={deleteSponsor}/>}</div></main>
  </div>;
}
