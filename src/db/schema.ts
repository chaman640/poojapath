/**
 * Pooja Path — Database schema (Drizzle ORM / PostgreSQL)
 * Har text field ke do version hain: ...En (English) aur ...Hi (Hindi)
 */
import {
  pgTable,
  pgEnum,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  Enums                                                              */
/* ------------------------------------------------------------------ */

export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PERFORMED",
  "VIDEO_SENT",
  "PRASAD_DISPATCHED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "NOT_STARTED",
  "CREATED",
  "CAPTURED",
  "FAILED",
  "REFUNDED",
  "DEMO_SKIPPED",
]);

/**
 * Add-on ka prakaar:
 *  DELIVERY = ghar bhejna padta hai (prasad, mala) → pata zaroori
 *  SERVICE  = mandir me hi ho jata hai (deepdaan, annadaan) → pata nahi chahiye
 */
export const addonKindEnum = pgEnum("addon_kind", ["DELIVERY", "SERVICE"]);

export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type AddonKind = (typeof addonKindEnum.enumValues)[number];

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

/* ------------------------------------------------------------------ */
/*  Admin                                                              */
/* ------------------------------------------------------------------ */

export const adminUsers = pgTable(
  "admin_users",
  {
    id: id(),
    email: varchar("email", { length: 200 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 30 }).notNull().default("admin"),
    isActive: boolean("is_active").notNull().default(true),
    failedAttempts: integer("failed_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    tokenVersion: integer("token_version").notNull().default(1),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("admin_users_email_key").on(t.email)],
);

/* ------------------------------------------------------------------ */
/*  Catalog                                                            */
/* ------------------------------------------------------------------ */

export const categories = pgTable(
  "categories",
  {
    id: id(),
    slug: varchar("slug", { length: 120 }).notNull(),
    nameEn: varchar("name_en", { length: 160 }).notNull(),
    nameHi: varchar("name_hi", { length: 160 }).notNull(),
    icon: varchar("icon", { length: 40 }).notNull().default("om"),
    order: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("categories_slug_key").on(t.slug)],
);

export const temples = pgTable(
  "temples",
  {
    id: id(),
    slug: varchar("slug", { length: 160 }).notNull(),
    nameEn: varchar("name_en", { length: 200 }).notNull(),
    nameHi: varchar("name_hi", { length: 200 }).notNull(),
    cityEn: varchar("city_en", { length: 120 }).notNull(),
    cityHi: varchar("city_hi", { length: 120 }).notNull(),
    stateEn: varchar("state_en", { length: 120 }).notNull(),
    stateHi: varchar("state_hi", { length: 120 }).notNull(),
    aboutEn: text("about_en").notNull().default(""),
    aboutHi: text("about_hi").notNull().default(""),
  },
  (t) => [uniqueIndex("temples_slug_key").on(t.slug)],
);

export const pujas = pgTable(
  "pujas",
  {
    id: id(),
    slug: varchar("slug", { length: 200 }).notNull(),
    titleEn: varchar("title_en", { length: 250 }).notNull(),
    titleHi: varchar("title_hi", { length: 250 }).notNull(),
    subtitleEn: varchar("subtitle_en", { length: 300 }).notNull().default(""),
    subtitleHi: varchar("subtitle_hi", { length: 300 }).notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    descriptionHi: text("description_hi").notNull().default(""),
    benefitsEn: text("benefits_en")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    benefitsHi: text("benefits_hi")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    ritualsEn: text("rituals_en")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    ritualsHi: text("rituals_hi")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    artKey: varchar("art_key", { length: 40 }).notNull().default("om"),
    // Asli photo (Cloudinary). Khaali ho to artKey wali SVG artwork dikhti hai.
    imageUrl: text("image_url"),
    pujaDate: timestamp("puja_date", { withTimezone: true }).notNull(),
    isFeatured: boolean("is_featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    seatsTotal: integer("seats_total"),
    seatsBooked: integer("seats_booked").notNull().default(0),
    order: integer("sort_order").notNull().default(0),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    templeId: text("temple_id").references(() => temples.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("pujas_slug_key").on(t.slug),
    index("pujas_active_date_idx").on(t.isActive, t.pujaDate),
    index("pujas_featured_idx").on(t.isFeatured),
  ],
);

export const packages = pgTable(
  "packages",
  {
    id: id(),
    pujaId: text("puja_id")
      .notNull()
      .references(() => pujas.id, { onDelete: "cascade" }),
    nameEn: varchar("name_en", { length: 160 }).notNull(),
    nameHi: varchar("name_hi", { length: 160 }).notNull(),
    priceInPaise: integer("price_in_paise").notNull(),
    mrpInPaise: integer("mrp_in_paise"),
    maxMembers: integer("max_members").notNull().default(1),
    featuresEn: text("features_en")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    featuresHi: text("features_hi")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    isPopular: boolean("is_popular").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    order: integer("sort_order").notNull().default(0),
  },
  (t) => [index("packages_puja_idx").on(t.pujaId)],
);

/* ------------------------------------------------------------------ */
/*  Add-ons (extra saamaan / seva)                                     */
/* ------------------------------------------------------------------ */

export const addons = pgTable(
  "addons",
  {
    id: id(),
    slug: varchar("slug", { length: 160 }).notNull(),
    nameEn: varchar("name_en", { length: 200 }).notNull(),
    nameHi: varchar("name_hi", { length: 200 }).notNull(),
    descEn: text("desc_en").notNull().default(""),
    descHi: text("desc_hi").notNull().default(""),
    priceInPaise: integer("price_in_paise").notNull(),
    imageUrl: text("image_url"),
    artKey: varchar("art_key", { length: 40 }).notNull().default("kalash"),
    kind: addonKindEnum("kind").notNull().default("SERVICE"),
    isActive: boolean("is_active").notNull().default(true),
    order: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("addons_slug_key").on(t.slug),
    index("addons_active_idx").on(t.isActive, t.order),
  ],
);

/** Kaunsi puja me kaunse add-on dikhein */
export const pujaAddons = pgTable(
  "puja_addons",
  {
    pujaId: text("puja_id")
      .notNull()
      .references(() => pujas.id, { onDelete: "cascade" }),
    addonId: text("addon_id")
      .notNull()
      .references(() => addons.id, { onDelete: "cascade" }),
    order: integer("sort_order").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.pujaId, t.addonId] }),
    index("puja_addons_puja_idx").on(t.pujaId),
  ],
);

/**
 * Booking ke saath chune gaye add-ons.
 * Naam aur price yahan copy karke rakhte hain — agar admin baad me
 * add-on ka daam badle to purani booking ka record nahi badalna chahiye.
 */
export const bookingAddons = pgTable(
  "booking_addons",
  {
    id: id(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    addonId: text("addon_id").references(() => addons.id, {
      onDelete: "set null",
    }),
    nameEn: varchar("name_en", { length: 200 }).notNull(),
    nameHi: varchar("name_hi", { length: 200 }).notNull(),
    priceInPaise: integer("price_in_paise").notNull(),
    quantity: integer("quantity").notNull().default(1),
    kind: addonKindEnum("kind").notNull().default("SERVICE"),
  },
  (t) => [index("booking_addons_booking_idx").on(t.bookingId)],
);

/* ------------------------------------------------------------------ */
/*  Bookings                                                           */
/* ------------------------------------------------------------------ */

export const bookings = pgTable(
  "bookings",
  {
    id: id(),
    bookingCode: varchar("booking_code", { length: 40 }).notNull(),
    pujaId: text("puja_id")
      .notNull()
      .references(() => pujas.id, { onDelete: "restrict" }),
    packageId: text("package_id")
      .notNull()
      .references(() => packages.id, { onDelete: "restrict" }),

    devoteeName: varchar("devotee_name", { length: 120 }).notNull(),
    gotra: varchar("gotra", { length: 80 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 200 }),
    memberNames: text("member_names")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    sankalp: text("sankalp"),

    addressLine: varchar("address_line", { length: 300 }),
    city: varchar("city", { length: 120 }),
    state: varchar("state", { length: 120 }),
    pincode: varchar("pincode", { length: 10 }),

    packageAmountInPaise: integer("package_amount_in_paise").notNull().default(0),
    addonsAmountInPaise: integer("addons_amount_in_paise").notNull().default(0),
    amountInPaise: integer("amount_in_paise").notNull(),
    status: bookingStatusEnum("status").notNull().default("PENDING_PAYMENT"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("NOT_STARTED"),

    // "paytm" | "razorpay" | "none" (demo)
    paymentProvider: varchar("payment_provider", { length: 20 })
      .notNull()
      .default("none"),
    providerOrderId: varchar("provider_order_id", { length: 120 }),
    providerPaymentId: varchar("provider_payment_id", { length: 120 }),

    videoUrl: text("video_url"),
    prasadTracking: varchar("prasad_tracking", { length: 120 }),
    adminNote: text("admin_note"),
    whatsappOptIn: boolean("whatsapp_opt_in").notNull().default(true),
    ipHash: varchar("ip_hash", { length: 64 }),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("bookings_code_key").on(t.bookingCode),
    uniqueIndex("bookings_provider_order_key").on(t.providerOrderId),
    index("bookings_phone_idx").on(t.phone),
    index("bookings_status_idx").on(t.status),
    index("bookings_created_idx").on(t.createdAt),
  ],
);

export const bookingEvents = pgTable(
  "booking_events",
  {
    id: id(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    status: bookingStatusEnum("status").notNull(),
    messageEn: text("message_en").notNull(),
    messageHi: text("message_hi").notNull(),
    notified: boolean("notified").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("booking_events_booking_idx").on(t.bookingId)],
);

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

export const offerings = pgTable(
  "offerings",
  {
    id: id(),
    slug: varchar("slug", { length: 160 }).notNull(),
    titleEn: varchar("title_en", { length: 220 }).notNull(),
    titleHi: varchar("title_hi", { length: 220 }).notNull(),
    descEn: text("desc_en").notNull().default(""),
    descHi: text("desc_hi").notNull().default(""),
    templeNameEn: varchar("temple_name_en", { length: 200 })
      .notNull()
      .default(""),
    templeNameHi: varchar("temple_name_hi", { length: 200 })
      .notNull()
      .default(""),
    priceInPaise: integer("price_in_paise").notNull(),
    artKey: varchar("art_key", { length: 40 }).notNull().default("kalash"),
    isActive: boolean("is_active").notNull().default(true),
    order: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("offerings_slug_key").on(t.slug)],
);

export const products = pgTable(
  "products",
  {
    id: id(),
    slug: varchar("slug", { length: 160 }).notNull(),
    nameEn: varchar("name_en", { length: 200 }).notNull(),
    nameHi: varchar("name_hi", { length: 200 }).notNull(),
    descEn: text("desc_en").notNull().default(""),
    descHi: text("desc_hi").notNull().default(""),
    priceInPaise: integer("price_in_paise").notNull(),
    mrpInPaise: integer("mrp_in_paise"),
    artKey: varchar("art_key", { length: 40 }).notNull().default("rudraksh"),
    groupEn: varchar("group_en", { length: 120 })
      .notNull()
      .default("Puja Samagri"),
    groupHi: varchar("group_hi", { length: 120 })
      .notNull()
      .default("पूजा सामग्री"),
    inStock: boolean("in_stock").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    order: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("products_slug_key").on(t.slug)],
);

export const testimonials = pgTable("testimonials", {
  id: id(),
  name: varchar("name", { length: 120 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  textEn: text("text_en").notNull(),
  textHi: text("text_hi").notNull(),
  rating: integer("rating").notNull().default(5),
  verified: boolean("verified").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("sort_order").notNull().default(0),
});

export const faqs = pgTable("faqs", {
  id: id(),
  questionEn: text("question_en").notNull(),
  questionHi: text("question_hi").notNull(),
  answerEn: text("answer_en").notNull(),
  answerHi: text("answer_hi").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("sort_order").notNull().default(0),
});

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: id(),
    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 200 }),
    subject: varchar("subject", { length: 200 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("contact_read_idx").on(t.isRead, t.createdAt)],
);

/* ------------------------------------------------------------------ */
/*  Relations                                                          */
/* ------------------------------------------------------------------ */

export const pujaRelations = relations(pujas, ({ one, many }) => ({
  category: one(categories, {
    fields: [pujas.categoryId],
    references: [categories.id],
  }),
  temple: one(temples, { fields: [pujas.templeId], references: [temples.id] }),
  packages: many(packages),
  bookings: many(bookings),
  pujaAddons: many(pujaAddons),
}));

export const addonRelations = relations(addons, ({ many }) => ({
  pujaAddons: many(pujaAddons),
}));

export const pujaAddonRelations = relations(pujaAddons, ({ one }) => ({
  puja: one(pujas, { fields: [pujaAddons.pujaId], references: [pujas.id] }),
  addon: one(addons, { fields: [pujaAddons.addonId], references: [addons.id] }),
}));

export const bookingAddonRelations = relations(bookingAddons, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingAddons.bookingId],
    references: [bookings.id],
  }),
  addon: one(addons, { fields: [bookingAddons.addonId], references: [addons.id] }),
}));

export const packageRelations = relations(packages, ({ one, many }) => ({
  puja: one(pujas, { fields: [packages.pujaId], references: [pujas.id] }),
  bookings: many(bookings),
}));

export const bookingRelations = relations(bookings, ({ one, many }) => ({
  puja: one(pujas, { fields: [bookings.pujaId], references: [pujas.id] }),
  package: one(packages, {
    fields: [bookings.packageId],
    references: [packages.id],
  }),
  events: many(bookingEvents),
}));

export const bookingEventRelations = relations(bookingEvents, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingEvents.bookingId],
    references: [bookings.id],
  }),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  pujas: many(pujas),
}));

export const templeRelations = relations(temples, ({ many }) => ({
  pujas: many(pujas),
}));

/* ------------------------------------------------------------------ */
/*  Inferred types                                                     */
/* ------------------------------------------------------------------ */

export type Puja = typeof pujas.$inferSelect;
export type Package = typeof packages.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Temple = typeof temples.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Offering = typeof offerings.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type BookingEvent = typeof bookingEvents.$inferSelect;
export type Addon = typeof addons.$inferSelect;
export type BookingAddon = typeof bookingAddons.$inferSelect;
