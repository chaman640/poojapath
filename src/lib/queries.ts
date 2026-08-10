import "server-only";
import { and, asc, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bookingEvents,
  bookings,
  categories,
  faqs,
  offerings,
  packages,
  products,
  pujas,
  temples,
  testimonials,
} from "@/db/schema";

export type PujaListItem = Awaited<ReturnType<typeof getUpcomingPujas>>[number];

/** Card listing ke liye puja + temple + sabse sasta package */
export async function getUpcomingPujas(opts?: {
  q?: string;
  category?: string;
  featuredOnly?: boolean;
  limit?: number;
}) {
  const conditions = [eq(pujas.isActive, true)];

  if (opts?.featuredOnly) conditions.push(eq(pujas.isFeatured, true));

  if (opts?.category) {
    conditions.push(eq(categories.slug, opts.category));
  }

  if (opts?.q) {
    const term = `%${opts.q}%`;
    const search = or(
      ilike(pujas.titleEn, term),
      ilike(pujas.titleHi, term),
      ilike(pujas.subtitleEn, term),
      ilike(pujas.subtitleHi, term),
      ilike(temples.nameEn, term),
      ilike(temples.nameHi, term),
      ilike(temples.cityEn, term),
      ilike(temples.cityHi, term),
    );
    if (search) conditions.push(search);
  }

  const rows = await db
    .select({
      id: pujas.id,
      slug: pujas.slug,
      titleEn: pujas.titleEn,
      titleHi: pujas.titleHi,
      subtitleEn: pujas.subtitleEn,
      subtitleHi: pujas.subtitleHi,
      artKey: pujas.artKey,
      pujaDate: pujas.pujaDate,
      isFeatured: pujas.isFeatured,
      seatsTotal: pujas.seatsTotal,
      seatsBooked: pujas.seatsBooked,
      order: pujas.order,
      templeNameEn: temples.nameEn,
      templeNameHi: temples.nameHi,
      templeCityEn: temples.cityEn,
      templeCityHi: temples.cityHi,
      categoryNameEn: categories.nameEn,
      categoryNameHi: categories.nameHi,
      categorySlug: categories.slug,
      minPrice: sql<number>`(
        SELECT MIN(${packages.priceInPaise})
        FROM ${packages}
        WHERE ${packages.pujaId} = ${pujas.id} AND ${packages.isActive} = true
      )`.mapWith(Number),
    })
    .from(pujas)
    .leftJoin(temples, eq(pujas.templeId, temples.id))
    .leftJoin(categories, eq(pujas.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(asc(pujas.pujaDate), asc(pujas.order))
    .limit(opts?.limit ?? 60);

  return rows;
}

export async function getPujaBySlug(slug: string) {
  const [puja] = await db
    .select({
      puja: pujas,
      temple: temples,
      category: categories,
    })
    .from(pujas)
    .leftJoin(temples, eq(pujas.templeId, temples.id))
    .leftJoin(categories, eq(pujas.categoryId, categories.id))
    .where(and(eq(pujas.slug, slug), eq(pujas.isActive, true)))
    .limit(1);

  if (!puja) return null;

  const pkgs = await db
    .select()
    .from(packages)
    .where(and(eq(packages.pujaId, puja.puja.id), eq(packages.isActive, true)))
    .orderBy(asc(packages.order), asc(packages.priceInPaise));

  return { ...puja, packages: pkgs };
}

export async function getCategoriesWithCount() {
  return db
    .select({
      slug: categories.slug,
      nameEn: categories.nameEn,
      nameHi: categories.nameHi,
      icon: categories.icon,
      count: sql<number>`(
        SELECT COUNT(*) FROM ${pujas}
        WHERE ${pujas.categoryId} = ${categories.id} AND ${pujas.isActive} = true
      )`.mapWith(Number),
    })
    .from(categories)
    .orderBy(asc(categories.order));
}

export async function getOfferings() {
  return db
    .select()
    .from(offerings)
    .where(eq(offerings.isActive, true))
    .orderBy(asc(offerings.order));
}

export async function getProducts() {
  return db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.order));
}

export async function getTestimonials(limit = 6) {
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.isActive, true))
    .orderBy(asc(testimonials.order))
    .limit(limit);
}

export async function getFaqs(limit = 10) {
  return db
    .select()
    .from(faqs)
    .where(eq(faqs.isActive, true))
    .orderBy(asc(faqs.order))
    .limit(limit);
}

export async function getTemples() {
  return db.select().from(temples).orderBy(asc(temples.nameEn));
}

/** Site stats — homepage trust bar ke liye */
export async function getSiteStats() {
  const [row] = await db
    .select({
      pujaCount: sql<number>`(SELECT COUNT(*) FROM ${pujas} WHERE ${pujas.isActive} = true)`.mapWith(Number),
      templeCount: sql<number>`(SELECT COUNT(*) FROM ${temples})`.mapWith(Number),
      bookingCount: sql<number>`(SELECT COUNT(*) FROM ${bookings})`.mapWith(Number),
    })
    .from(sql`(SELECT 1) AS x`);

  return row;
}

/** Booking tracking — code + phone dono match hone chahiye */
export async function getBookingForTracking(bookingCode: string, phone: string) {
  const [row] = await db
    .select({
      booking: bookings,
      puja: {
        slug: pujas.slug,
        titleEn: pujas.titleEn,
        titleHi: pujas.titleHi,
        artKey: pujas.artKey,
        pujaDate: pujas.pujaDate,
      },
      pkg: {
        nameEn: packages.nameEn,
        nameHi: packages.nameHi,
      },
      templeNameEn: temples.nameEn,
      templeNameHi: temples.nameHi,
    })
    .from(bookings)
    .innerJoin(pujas, eq(bookings.pujaId, pujas.id))
    .innerJoin(packages, eq(bookings.packageId, packages.id))
    .leftJoin(temples, eq(pujas.templeId, temples.id))
    .where(
      and(
        eq(bookings.bookingCode, bookingCode.toUpperCase()),
        eq(bookings.phone, phone),
      ),
    )
    .limit(1);

  if (!row) return null;

  const events = await db
    .select()
    .from(bookingEvents)
    .where(eq(bookingEvents.bookingId, row.booking.id))
    .orderBy(desc(bookingEvents.createdAt));

  return { ...row, events };
}

/** Sirf booking code se (payment success page ke liye — code hi secret hai) */
export async function getBookingByCode(bookingCode: string) {
  const [row] = await db
    .select({
      booking: bookings,
      puja: {
        slug: pujas.slug,
        titleEn: pujas.titleEn,
        titleHi: pujas.titleHi,
        artKey: pujas.artKey,
        pujaDate: pujas.pujaDate,
      },
      pkg: { nameEn: packages.nameEn, nameHi: packages.nameHi },
      templeNameEn: temples.nameEn,
      templeNameHi: temples.nameHi,
    })
    .from(bookings)
    .innerJoin(pujas, eq(bookings.pujaId, pujas.id))
    .innerJoin(packages, eq(bookings.packageId, packages.id))
    .leftJoin(temples, eq(pujas.templeId, temples.id))
    .where(eq(bookings.bookingCode, bookingCode.toUpperCase()))
    .limit(1);

  return row ?? null;
}

/** Sitemap ke liye */
export async function getAllActivePujaSlugs() {
  return db
    .select({ slug: pujas.slug, updatedAt: pujas.updatedAt })
    .from(pujas)
    .where(and(eq(pujas.isActive, true), gte(pujas.pujaDate, new Date(0))));
}
