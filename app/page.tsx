"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { authClient } from "../lib/auth-client";

type View = "dashboard" | "pages" | "page" | "qrcodes" | "sponsors";
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

type AnalyticsData={totals:{views:number;opens:number;downloads:number;stories:number};daily:Array<{day:string;views:number;opens:number;downloads:number;stories:number}>;recent:Array<{id:string;action:string;source:string;createdAt:number}>};
type QrSummary={id:string;name:string;campaign:string;scans:number;createdAt:number};

const nav: { id: View; label: string; icon: string }[] = [
  { id: "dashboard", label: "Visão geral", icon: "⌂" },
  { id: "pages", label: "Minhas páginas", icon: "▦" },
  { id: "page", label: "Página pública", icon: "◫" },
  { id: "qrcodes", label: "QR Codes", icon: "⌗" },
  { id: "sponsors", label: "Patrocinadores", icon: "✦" },
];

function MiniChart({daily}:{daily:AnalyticsData["daily"]}) {
  const days=Array.from({length:14},(_,index)=>{const date=new Date(Date.now()-(13-index)*86400000);const key=date.toISOString().slice(0,10);return{day:key,views:Number(daily.find(item=>item.day===key)?.views||0)}});const max=Math.max(1,...days.map(item=>item.views));
  return (
    <div className="chart-wrap" aria-label="Gráfico de visualizações dos últimos 14 dias">
      <div className="chart-grid"><span>{max}</span><span>{Math.round(max*.66)}</span><span>{Math.round(max*.33)}</span><span>0</span></div>
      <div className="bars">
        {days.map((item, i) => <span key={item.day} title={`${item.views} visualizações`} className={i === days.length - 1 ? "active" : ""} style={{ height: `${Math.max(item.views?5:1,(item.views/max)*100)}%` }} />)}
      </div>
      <div className="chart-days"><span>{days[0].day.slice(5).replace("-","/")}</span><span>{days[4].day.slice(5).replace("-","/")}</span><span>{days[9].day.slice(5).replace("-","/")}</span><span>Hoje</span></div>
    </div>
  );
}

function QrCard({ compact = false, url }: { compact?: boolean; url: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const trackedUrl=url.includes("utm_source=")?url:`${url}${url.includes("?")?"&":"?"}utm_source=qr_principal`;
    QRCode.toDataURL(trackedUrl, {
      width: compact ? 180 : 300, margin: 1, color: { dark: "#18151c", light: "#fffdf8" }, errorCorrectionLevel: "H"
    }).then(setSrc);
  }, [compact, url]);
  return src ? <img className="qr-image" src={src} alt="QR Code para a página da Festa do Beato Padre Eustáquio" /> : <div className="qr-loading" />;
}

