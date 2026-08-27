import type { Metadata } from 'next';
import type { PublicEvent } from './public-event';

const productionHosts = new Set(['qrecorde.com.br', 'www.qrecorde.com.br', 'qrecorde.brunonevesdiniz.workers.dev', 'qrecorde.brunonevesdiniz.chatgpt.site']);
export function socialOrigin(host: string | null) {
  if (host && productionHosts.has(host.toLowerCase())) return `https://${host.toLowerCase()}`;
  if (host && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return `http://${host}`;
  return 'https://qrecorde.brunonevesdiniz.workers.dev';
}
export function eventMetadata(event: PublicEvent | null, origin: string): Metadata {
  if (!event) return { title: 'Presente indisponível | QRecorde', description: 'Este presente ainda não está disponível.', robots: {index:false,follow:false}, openGraph: {title:'Presente indisponível | QRecorde',description:'Este presente ainda não está disponível.',images:[]}, twitter:{card:'summary',title:'Presente indisponível | QRecorde',description:'Este presente ainda não está disponível.',images:[]} };
  const title = `${event.pageTitle || event.name} | QRecorde`;
  const description = event.pageMessage || event.giftMessage || `Receba o presente digital de ${event.name}.`;
  const url = `${origin}/p/${encodeURIComponent(event.slug)}`;
  const images = event.coverImageKey ? [{url:`${origin}/media/${event.coverImageKey.split('/').map(encodeURIComponent).join('/')}`,alt:event.name}] : [];
  return { title, description, alternates:{canonical:url}, openGraph:{title,description,url,siteName:'QRecorde',locale:'pt_BR',type:'website',images}, twitter:{card:images.length?'summary_large_image':'summary',title,description,images} };
}
