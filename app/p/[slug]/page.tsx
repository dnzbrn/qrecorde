import type { Metadata } from "next";
import { headers } from "next/headers";
import { PublicPage } from "../../page";
import { getPublicEvent } from "../../../lib/public-event";
import { eventMetadata, socialOrigin } from "../../../lib/social-metadata";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const incoming = await headers();
  return eventMetadata(await getPublicEvent(slug), socialOrigin(incoming.get("host")));
}
export default async function PublishedGiftPage({ params }: Props) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) return <main className="published-state"><span className="brand-gem">◆</span><h1>Este presente ainda não está disponível.</h1><p>Confira o endereço ou fale com a organização do evento.</p></main>;

  const media = (key: string | null | undefined, fallback: string, name: string) => ({ src: key ? `/media/${key}` : fallback, type: "image" as const, name });
  return <PublicPage
    eventName={event.name}
    eventMedia={media(event.coverImageKey, "/padre-eustaquio-2026.jpg", event.name)}
    giftMedia={media(event.giftImageKey, "/presente-padre-eustaquio.png", event.giftTitle)}
    instagramMedia={media(event.instagramImageKey, "/padre-eustaquio-sticker.png", "Figurinha para Instagram")}
    instagramText={event.instagramText || "Eu fui!"}
    instagramLayout={event.instagramLayout || "editorial"}
    sponsorMedia={event.sponsors.map(sponsor => sponsor.logoKey ? media(sponsor.logoKey, "", sponsor.name) : null)}
    sponsorNames={event.sponsors.map(sponsor => sponsor.name)}
    sponsorTiers={event.sponsors.map(sponsor => sponsor.tier)}
    giftTitle={event.giftTitle}
    giftMessage={event.giftMessage}
    pageEyebrow={event.eyebrow}
    pageTitle={event.pageTitle}
    pageMessage={event.pageMessage}
    ctaText={event.ctaText}
    accentColor={event.accentColor}
    trackingSlug={event.slug}
  />;
}
