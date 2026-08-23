import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(), emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false), image: text("image"), createdAt: integer("createdAt", { mode: "timestamp" }).notNull(), updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});
export const session = sqliteTable("session", {
  id: text("id").primaryKey(), expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(), token: text("token").notNull().unique(), createdAt: integer("createdAt", { mode: "timestamp" }).notNull(), updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(), ipAddress: text("ipAddress"), userAgent: text("userAgent"), userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
}, t => [index("idx_session_user_id").on(t.userId)]);
export const account = sqliteTable("account", {
  id: text("id").primaryKey(), accountId: text("accountId").notNull(), providerId: text("providerId").notNull(), userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }), accessToken: text("accessToken"), refreshToken: text("refreshToken"), idToken: text("idToken"), accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }), refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }), scope: text("scope"), password: text("password"), createdAt: integer("createdAt", { mode: "timestamp" }).notNull(), updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
}, t => [index("idx_account_user_id").on(t.userId)]);
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(), expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(), createdAt: integer("createdAt", { mode: "timestamp" }), updatedAt: integer("updatedAt", { mode: "timestamp" }),
}, t => [index("idx_verification_identifier").on(t.identifier)]);

export const events = sqliteTable("events", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }), slug: text("slug").notNull(), status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"), name: text("name").notNull(), eyebrow: text("eyebrow").notNull().default(""), pageTitle: text("page_title").notNull(), pageMessage: text("page_message").notNull().default(""), ctaText: text("cta_text").notNull().default("Abrir meu presente"), giftTitle: text("gift_title").notNull().default("Um presente para você"), giftMessage: text("gift_message").notNull().default(""), accentColor: text("accent_color").notNull().default("#6b29d9"), coverImageKey: text("cover_image_key"), giftImageKey: text("gift_image_key"), createdAt: integer("created_at", { mode: "timestamp" }).notNull(), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(), publishedAt: integer("published_at", { mode: "timestamp" }),
}, t => [uniqueIndex("idx_events_slug").on(t.slug), index("idx_events_owner_id").on(t.ownerId), index("idx_events_owner_status").on(t.ownerId, t.status)]);

export const sponsors = sqliteTable("sponsors", {
  id: text("id").primaryKey(), eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }), name: text("name").notNull(), tier: text("tier", { enum: ["master", "sponsor", "supporter"] }).notNull().default("sponsor"), tagline: text("tagline").notNull().default(""), logoKey: text("logo_key"), position: integer("position").notNull().default(0), createdAt: integer("created_at", { mode: "timestamp" }).notNull(), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, t => [index("idx_sponsors_event_position").on(t.eventId, t.position)]);

export const qrCodes = sqliteTable("qr_codes", {
  id: text("id").primaryKey(), eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }), name: text("name").notNull(), campaign: text("campaign").notNull(), scans: integer("scans").notNull().default(0), createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, t => [uniqueIndex("idx_qr_event_campaign").on(t.eventId, t.campaign)]);

export const analyticsDaily = sqliteTable("analytics_daily", {
  id: text("id").primaryKey(), eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }), day: text("day").notNull(), source: text("source").notNull().default("direct"), views: integer("views").notNull().default(0), opens: integer("opens").notNull().default(0), downloads: integer("downloads").notNull().default(0), stories: integer("stories").notNull().default(0),
}, t => [uniqueIndex("idx_analytics_event_day_source").on(t.eventId, t.day, t.source)]);
