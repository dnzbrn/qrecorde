"use client";

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { printQrOptions, qrFilename, trackedQrUrl } from '../lib/qr-export';

type QrAsset = { file: File; src: string; target: string };
export function QrExportActions({ url, eventName, campaignName = 'Principal' }: { url: string; eventName: string; campaignName?: string }) {
  const [open, setOpen] = useState(false);
  const [asset, setAsset] = useState<QrAsset | null>(null);
  const [note, setNote] = useState('');
  const [sharing, setSharing] = useState(false);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setAsset(null); setNote('');
    const prepare = async () => {
      try {
        const target = trackedQrUrl(url, window.location.origin);
        const src = await QRCode.toDataURL(target, printQrOptions);
        const blob = await (await fetch(src)).blob();
        if (!cancelled) setAsset({ src, target, file: new File([blob], qrFilename(`${eventName}-${campaignName}`), { type: 'image/png' }) });
      } catch { if (!cancelled) setNote('Não foi possível preparar o QR Code. Feche e tente novamente.'); }
    };
    void prepare();
    return () => { cancelled = true; };
  }, [open, url, eventName, campaignName]);
  const download = () => {
    if (!asset) return;
    const link = document.createElement('a');
    link.href = asset.src; link.download = asset.file.name;
    document.body.appendChild(link); link.click(); link.remove();
    setNote('PNG baixado em alta resolução. Você pode enviá-lo para impressão.');
  };
  const share = async () => {
    if (!asset) return;
    setNote(''); setSharing(true);
    try {
      if (!navigator.canShare?.({ files: [asset.file] }) || !navigator.share) { download(); return; }
      await navigator.share({ files: [asset.file], title: `${eventName} — ${campaignName}` });
      setNote('QR Code compartilhado.');
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) setNote('Não foi possível compartilhar. Use “Baixar PNG” para enviar o arquivo.');
    } finally { setSharing(false); }
  };
  const print = () => {
    if (!asset) return;
    const popup = window.open('', '_blank', 'width=800,height=900');
    if (!popup) { setNote('Permita a abertura da janela de impressão ou baixe o PNG.'); return; }
    popup.opener = null;
    const doc = popup.document;
    doc.title = `${eventName} — QR Code ${campaignName}`;
    doc.documentElement.lang = 'pt-BR';
    const style = doc.createElement('style');
    style.textContent = '@page{size:A4 portrait;margin:20mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#000;background:#fff;margin:0;padding:30px;text-align:center}main{max-width:170mm;margin:0 auto}h1{font-size:26px;overflow-wrap:anywhere}h2{font-size:18px;font-weight:400;overflow-wrap:anywhere}img{display:block;width:120mm;height:120mm;max-width:100%;object-fit:contain;margin:12mm auto}p{font-size:15px;line-height:1.5;overflow-wrap:anywhere}.source{font-size:10px}button{padding:12px 20px;cursor:pointer;margin-bottom:24px}@media print{body{padding:0}button{display:none}main{break-inside:avoid}}';
    doc.head.appendChild(style);
    const button = doc.createElement('button');
    button.textContent = 'Imprimir / Salvar como PDF';
    button.disabled = true;
    button.onclick = () => { popup.focus(); popup.print(); };
    doc.body.appendChild(button);
    const main = doc.createElement('main'); doc.body.appendChild(main);
    const text = (tag: string, content: string, className = '') => { const element = doc.createElement(tag); element.textContent = content; element.className = className; main.appendChild(element); };
    text('h1', eventName); text('h2', campaignName);
    const image = doc.createElement('img');
    image.alt = `QR Code para ${eventName}`;
    image.onload = () => { button.disabled = false; popup.focus(); popup.print(); };
    image.onerror = () => { text('p', 'Não foi possível carregar a imagem. Feche esta janela e tente novamente.'); };
    main.appendChild(image); image.src = asset.src;
    text('p', 'Aponte a câmera do celular e abra seu presente.');
    text('p', asset.target, 'source');
    setNote('Janela de impressão aberta. Você também pode salvar como PDF.');
  };
  return <div className="qr-export">
    <button type="button" className="qr-export-toggle" aria-expanded={open} onClick={() => setOpen(value => !value)}>Compartilhar / imprimir QR Code ↗</button>
    {open && <div className="qr-export-options">
      <p>QR Code preto sobre branco, com margem de segurança e PNG de aproximadamente 2048 × 2048 px. O rastreamento da campanha é preservado.</p>
      {!asset && !note && <p role="status">Preparando arquivo…</p>}
      <div className="qr-export-buttons"><button type="button" disabled={!asset || sharing} onClick={share}>{sharing ? 'Compartilhando…' : 'Compartilhar PNG'}</button><button type="button" disabled={!asset} onClick={download}>Baixar PNG ↓</button><button type="button" disabled={!asset} onClick={print}>Imprimir / PDF</button></div>
      <small>Se o navegador não permitir compartilhar arquivos, o PNG será baixado. Publique a página antes de distribuir o QR Code.</small>
      <p role="status">{note}</p>
    </div>}
  </div>;
}
