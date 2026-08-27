export function trackedQrUrl(url: string, base?: string) {
  const parsed = new URL(url, base);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Link do QR Code inválido.');
  if (!parsed.searchParams.has('utm_source')) parsed.searchParams.set('utm_source', 'qr_principal');
  return parsed.href;
}
export function qrFilename(name: string) {
  return `qr-${name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'evento'}.png`;
}
export const printQrOptions = { width: 2048, margin: 4, color: { dark: '#000000', light: '#ffffff' }, errorCorrectionLevel: 'H' as const };