export function PublicPage({ eventMedia, giftMedia, instagramMedia, instagramText, sponsorMedia, sponsorNames = ["Vallourec", "Unimed BH", "Supermercados BH"], giftTitle, giftMessage, pageEyebrow, pageTitle, pageMessage, ctaText, trackingSlug, accentColor = "#6b29d9" }: { eventMedia: MediaAsset; giftMedia: MediaAsset; instagramMedia:MediaAsset; instagramText:string; sponsorMedia: (MediaAsset | null)[]; sponsorNames?: string[]; giftTitle: string; giftMessage: string; pageEyebrow: string; pageTitle: string; pageMessage: string; ctaText: string; trackingSlug?: string; accentColor?:string }) {
  const [giftOpen, setGiftOpen] = useState(false);
  const [shareNote, setShareNote] = useState("");
  const track = (action: "view" | "open" | "download" | "story") => { if (trackingSlug) fetch(`/api/public/${trackingSlug}/track`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, source: new URLSearchParams(window.location.search).get("utm_source") || "direct" }) }).catch(() => undefined); };
  useEffect(() => { track("view"); }, [trackingSlug]);
  const drawWrappedText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) => {
    const words = text.split(/\s+/); let line = ""; const lines: string[] = [];
    for (const word of words) { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test; }
    if (line) lines.push(line); lines.slice(0, maxLines).forEach((item, i) => ctx.fillText(item, x, y + i * lineHeight, maxWidth));
  };
  const drawSmartStoryLabel = (ctx:CanvasRenderingContext2D, rawText:string, subtitle:string) => {
    const text=(rawText.trim()||"Meu momento").toUpperCase().slice(0,80); const words=text.split(/\s+/); let fontSize=text.length>34?42:text.length>20?50:62; const maxWidth=820;
    ctx.font=`800 ${fontSize}px Arial`; const lines:string[]=[]; let line="";
    for(const word of words){const candidate=line?`${line} ${word}`:word;if(ctx.measureText(candidate).width>maxWidth&&line){lines.push(line);line=word;}else line=candidate;}
    if(line)lines.push(line); if(lines.length>2){fontSize=36;ctx.font=`800 ${fontSize}px Arial`;lines.length=0;line="";for(const word of words){const candidate=line?`${line} ${word}`:word;if(ctx.measureText(candidate).width>maxWidth&&line&&lines.length<1){lines.push(line);line=word;}else line=candidate;}if(line)lines.push(line);}
    const shown=lines.slice(0,2);const boxHeight=shown.length===1?128:185;const boxY=shown.length===1?985:945;const phraseCenter=boxY+boxHeight/2;
    ctx.save();ctx.shadowBlur=0;ctx.fillStyle=accentColor;ctx.beginPath();ctx.roundRect(80,boxY,920,boxHeight,boxHeight/2);ctx.fill();ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`800 ${fontSize}px Arial`;shown.forEach((item,index)=>ctx.fillText(item,540,phraseCenter+(index-(shown.length-1)/2)*(fontSize+10),maxWidth));const title=subtitle.trim().slice(0,100);ctx.font="italic 700 34px Georgia";ctx.lineWidth=7;ctx.lineJoin="round";ctx.strokeStyle="#261a2ccc";ctx.fillStyle="#fff";ctx.shadowColor="#0008";ctx.shadowBlur=12;ctx.strokeText(title,540,boxY+boxHeight+58,840);ctx.fillText(title,540,boxY+boxHeight+58,840);ctx.restore();
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
      const storyImage = await loadCanvasImage(instagramMedia.src);
      const ratio = Math.min(720 / storyImage.width, 850 / storyImage.height); const width = storyImage.width * ratio; const height = storyImage.height * ratio;
      ctx.drawImage(storyImage,(1080-width)/2,80,width,height);
    }
    ctx.textAlign = "center"; ctx.fillStyle = "#fff8eb"; ctx.shadowColor = "#26132988"; ctx.shadowBlur = 0;
    if (transparent) drawSmartStoryLabel(ctx,instagramText,pageTitle); else { ctx.font = "700 38px Arial"; ctx.fillText(giftTitle.toUpperCase(), 540,745,940); }
    if (!transparent) { ctx.font = "600 24px Arial"; ctx.fillText(pageTitle.toUpperCase(), 540, 795, 940); }
    if (!transparent) { ctx.fillStyle = "#fff8eb"; ctx.font = "italic 28px Georgia"; drawWrappedText(ctx, giftMessage, 540, 855, 820, 38, 3); ctx.strokeStyle = "#ffffff35"; ctx.beginPath(); ctx.moveTo(110, 995); ctx.lineTo(970, 995); ctx.stroke(); ctx.fillStyle = "#e9c873"; ctx.font = "700 17px Arial"; ctx.fillText("PATROCINADOR MASTER  •  VALLOUREC", 540, 1025); ctx.fillStyle = "#fff8eb"; ctx.font = "600 15px Arial"; ctx.fillText("UNIMED BH   •   SUPERMERCADOS BH", 540, 1055); }
    else { ctx.shadowBlur = 0; ctx.fillStyle = accentColor; ctx.font = "700 20px Arial"; ctx.fillText("QRECORDE  ✦  PRESENTE DIGITAL", 540, 1305); }
    return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Falha ao criar imagem")), "image/png"));
  };
  const downloadSouvenir = async () => { const blob = await createSouvenir(false); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "meu-presente-digital.png"; a.click(); URL.revokeObjectURL(url); track("download"); setShareNote("Seu presente foi salvo."); };
  const shareStory = async () => {
    const blob = await createSouvenir(true); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "figurinha-meu-presente-stories.png"; a.click(); window.setTimeout(()=>URL.revokeObjectURL(url),1000);track("story");setShareNote("Figurinha baixada! Abra o Instagram, escolha uma foto de fundo e adicione este PNG pela galeria ou pelo adesivo de foto.");
  };
  return (
    <div className="public-shell" style={{"--violet":accentColor} as React.CSSProperties}>
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
            <div className="public-proof"><b>847</b> pessoas já receberam este presente <span>♡</span></div>
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
        <div className="sponsors-heading"><div><div className="eyebrow">UM PRESENTE OFERECIDO POR</div><h2>Quem acredita nesta festa<br/>também presenteia você.</h2></div><p>Este presente digital chega até você com o apoio de organizações que valorizam a fé, a cultura e a nossa comunidade.</p></div>
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
          <span className="gift-kicker">UM PRESENTE PARA VOCÊ</span>
          <h2>{giftTitle}</h2>
          <div className="gift-media-frame"><Media asset={giftMedia} className="gift-media"/><span className="gift-seal">✦</span></div>
          <p>{giftMessage}</p>
          <div className="gift-actions"><button className="gift-primary" onClick={downloadSouvenir}>Baixar meu presente ↓</button><button onClick={shareStory}>Baixar figurinha do Story ↓</button></div>
          <div className="story-guide"><article><span>1</span><p><b>Baixe a figurinha</b><small>Toque em “Baixar figurinha do Story” e salve o arquivo PNG no celular.</small></p></article><article><span>2</span><p><b>Escolha uma foto de fundo</b><small>Abra o Instagram, crie um Story e selecione uma foto sua para usar como fundo.</small></p></article><article><span>3</span><p><b>Adicione por cima da foto</b><small>No Instagram, use o adesivo de foto para selecionar o PNG baixado. Ajuste o tamanho e publique.</small></p></article></div>
          {shareNote && <div className="share-note">✓ {shareNote}</div>}
          <div className="gift-by">Mensagem e identidade personalizadas especialmente para esta celebração.</div>
        </div>
      </div>}
    </div>
  );
}

