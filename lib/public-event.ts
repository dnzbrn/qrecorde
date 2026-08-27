import { cache } from 'react';
import { runtimeEnv } from './server';

export type PublicEvent = {
  id: string; slug: string; name: string; eyebrow: string; pageTitle: string; pageMessage: string;
  ctaText: string; giftTitle: string; giftMessage: string; accentColor: string;
  coverImageKey: string | null; giftImageKey: string | null; instagramImageKey: string | null;
  instagramText: string; instagramLayout: 'classic' | 'editorial' | 'celebration';
  sponsors: Array<{ name: string; tier: string; tagline: string; logoKey: string | null; position: number }>;
};
export const getPublicEvent = cache(async (slug: string): Promise<PublicEvent | null> => {
  const event = await runtimeEnv.DB.prepare("SELECT id,slug,name,eyebrow,page_title as pageTitle,page_message as pageMessage,cta_text as ctaText,gift_title as giftTitle,gift_message as giftMessage,accent_color as accentColor,cover_image_key as coverImageKey,gift_image_key as giftImageKey,instagram_image_key as instagramImageKey,instagram_text as instagramText,instagram_layout as instagramLayout FROM events WHERE slug=? AND status='published'").bind(slug).first<Omit<PublicEvent, 'sponsors'>>();
  if (!event) return null;
  const sponsors = await runtimeEnv.DB.prepare("SELECT name,tier,tagline,logo_key as logoKey,position FROM sponsors WHERE event_id=? ORDER BY CASE tier WHEN 'master' THEN 0 WHEN 'gold' THEN 1 WHEN 'sponsor' THEN 1 ELSE 2 END,position").bind(event.id).all<PublicEvent['sponsors'][number]>();
  return { ...event, sponsors: sponsors.results };
});
