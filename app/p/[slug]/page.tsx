"use client";

import { use, useEffect, useState } from "react";
import { PublicPage } from "../../page";

type PublicEvent = {
  slug: string;
  name: string;
  eyebrow: string;
  pageTitle: string;
  pageMessage: string;
  ctaText: string;
  giftTitle: string;
  giftMessage: string;
  coverImageKey?: string | null;
  giftImageKey?: string | null;
  sponsors: Array<{ name: string; logoKey?: string | null }>;
};

export default function PublishedGiftPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch(`/api/public/${slug}`)
      .then(async response => {
        if (!response.ok) throw new Error("not-found");
        return response.json();
      })
      .then(setEvent)
      .catch(() => setMissing(true));
  }, [slug]);

  if (missing) return <main className="published-state"><span className="brand-gem">◆</span><h1>Este presente ainda não está disponível.</h1><p>Confira o endereço ou fale com a organização do evento.</p></main>;
  if (!event) return <main className="published-state"><span className="brand-gem">◆</span><p>Preparando seu presente...</p></main>;

  const media = (key: string | null | undefined, fallback: string, name: string) => ({ src: key ? `/media/${key}` : fallback, type: "image" as const, name });
  return <PublicPage
    eventMedia={media(event.coverImageKey, "/padre-eustaquio-2026.jpg", event.name)}
    giftMedia={media(event.giftImageKey, "/presente-padre-eustaquio.png", event.giftTitle)}
    sponsorMedia={event.sponsors.map(sponsor => sponsor.logoKey ? media(sponsor.logoKey, "", sponsor.name) : null)}
    sponsorNames={event.sponsors.map(sponsor => sponsor.name)}
    giftTitle={event.giftTitle}
    giftMessage={event.giftMessage}
    pageEyebrow={event.eyebrow}
    pageTitle={event.pageTitle}
    pageMessage={event.pageMessage}
    ctaText={event.ctaText}
    trackingSlug={event.slug}
  />;
}