function Dashboard({ publicUrl, userName, eventName, analytics, qrScans, onManage }: { publicUrl: string; userName: string; eventName: string; analytics:AnalyticsData|null; qrScans:number; onManage: () => void }) {
  const firstName = userName.trim().split(/\s+/)[0] || "por aqui";
  const totals=analytics?.totals||{views:0,opens:0,downloads:0,stories:0};const rate=totals.views?`${Math.round((totals.opens/totals.views)*100)}%`:"0%";const cards=[{label:"Visualizações",value:totals.views,icon:"↗"},{label:"Presentes abertos",value:totals.opens,icon:"♡"},{label:"Taxa de abertura",value:rate,icon:"◎"},{label:"Downloads + Stories",value:totals.downloads+totals.stories,icon:"◇"}];const actionCopy:Record<string,string>={view:"visitou a página",open:"abriu o presente",download:"baixou o presente",story:"criou a arte do Story"};const ago=(time:number)=>{const minutes=Math.max(0,Math.floor((Date.now()-Number(time))/60000));return minutes<1?"Agora":minutes<60?`Há ${minutes} min`:`Há ${Math.floor(minutes/60)} h`;};const recentGroups=(analytics?.recent||[]).reduce<Array<AnalyticsData["recent"][number]&{count:number}>>((groups,item)=>{const previous=groups.at(-1);if(previous&&previous.action===item.action&&previous.source===item.source&&Number(previous.createdAt)-Number(item.createdAt)<5*60000)previous.count+=1;else groups.push({...item,count:1});return groups;},[]).slice(0,8);
  return <>
    <div className="welcome"><div><span className="kicker">SEU PAINEL QRECORDE</span><h1>Olá, {firstName} <span>✦</span></h1><p>Acompanhe o desempenho de <b>{eventName}</b> e continue construindo sua experiência.</p></div><button className="period-btn" onClick={onManage}>Gerenciar páginas <span>→</span></button></div>
    <div className="stats-grid">{cards.map((s) => <article className="stat-card" key={s.label}><div className="stat-top"><Icon>{s.icon}</Icon><span className="real-data">Dado real</span></div><strong>{Number.isFinite(s.value as number)?Number(s.value).toLocaleString("pt-BR"):s.value}</strong><p>{s.label}</p></article>)}</div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-head"><div><h2>Alcance da página</h2><p>Visualizações nos últimos 14 dias</p></div><span className="legend"><i /> Visualizações</span></div><MiniChart daily={analytics?.daily||[]} /></section>
      <section className="panel qr-panel"><div className="panel-head"><div><h2>QR Codes</h2><p>Leituras identificadas por campanha</p></div></div><div className="qr-content"><div className="qr-box"><QrCard compact url={publicUrl}/></div><div className="qr-meta"><span className="live"><i/> Rastreamento ativo</span><b>{qrScans.toLocaleString("pt-BR")}</b><small>leituras totais</small><button onClick={() => navigator.clipboard?.writeText(publicUrl)}>Copiar link público</button></div></div></section>
      <section className="panel activity-panel"><div className="panel-head"><div><h2>Atividade recente</h2><p>Linha do tempo de ações anônimas</p></div></div><div className="activity-list timeline">{recentGroups.length?recentGroups.map(item=><div key={item.id}><span className="timeline-dot">{item.action==="view"?"↗":item.action==="open"?"♡":"↓"}</span><p><b>{item.count>1?`${item.count} pessoas`:"Uma pessoa"} {actionCopy[item.action]||"interagiu"}</b><small>{ago(item.createdAt)} • {item.source.replace(/^qr_/,"QR: ")}</small></p><strong>{item.count>1?`+${item.count}`:item.action}</strong></div>):<div className="activity-empty"><p><b>Ainda não há atividade</b><small>As interações aparecerão aqui após a publicação.</small></p></div>}</div></section>
    </div>
  </>;
}

function PagesManager({ events, activeId, onSelect, onCreate, onDelete }: { events: EventSummary[]; activeId: string | null; onSelect: (id: string, edit?: boolean) => void; onCreate: () => void; onDelete: (event: EventSummary) => void }) {
  return <><div className="welcome compact pages-heading"><div><span className="kicker">SEU CONTEÚDO</span><h1>Minhas páginas</h1><p>Crie, publique e acompanhe todas as experiências da sua conta.</p></div><button className="primary-btn" onClick={onCreate}>Nova página <span>＋</span></button></div><div className="pages-grid">{events.map(item=><article className={`page-card ${item.id===activeId?"current":""}`} key={item.id}><div className="page-card-cover"><span>{(item.pageTitle||item.name).slice(0,2).toUpperCase()}</span><i className={item.status}/></div><div className="page-card-body"><div className="page-card-status"><span className={item.status}>{item.status==="published"?"● Publicada":"○ Rascunho"}</span><small>/{item.slug}</small></div><h2>{item.pageTitle||item.name}</h2><p>Pronta para continuar de onde você parou.</p><div className="page-card-actions"><button className="primary-btn" onClick={()=>onSelect(item.id,true)}>Editar página</button><button onClick={()=>onSelect(item.id)}>Abrir painel</button><button className="danger" aria-label={`Excluir ${item.pageTitle||item.name}`} onClick={()=>onDelete(item)}>Excluir</button></div></div></article>)}</div></>;
}

function QrDashboard({ publicUrl, eventName, items, onCreate, onRename, onDelete }: { publicUrl:string;eventName:string;items:QrSummary[];onCreate:()=>void;onRename:(item:QrSummary)=>void;onDelete:(item:QrSummary)=>void }) {
  return <><div className="welcome compact"><div><span className="kicker">CAMPANHAS RASTREÁVEIS</span><h1>Seus QR Codes</h1><p>Crie um código para cada ponto de divulgação e descubra de onde vêm as leituras.</p><div className="qr-association"><span>◆</span><div><small>PRESENTE ASSOCIADO</small><b>{eventName}</b></div></div></div><button className="primary-btn" onClick={onCreate}>Novo QR Code <span>＋</span></button></div><div className="qr-manager-grid">{items.map(item=>{const url=`${publicUrl}?utm_source=qr_${item.campaign}`;return <article className="qr-manager-card" key={item.id}><div className="qr-manager-image"><QrCard compact url={url}/></div><div><span className="live"><i/> Campanha ativa</span><small className="qr-linked">Associado a {eventName}</small><h2>{item.name}</h2><p>{url}</p><strong>{Number(item.scans).toLocaleString("pt-BR")} <small>leituras</small></strong><div className="qr-manager-actions"><button onClick={()=>navigator.clipboard?.writeText(url)}>Copiar link</button><button onClick={()=>onRename(item)}>Editar</button><button className="danger" onClick={()=>onDelete(item)}>Excluir</button></div></div></article>})}</div>{!items.length&&<div className="panel qr-empty"><b>Nenhum QR Code para {eventName}</b><p>Crie o primeiro código associado a este presente.</p></div>}</>;
}

function Sponsors({ items, onAdd, onMedia, onChange, onDelete }: { items: SponsorSummary[]; onAdd: () => void; onMedia: (id: string, file: File) => void; onChange: (item: SponsorSummary) => void; onDelete: (id: string) => void }) {
  return <><div className="welcome compact"><div><span className="kicker">PARCERIAS</span><h1>Patrocinadores</h1><p>Adicione até 20 parceiros. O patrocinador master sempre recebe o maior destaque.</p></div><button className="primary-btn" onClick={onAdd}>Adicionar patrocinador <span>+</span></button></div><div className="sponsor-grid">{items.map((item,i)=><article key={item.id}><div className={`sponsor-mark s${i}`}>{item.logoUrl ? <img src={item.logoUrl} alt={`Logo ${item.name}`} className="sponsor-upload-preview"/> : item.name.split(" ")[0]}</div><select value={item.tier} onChange={e=>onChange({...item,tier:e.target.value})}><option value="master">Patrocinador master</option><option value="sponsor">Patrocinador</option><option value="supporter">Apoiador</option></select><input className="sponsor-name-input" value={item.name} onChange={e=>onChange({...item,name:e.target.value})}/><div><p>Posição na página</p><b>#{i+1}</b></div><label className="upload-inline">{item.logoUrl ? "Trocar imagem" : "Adicionar logotipo"}<input type="file" accept="image/*" onChange={e => e.target.files?.[0] && onMedia(item.id,e.target.files[0])}/></label><button className="sponsor-delete" onClick={()=>onDelete(item.id)}>Remover</button></article>)}</div>{!items.length&&<div className="panel sponsor-empty">Nenhum patrocinador adicionado ainda.</div>}<div className="panel sponsor-note"><div className="icon">✦</div><div><h2>Marcas em primeiro plano</h2><p>Os parceiros aparecem já na primeira tela da página pública, com destaque especial para o patrocinador master.</p></div><span>Visibilidade prioritária</span></div></>;
}

function EditorPreview({ eventMedia,giftMedia,instagramMedia,instagramText,giftTitle,giftMessage,pageEyebrow,pageTitle,pageMessage,ctaText,accentColor }:{eventMedia:MediaAsset;giftMedia:MediaAsset;instagramMedia:MediaAsset;instagramText:string;giftTitle:string;giftMessage:string;pageEyebrow:string;pageTitle:string;pageMessage:string;ctaText:string;accentColor:string}){
  const [screen,setScreen]=useState<"entry"|"gift"|"instagram">("entry");
  return <div className="preview-stack"><div className="preview-tabs"><button className={screen==="entry"?"active":""} onClick={()=>setScreen("entry")}>1. Entrada</button><button className={screen==="gift"?"active":""} onClick={()=>setScreen("gift")}>2. Presente</button><button className={screen==="instagram"?"active":""} onClick={()=>setScreen("instagram")}>3. Instagram</button></div><div className="phone-preview"><div className="phone-bar"><i/><i/><i/></div>{screen==="entry"&&<div className="phone-body phone-body-media"><Media asset={eventMedia} className="phone-event-media"/><small>{pageEyebrow}</small><h2>{pageTitle}</h2><p>{pageMessage}</p><button style={{background:accentColor}}>{ctaText} →</button><div className="phone-count">♡ 847 pessoas já receberam</div></div>}{screen==="gift"&&<div className="phone-body phone-gift-preview"><small>UM PRESENTE PARA VOCÊ</small><h2>{giftTitle}</h2><Media asset={giftMedia} className="phone-gift-media"/><p>{giftMessage}</p><button style={{background:accentColor}}>Baixar meu presente ↓</button></div>}{screen==="instagram"&&<div className="phone-body phone-instagram-preview"><div><Media asset={instagramMedia}/><strong>{instagramText||"Eu fui!"}</strong><em>{pageTitle}</em><span>QRECORDE • PRESENTE DIGITAL</span></div><p>Figurinha transparente para colar sobre uma foto de fundo no Story.</p></div>}</div></div>;
}

function PageEditor({ eventMedia, giftMedia, instagramMedia, instagramText, giftTitle, giftMessage, pageEyebrow, pageTitle, pageMessage, ctaText, publicSlug, publicUrl, isPublished, accentColor, saveState, onEventMedia, onGiftMedia, onInstagramMedia, onInstagramText, onGiftTitle, onGiftMessage, onPageEyebrow, onPageTitle, onPageMessage, onCtaText, onPublicSlug, onAccentColor }: { eventMedia: MediaAsset; giftMedia: MediaAsset; instagramMedia:MediaAsset; instagramText:string; giftTitle: string; giftMessage: string; pageEyebrow: string; pageTitle: string; pageMessage: string; ctaText: string; publicSlug:string; publicUrl:string; isPublished:boolean; accentColor:string; saveState:string; onEventMedia: (asset: MediaAsset) => void; onGiftMedia: (asset: MediaAsset) => void; onInstagramMedia:(asset:MediaAsset)=>void; onInstagramText:(value:string)=>void; onGiftTitle: (value: string) => void; onGiftMessage: (value: string) => void; onPageEyebrow: (value: string) => void; onPageTitle: (value: string) => void; onPageMessage: (value: string) => void; onCtaText: (value: string) => void; onPublicSlug:(value:string)=>void; onAccentColor:(value:string)=>void }) {
  return <div className="editor-layout editor-media-layout" style={{"--accent":accentColor} as React.CSSProperties}>
    <section className="editor-controls"><span className="kicker">PERSONALIZAÇÃO</span><h1>Sua página,<br/>do seu jeito.</h1><p>Edite toda a experiência que o visitante verá antes e depois de abrir o presente.</p>
      <div className="editor-section-title"><span>01</span><div><b>Página de entrada</b><small>Textos exibidos antes de abrir o presente</small></div></div><div className="page-copy-fields"><label>Data e local<input value={pageEyebrow} onChange={e => onPageEyebrow(e.target.value)} /></label><label>Título da página<input value={pageTitle} onChange={e => onPageTitle(e.target.value)} /></label><label className="wide">Mensagem da página<textarea value={pageMessage} onChange={e => onPageMessage(e.target.value)} /></label><label>Texto do botão<input value={ctaText} onChange={e => onCtaText(e.target.value)} /></label></div><div className="public-address-field"><div><span className={isPublished?"published":"draft"}>{isPublished?"● Publicada":"○ Rascunho"}</span><b>Endereço público</b></div><label><span>/p/</span><input value={publicSlug} onChange={e=>onPublicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/-{2,}/g,"-"))} onBlur={()=>onPublicSlug(publicSlug.replace(/^-+|-+$/g,""))} placeholder="minha-pagina"/></label>{isPublished?<div className="published-link"><a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a><button type="button" onClick={()=>navigator.clipboard?.writeText(publicUrl)}>Copiar link</button></div>:<small>O link ficará disponível para visitantes depois da publicação.</small>}{isPublished&&<small className="slug-warning">Ao alterar este endereço, QR Codes já impressos com o link anterior deixarão de funcionar.</small>}</div>
      <div className="editor-section-title"><span>02</span><div><b>Presente digital</b><small>Conteúdo revelado depois do clique</small></div></div><div className="gift-copy-fields"><label>Título do presente<input value={giftTitle} onChange={e => onGiftTitle(e.target.value)} placeholder="Uma bênção para você" /></label><label>Mensagem do presente<textarea value={giftMessage} onChange={e => onGiftMessage(e.target.value)} placeholder="Escreva uma mensagem especial..." /></label></div>
      <div className="media-fields"><label className="upload-field"><span><b>Imagem da página</b><small>Banner ou arte de apresentação</small></span><Media asset={eventMedia} className="upload-thumb"/><em>Trocar imagem</em><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && onEventMedia(fileToAsset(e.target.files[0]))}/></label><label className="upload-field"><span><b>Imagem do presente</b><small>Imagem exibida ao abrir</small></span><Media asset={giftMedia} className="upload-thumb"/><em>Trocar imagem</em><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && onGiftMedia(fileToAsset(e.target.files[0]))}/></label></div>
      <div className="editor-section-title"><span>03</span><div><b>Figurinha para Instagram</b><small>A frase se adapta automaticamente sem cobrir a imagem</small></div></div><div className="instagram-fields"><label>Frase personalizada<input value={instagramText} maxLength={80} onChange={e=>onInstagramText(e.target.value)} placeholder="Ex.: Eu fui!"/><small className="field-hint">Até 80 caracteres • tamanho e quebra ajustados automaticamente</small></label><label className="upload-field"><span><b>Imagem da figurinha</b><small>Prefira PNG com fundo transparente</small></span><Media asset={instagramMedia} className="upload-thumb"/><em>Trocar imagem</em><input type="file" accept="image/png,image/webp" onChange={e=>e.target.files?.[0]&&onInstagramMedia(fileToAsset(e.target.files[0]))}/></label></div>
      <label>Cor de destaque<AccentPicker value={accentColor} onChange={onAccentColor}/></label><div className="autosave-note"><span>✓</span>{saveState === "Salvando..." ? "Salvando suas alterações…" : "Todas as alterações foram salvas"}</div>
    </section><EditorPreview eventMedia={eventMedia} giftMedia={giftMedia} instagramMedia={instagramMedia} instagramText={instagramText} giftTitle={giftTitle} giftMessage={giftMessage} pageEyebrow={pageEyebrow} pageTitle={pageTitle} pageMessage={pageMessage} ctaText={ctaText} accentColor={accentColor}/>
  </div>;
}

function AccentPicker({ value, onChange }: { value:string; onChange:(value:string)=>void }) {
  const palette=[{name:"Violeta",value:"#6b29d9"},{name:"Dourado",value:"#b47a1f"},{name:"Azul",value:"#276ca7"},{name:"Verde",value:"#2f855a"}];
  return <div className="colors">{palette.map(color=><button type="button" style={{background:color.value}} className={value===color.value?"selected":""} aria-label={color.name} aria-pressed={value===color.value} onClick={()=>onChange(color.value)} key={color.value}/>)}</div>;
}

function Onboarding({ userName, onComplete, onExit }: { userName:string; onComplete:(data:{name:string;eyebrow:string;accentColor:string})=>Promise<void>; onExit?:()=>void }) {
  const [step,setStep]=useState(0); const [name,setName]=useState(""); const [eyebrow,setEyebrow]=useState(""); const [accentColor,setAccentColor]=useState("#6b29d9"); const [busy,setBusy]=useState(false);
  const firstName=userName.trim().split(/\s+/)[0]||"Olá";
  const finish=async()=>{setBusy(true);await onComplete({name:name.trim()||"Meu presente digital",eyebrow:eyebrow.trim(),accentColor});setBusy(false);};
  return <div className="onboarding-shell" style={{"--accent":accentColor} as React.CSSProperties}><header><div className="brand"><span className="brand-gem">◆</span><span>QR</span><b>ecorde</b></div><span>Etapa {step+1} de 3</span>{onExit?<button onClick={onExit}>Fechar</button>:<i/>}</header><div className="onboarding-progress"><i style={{width:`${(step+1)*33.333}%`}}/></div><main><section className="onboarding-copy"><span className="kicker">{step===0?`BEM-VINDO, ${firstName.toUpperCase()}`:step===1?"DÊ VIDA À IDEIA":"SUA IDENTIDADE"}</span><h1>{step===0?<>Vamos criar sua primeira<br/><em>experiência memorável.</em></>:step===1?<>Qual lembrança você<br/><em>quer compartilhar?</em></>:<>Escolha a cor que vai<br/><em>marcar este momento.</em></>}</h1><p>{step===0?"Em poucos passos, sua página estará pronta para receber fotos, mensagens e o presente que será revelado pelo QR Code.":step===1?"Use um nome que você reconheça facilmente no painel. Depois, ele poderá virar o título público da página.":"Você poderá mudar tudo depois. Esta escolha já deixa a primeira versão com a sua cara."}</p></section><section className="onboarding-card">{step===0&&<><div className="onboarding-preview"><span>01</span><div><b>Crie a página</b><small>Nome, mensagem e identidade</small></div></div><div className="onboarding-preview"><span>02</span><div><b>Adicione o presente</b><small>Imagem ou lembrança digital</small></div></div><div className="onboarding-preview"><span>03</span><div><b>Publique o QR Code</b><small>Compartilhe e acompanhe</small></div></div></>}{step===1&&<><label>Nome da página<input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Aniversário da Clara" maxLength={80}/></label><label>Data, local ou ocasião <input value={eyebrow} onChange={e=>setEyebrow(e.target.value)} placeholder="Ex.: 24 de setembro • São Paulo" maxLength={100}/></label><div className="name-example"><span style={{background:accentColor}}>{(name||"MP").slice(0,2).toUpperCase()}</span><div><small>PRÉVIA NO PAINEL</small><b>{name||"Minha página especial"}</b></div></div></>}{step===2&&<><AccentPicker value={accentColor} onChange={setAccentColor}/><div className="accent-preview"><span>UMA LEMBRANÇA PARA VOCÊ</span><h2>{name||"Minha página especial"}</h2><p>Uma experiência feita para guardar e compartilhar.</p><button style={{background:accentColor}}>Abrir meu presente →</button></div></>}<footer><button className="onboarding-back" disabled={step===0} onClick={()=>setStep(s=>s-1)}>← Voltar</button>{step<2?<button className="primary-btn" disabled={step===1&&!name.trim()} onClick={()=>setStep(s=>s+1)}>Continuar →</button>:<button className="primary-btn" disabled={busy} onClick={finish}>{busy?"Criando…":"Criar minha página →"}</button>}</footer></section></main></div>;
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
  const [instagramMedia, setInstagramMedia] = useState<MediaAsset>({ src: "/padre-eustaquio-sticker.png", type: "image", name: "Figurinha para Instagram" });
  const [instagramText, setInstagramText] = useState("Eu fui!");
  const [giftTitle, setGiftTitle] = useState("Que esta bênção acompanhe o seu caminho.");
  const [giftMessage, setGiftMessage] = useState("Uma lembrança especial dos 20 anos de beatificação do Padre Eustáquio, oferecida com carinho pelos parceiros desta festa.");
  const [pageEyebrow, setPageEyebrow] = useState("23 a 30 de agosto • Belo Horizonte");
  const [pageTitle, setPageTitle] = useState("Festa do Beato Padre Eustáquio");
  const [publicSlug, setPublicSlug] = useState("presente");
  const [pageMessage, setPageMessage] = useState("Você chegou até aqui porque alguém preparou um carinho especial. Abra agora o presente digital desta celebração.");
  const [ctaText, setCtaText] = useState("Abrir meu presente");
  const [accentColor, setAccentColor] = useState("#6b29d9");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sponsors, setSponsors] = useState<SponsorSummary[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [eventHydrated, setEventHydrated] = useState(false);
  const [saveState, setSaveState] = useState("Salvo");
  const [analytics, setAnalytics] = useState<AnalyticsData|null>(null);
  const [qrCodes, setQrCodes] = useState<QrSummary[]>([]);
  const title = useMemo(() => nav.find(n => n.id === view)?.label, [view]);
  const activeEvent = events.find(event => event.id === activeEventId);
  const publicUrl = typeof window === "undefined" ? `/p/${publicSlug}` : `${window.location.origin}/p/${publicSlug}`;
  useEffect(()=>{if(activeEvent?.slug)setPublicSlug(activeEvent.slug);},[activeEvent?.slug]);
  useEffect(()=>{if(!sessionQuery.data?.user)return;fetch("/api/events").then(r=>r.json()).then((items:EventSummary[])=>{setEvents(items);setActiveEventId(items[0]?.id||null);setShowOnboarding(items.length===0);setEventsLoaded(true);}).catch(()=>setEventsLoaded(true));},[sessionQuery.data?.user]);
  useEffect(()=>{if(!activeEventId)return;setEventHydrated(false);fetch(`/api/events/${activeEventId}`).then(r=>r.json()).then(data=>{setPageTitle(data.pageTitle||data.name);setPageEyebrow(data.eyebrow||"");setPageMessage(data.pageMessage||"");setCtaText(data.ctaText||"Abrir meu presente");setGiftTitle(data.giftTitle||"Um presente para você");setGiftMessage(data.giftMessage||"");setInstagramText(data.instagramText||"Eu fui!");setAccentColor(data.accentColor||"#6b29d9");setEventMedia(data.coverImageKey?{src:`/media/${data.coverImageKey}`,type:"image",name:"Imagem da página"}:{src:"/padre-eustaquio-2026.jpg",type:"image",name:"Imagem de exemplo"});setGiftMedia(data.giftImageKey?{src:`/media/${data.giftImageKey}`,type:"image",name:"Imagem do presente"}:{src:"/presente-padre-eustaquio.png",type:"image",name:"Presente de exemplo"});setInstagramMedia(data.instagramImageKey?{src:`/media/${data.instagramImageKey}`,type:"image",name:"Imagem do Instagram"}:{src:"/padre-eustaquio-sticker.png",type:"image",name:"Figurinha para Instagram"});const loadedSponsors=(data.sponsors||[]).map((item:SponsorSummary)=>({...item,logoUrl:item.logoKey?`/media/${item.logoKey}`:null}));setSponsors(loadedSponsors);setEventHydrated(true);});},[activeEventId]);
  useEffect(()=>{if(!activeEventId||!eventHydrated)return;setSaveState("Salvando...");const timer=setTimeout(async()=>{const response=await fetch(`/api/events/${activeEventId}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({name:pageTitle,pageTitle,pageMessage,eyebrow:pageEyebrow,ctaText,giftTitle,giftMessage,instagramText,accentColor,slug:publicSlug})});const result=await response.json();if(!response.ok){setSaveState(result.error||"Erro ao salvar");return;}const savedSlug=result.slug||publicSlug;setSaveState("Salvo");setEvents(current=>current.map(item=>item.id===activeEventId?{...item,name:pageTitle,pageTitle,slug:savedSlug}:item));},650);return()=>clearTimeout(timer);},[activeEventId,eventHydrated,pageTitle,pageMessage,pageEyebrow,ctaText,giftTitle,giftMessage,instagramText,accentColor,publicSlug]);
  useEffect(()=>{if(!activeEventId)return;Promise.all([fetch(`/api/events/${activeEventId}/analytics`).then(r=>r.json()),fetch(`/api/events/${activeEventId}/qr`).then(r=>r.json())]).then(([metrics,codes])=>{setAnalytics(metrics?.totals?metrics:null);setQrCodes(Array.isArray(codes)?codes:[]);});},[activeEventId]);
  const createEvent=async(data?:{name:string;eyebrow:string;accentColor:string})=>{const name=data?.name||"Novo presente digital";const response=await fetch("/api/events",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name,eyebrow:data?.eyebrow||"",accentColor:data?.accentColor||"#6b29d9"})});const created=await response.json();if(response.ok){setEvents(current=>[created,...current]);setActiveEventId(created.id);setShowOnboarding(false);setView("page");}};
  const startNewEvent=()=>setShowOnboarding(true);
  const selectEvent=(id:string,edit=false)=>{setActiveEventId(id);setView(edit?"page":"dashboard");};
  const deleteEvent=async(item:EventSummary)=>{if(!window.confirm(`Excluir “${item.pageTitle||item.name}”? Esta ação não pode ser desfeita.`))return;const response=await fetch(`/api/events/${item.id}`,{method:"DELETE"});if(!response.ok)return;const remaining=events.filter(event=>event.id!==item.id);setEvents(remaining);if(activeEventId===item.id)setActiveEventId(remaining[0]?.id||null);if(!remaining.length)setShowOnboarding(true);};
  const createQr=async()=>{if(!activeEventId)return;const name=window.prompt("Nome do QR Code",`QR Code ${qrCodes.length+1}`)?.trim();if(!name)return;const response=await fetch(`/api/events/${activeEventId}/qr`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name})});const item=await response.json();if(response.ok)setQrCodes(current=>[item,...current]);};
  const renameQr=async(item:QrSummary)=>{if(!activeEventId)return;const name=window.prompt("Novo nome do QR Code",item.name)?.trim();if(!name||name===item.name)return;const response=await fetch(`/api/events/${activeEventId}/qr/${item.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({name})});const changed=await response.json();if(response.ok)setQrCodes(current=>current.map(qr=>qr.id===item.id?{...qr,...changed}:qr));};
  const removeQr=async(item:QrSummary)=>{if(!activeEventId||!window.confirm(`Excluir “${item.name}”?`))return;const response=await fetch(`/api/events/${activeEventId}/qr/${item.id}`,{method:"DELETE"});if(response.ok)setQrCodes(current=>current.filter(qr=>qr.id!==item.id));};
  const publishEvent=async()=>{if(!activeEventId)return;const response=await fetch(`/api/events/${activeEventId}/publish`,{method:"POST"});const result=await response.json();if(response.ok){setEvents(current=>current.map(item=>item.id===activeEventId?{...item,status:"published"}:item));navigator.clipboard?.writeText(`${window.location.origin}${result.url}`);alert(`Publicado! Link copiado: ${window.location.origin}${result.url}`);}};
  const persistMedia=async(kind:"cover"|"gift"|"instagram",asset:MediaAsset)=>{if(kind==="cover")setEventMedia(asset);else if(kind==="gift")setGiftMedia(asset);else setInstagramMedia(asset);if(!activeEventId||!asset.file)return;const form=new FormData();form.set("kind",kind);form.set("file",asset.file);const response=await fetch(`/api/events/${activeEventId}/media`,{method:"POST",body:form});const result=await response.json();if(response.ok){const saved={src:result.url,type:"image" as const,name:asset.name};if(kind==="cover")setEventMedia(saved);else if(kind==="gift")setGiftMedia(saved);else setInstagramMedia(saved);}};
  const addSponsor=async()=>{if(!activeEventId)return;const response=await fetch(`/api/events/${activeEventId}/sponsors`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:"Novo patrocinador",tier:sponsors.length?"sponsor":"master"})});const item=await response.json();if(response.ok)setSponsors(current=>[...current,{id:item.id,name:"Novo patrocinador",tier:sponsors.length?"sponsor":"master",tagline:""}]);};
  const changeSponsor=(changed:SponsorSummary)=>{setSponsors(current=>current.map(item=>item.id===changed.id?changed:item));if(activeEventId)fetch(`/api/events/${activeEventId}/sponsors/${changed.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(changed)});};
  const uploadSponsor=async(id:string,file:File)=>{if(!activeEventId)return;const form=new FormData();form.set("file",file);const response=await fetch(`/api/events/${activeEventId}/sponsors/${id}`,{method:"POST",body:form});const result=await response.json();if(response.ok)setSponsors(current=>current.map(item=>item.id===id?{...item,logoKey:result.key,logoUrl:result.url}:item));};
  const deleteSponsor=async(id:string)=>{if(!activeEventId)return;await fetch(`/api/events/${activeEventId}/sponsors/${id}`,{method:"DELETE"});setSponsors(current=>current.filter(item=>item.id!==id));};
  if(sessionQuery.isPending)return <div className="app-loading"><span className="brand-gem">◆</span><p>Preparando a QRecorde...</p></div>;
  if(!sessionQuery.data?.user)return <AuthScreen/>;
  if(showOnboarding)return <Onboarding userName={sessionQuery.data.user.name} onComplete={createEvent} onExit={events.length?()=>setShowOnboarding(false):undefined}/>;
  if(eventsLoaded&&!activeEventId)return <Onboarding userName={sessionQuery.data.user.name} onComplete={createEvent}/>;
  if (publicMode) return <div><button className="back-dashboard" onClick={() => setPublicMode(false)}>← Voltar ao painel</button><PublicPage eventMedia={eventMedia} giftMedia={giftMedia} instagramMedia={instagramMedia} instagramText={instagramText} sponsorMedia={sponsors.map(item=>item.logoUrl?{src:item.logoUrl,type:"image",name:item.name}:null)} sponsorNames={sponsors.map(item=>item.name)} giftTitle={giftTitle} giftMessage={giftMessage} pageEyebrow={pageEyebrow} pageTitle={pageTitle} pageMessage={pageMessage} ctaText={ctaText} accentColor={accentColor}/></div>;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-gem">◆</span><span>QR</span><b>ecorde</b></div>
      <div className="event-switch"><span style={{background:accentColor}}>{pageTitle.slice(0,2).toUpperCase()}</span><div><select aria-label="Selecionar presente" value={activeEventId||""} onChange={e=>setActiveEventId(e.target.value)}>{events.map(event=><option value={event.id} key={event.id}>{event.pageTitle||event.name}</option>)}</select><small>{events.find(e=>e.id===activeEventId)?.status==="published"?"Publicado":saveState}</small></div><button onClick={startNewEvent} aria-label="Nova página">＋</button></div>
      <nav aria-label="Navegação principal">{nav.map(n=><button key={n.id} className={view===n.id?"active":""} onClick={()=>setView(n.id)}><Icon>{n.icon}</Icon>{n.label}</button>)}</nav>
      <div className="sidebar-bottom"><button><Icon>⚙</Icon>Configurações</button><div className="help-card"><span>?</span><b>Precisa de ajuda?</b><p>Fale com nosso time.</p><button>Conversar agora</button></div><div className="user-card"><span>{sessionQuery.data.user.name.slice(0,2).toUpperCase()}</span><div><b>{sessionQuery.data.user.name}</b><small>{sessionQuery.data.user.email}</small></div><button onClick={()=>authClient.signOut()} aria-label="Sair">↗</button></div></div>
    </aside>
    <main className="main-content"><header className="topbar"><div className="mobile-brand brand"><span className="brand-gem">◆</span><span>QR</span><b>ecorde</b></div><span className="crumb">QRecorde <b>/</b> {title}</span><div className="top-actions"><span className={`top-status ${activeEvent?.status||"draft"}`}>{activeEvent?.status==="published"?"● Publicada":"○ Rascunho"}</span>{activeEvent?.status==="published"&&<a className="top-public-link" href={publicUrl} target="_blank" rel="noreferrer">Abrir link ↗</a>}<button className="publish-btn" onClick={publishEvent}>{activeEvent?.status==="published"?"Atualizar publicação":"Publicar"}</button><button className="preview-btn" onClick={()=>setPublicMode(true)}>Visualizar página <span>↗</span></button></div></header><div className="content-wrap">{view==="dashboard"&&<Dashboard publicUrl={publicUrl} userName={sessionQuery.data.user.name} eventName={pageTitle} analytics={analytics} qrScans={qrCodes.reduce((sum,item)=>sum+Number(item.scans),0)} onManage={()=>setView("pages")}/>} {view==="pages"&&<PagesManager events={events} activeId={activeEventId} onSelect={selectEvent} onCreate={startNewEvent} onDelete={deleteEvent}/>} {view==="page"&&<PageEditor eventMedia={eventMedia} giftMedia={giftMedia} instagramMedia={instagramMedia} instagramText={instagramText} giftTitle={giftTitle} giftMessage={giftMessage} pageEyebrow={pageEyebrow} pageTitle={pageTitle} pageMessage={pageMessage} ctaText={ctaText} publicSlug={publicSlug} publicUrl={publicUrl} isPublished={activeEvent?.status==="published"} accentColor={accentColor} saveState={saveState} onEventMedia={a=>persistMedia("cover",a)} onGiftMedia={a=>persistMedia("gift",a)} onInstagramMedia={a=>persistMedia("instagram",a)} onInstagramText={setInstagramText} onGiftTitle={setGiftTitle} onGiftMessage={setGiftMessage} onPageEyebrow={setPageEyebrow} onPageTitle={setPageTitle} onPageMessage={setPageMessage} onCtaText={setCtaText} onPublicSlug={setPublicSlug} onAccentColor={setAccentColor}/>} {view==="qrcodes"&&<QrDashboard publicUrl={publicUrl} eventName={pageTitle} items={qrCodes} onCreate={createQr} onRename={renameQr} onDelete={removeQr}/>} {view==="sponsors"&&<Sponsors items={sponsors} onAdd={addSponsor} onMedia={uploadSponsor} onChange={changeSponsor} onDelete={deleteSponsor}/>}</div></main>
  </div>;
}
