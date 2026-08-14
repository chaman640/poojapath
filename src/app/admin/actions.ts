"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  addons,
  adminUsers,
  bookings,
  categories,
  packages,
  pujaAddons,
  pujas,
  temples,
} from "@/db/schema";
import {
  attemptLogin,
  createSessionCookie,
  destroySessionCookie,
  getAdminSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  adminAddonSchema,
  adminBookingUpdateSchema,
  adminPujaSchema,
  firstError,
  loginSchema,
} from "@/lib/validation";
import { changeBookingStatus } from "@/lib/booking-service";
import { slugify } from "@/lib/utils";

export type ActionState = { error?: string; success?: string };

async function ipKey() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return fwd?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

/* ------------------------------------------------------------------ */
/*  Auth                                                               */
/* ------------------------------------------------------------------ */

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = await ipKey();
  const limit = rateLimit(`admin-login:${ip}`, {
    limit: 6,
    windowMs: 15 * 60_000,
    blockMs: 30 * 60_000,
  });
  if (!limit.ok) {
    return {
      error: `Bahut zyada koshishein. ${Math.ceil(limit.retryAfterSeconds / 60)} minute baad try karein.`,
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Email aur password sahi daalein." };

  const result = await attemptLogin(parsed.data.email, parsed.data.password);

  if (!result.ok) {
    if (result.reason === "locked") {
      return {
        error: `Account ${result.minutes} minute ke liye lock hai (bahut galat koshishein).`,
      };
    }
    if (result.reason === "disabled") return { error: "Ye account band kar diya gaya hai." };
    return { error: "Email ya password galat hai." };
  }

  await createSessionCookie(result.session);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySessionCookie();
  redirect("/admin/login");
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAdminSession();
  if (!session) return { error: "Login zaroori hai." };

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 10) return { error: "Naya password kam se kam 10 character ka rakhein." };
  if (next !== confirm) return { error: "Dono naye password match nahi kar rahe." };
  if (next === current) return { error: "Naya password purane se alag rakhein." };

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.sub))
    .limit(1);
  if (!user) return { error: "Account nahi mila." };

  if (!(await verifyPassword(current, user.passwordHash))) {
    return { error: "Purana password galat hai." };
  }

  await db
    .update(adminUsers)
    .set({
      passwordHash: await hashPassword(next),
      tokenVersion: user.tokenVersion + 1, // purane sessions turant band
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, user.id));

  await destroySessionCookie();
  redirect("/admin/login?changed=1");
}

/* ------------------------------------------------------------------ */
/*  Bookings                                                           */
/* ------------------------------------------------------------------ */

export async function updateBookingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAdminSession();
  if (!session) return { error: "Login zaroori hai." };

  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { error: "Booking ID missing." };

  const parsed = adminBookingUpdateSchema.safeParse({
    status: formData.get("status"),
    videoUrl: formData.get("videoUrl") ?? "",
    prasadTracking: formData.get("prasadTracking") ?? "",
    adminNote: formData.get("adminNote") ?? "",
    notify: formData.get("notify") === "on",
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const updated = await changeBookingStatus({
    bookingId,
    status: parsed.data.status,
    videoUrl: parsed.data.videoUrl || null,
    prasadTracking: parsed.data.prasadTracking || null,
    adminNote: parsed.data.adminNote || null,
    notify: parsed.data.notify ?? true,
  });

  if (!updated) return { error: "Booking nahi mili." };

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { success: "Booking update ho gayi." };
}

/* ------------------------------------------------------------------ */
/*  Pujas                                                              */
/* ------------------------------------------------------------------ */

function parseLines(value: FormDataEntryValue | null, max = 20): string[] {
  return String(value ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, max);
}

function parsePackagesFromForm(formData: FormData) {
  const out: Array<Record<string, unknown>> = [];
  for (let i = 0; i < 6; i++) {
    const nameEn = String(formData.get(`pkg_${i}_nameEn`) ?? "").trim();
    if (!nameEn) continue;
    out.push({
      id: String(formData.get(`pkg_${i}_id`) ?? "") || undefined,
      nameEn,
      nameHi: String(formData.get(`pkg_${i}_nameHi`) ?? "").trim() || nameEn,
      priceInPaise: Math.round(Number(formData.get(`pkg_${i}_price`) ?? 0) * 100),
      mrpInPaise: formData.get(`pkg_${i}_mrp`)
        ? Math.round(Number(formData.get(`pkg_${i}_mrp`)) * 100)
        : null,
      maxMembers: Number(formData.get(`pkg_${i}_maxMembers`) ?? 1),
      featuresEn: parseLines(formData.get(`pkg_${i}_featuresEn`), 15),
      featuresHi: parseLines(formData.get(`pkg_${i}_featuresHi`), 15),
      isPopular: formData.get(`pkg_${i}_isPopular`) === "on",
      isActive: true,
      order: i,
    });
  }
  return out;
}

/** Slug banao aur unique bana do (agar pehle se hai to -2, -3 lagao) */
async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "item";
  let candidate = root;
  for (let i = 2; i < 50; i++) {
    if (!(await exists(candidate))) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

/**
 * Mandir ka naam type kiya gaya hai —
 * pehle se hai to wahi lelo, naya hai to bana do.
 */
async function findOrCreateTemple(input: {
  nameEn: string;
  nameHi: string;
  cityEn: string;
  cityHi: string;
  stateEn: string;
  stateHi: string;
}): Promise<string | null> {
  const nameEn = input.nameEn.trim();
  if (!nameEn) return null;

  const [existing] = await db
    .select({ id: temples.id })
    .from(temples)
    .where(sql`lower(${temples.nameEn}) = lower(${nameEn})`)
    .limit(1);

  if (existing) return existing.id;

  const slug = await uniqueSlug(nameEn, async (s) => {
    const [row] = await db
      .select({ id: temples.id })
      .from(temples)
      .where(eq(temples.slug, s))
      .limit(1);
    return Boolean(row);
  });

  const [created] = await db
    .insert(temples)
    .values({
      slug,
      nameEn,
      nameHi: input.nameHi.trim() || nameEn,
      cityEn: input.cityEn.trim() || "—",
      cityHi: input.cityHi.trim() || input.cityEn.trim() || "—",
      stateEn: input.stateEn.trim() || "India",
      stateHi: input.stateHi.trim() || input.stateEn.trim() || "भारत",
    })
    .returning({ id: temples.id });

  return created.id;
}

/** Category ka naam type kiya gaya hai — pehle se hai to wahi, warna nayi ban jayegi */
async function findOrCreateCategory(
  nameEn: string,
  nameHi: string,
): Promise<string | null> {
  const clean = nameEn.trim();
  if (!clean) return null;

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(sql`lower(${categories.nameEn}) = lower(${clean})`)
    .limit(1);

  if (existing) return existing.id;

  const slug = await uniqueSlug(clean, async (s) => {
    const [row] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, s))
      .limit(1);
    return Boolean(row);
  });

  const [created] = await db
    .insert(categories)
    .values({ slug, nameEn: clean, nameHi: nameHi.trim() || clean, order: 99 })
    .returning({ id: categories.id });

  return created.id;
}

export async function savePujaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAdminSession();
  if (!session) return { error: "Login zaroori hai." };

  const pujaId = String(formData.get("pujaId") ?? "");

  const parsed = adminPujaSchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    titleEn: formData.get("titleEn"),
    titleHi: formData.get("titleHi"),
    subtitleEn: formData.get("subtitleEn") ?? "",
    subtitleHi: formData.get("subtitleHi") ?? "",
    descriptionEn: formData.get("descriptionEn") ?? "",
    descriptionHi: formData.get("descriptionHi") ?? "",
    benefitsEn: parseLines(formData.get("benefitsEn")),
    benefitsHi: parseLines(formData.get("benefitsHi")),
    ritualsEn: parseLines(formData.get("ritualsEn")),
    ritualsHi: parseLines(formData.get("ritualsHi")),
    artKey: formData.get("artKey") ?? "om",
    imageUrl: formData.get("imageUrl") ?? "",
    addonIds: formData.getAll("addonIds").map((v) => String(v)),
    pujaDate: formData.get("pujaDate"),
    templeName: formData.get("templeName") ?? "",
    templeNameHi: formData.get("templeNameHi") ?? "",
    templeCity: formData.get("templeCity") ?? "",
    templeCityHi: formData.get("templeCityHi") ?? "",
    templeState: formData.get("templeState") ?? "",
    templeStateHi: formData.get("templeStateHi") ?? "",
    categoryName: formData.get("categoryName") ?? "",
    categoryNameHi: formData.get("categoryNameHi") ?? "",
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
    seatsTotal: formData.get("seatsTotal") ? Number(formData.get("seatsTotal")) : null,
    order: Number(formData.get("order") ?? 0),
    packages: parsePackagesFromForm(formData),
  });

  if (!parsed.success) return { error: firstError(parsed.error) };
  const data = parsed.data;

  const pujaDate = new Date(data.pujaDate);
  if (Number.isNaN(pujaDate.getTime())) return { error: "Puja ki tareekh sahi nahi hai." };

  // Mandir aur category: naam se dhoondo, na mile to naya bana do
  const templeId = await findOrCreateTemple({
    nameEn: data.templeName,
    nameHi: data.templeNameHi,
    cityEn: data.templeCity,
    cityHi: data.templeCityHi,
    stateEn: data.templeState,
    stateHi: data.templeStateHi,
  });
  const categoryId = await findOrCreateCategory(data.categoryName, data.categoryNameHi);

  const values = {
    slug: data.slug,
    titleEn: data.titleEn,
    titleHi: data.titleHi,
    subtitleEn: data.subtitleEn,
    subtitleHi: data.subtitleHi,
    descriptionEn: data.descriptionEn,
    descriptionHi: data.descriptionHi,
    benefitsEn: data.benefitsEn,
    benefitsHi: data.benefitsHi,
    ritualsEn: data.ritualsEn,
    ritualsHi: data.ritualsHi,
    artKey: data.artKey,
    imageUrl: data.imageUrl || null,
    pujaDate,
    templeId,
    categoryId,
    isFeatured: data.isFeatured,
    isActive: data.isActive,
    seatsTotal: data.seatsTotal ?? null,
    order: data.order,
    updatedAt: new Date(),
  };

  let savedId = pujaId;

  try {
    if (pujaId) {
      await db.update(pujas).set(values).where(eq(pujas.id, pujaId));
    } else {
      const [created] = await db.insert(pujas).values(values).returning({ id: pujas.id });
      savedId = created.id;
    }
  } catch (err) {
    const msg = String(err);
    if (msg.includes("pujas_slug_key") || msg.includes("duplicate key")) {
      return { error: "Ye URL slug pehle se use ho raha hai. Koi doosra rakhein." };
    }
    console.error("[admin] puja save failed:", err);
    return { error: "Save nahi ho paya. Dobara koshish karein." };
  }

  // Packages: purane hata kar naye daal do (bookings package se juda hai,
  // isliye purane package delete nahi karte — unhe inactive kar dete hain)
  const existing = await db
    .select({ id: packages.id })
    .from(packages)
    .where(eq(packages.pujaId, savedId));

  const keepIds = new Set(
    data.packages.map((p) => p.id).filter((v): v is string => Boolean(v)),
  );

  for (const old of existing) {
    if (!keepIds.has(old.id)) {
      await db.update(packages).set({ isActive: false }).where(eq(packages.id, old.id));
    }
  }

  for (const p of data.packages) {
    const pkgValues = {
      pujaId: savedId,
      nameEn: p.nameEn,
      nameHi: p.nameHi,
      priceInPaise: p.priceInPaise,
      mrpInPaise: p.mrpInPaise ?? null,
      maxMembers: p.maxMembers,
      featuresEn: p.featuresEn,
      featuresHi: p.featuresHi,
      isPopular: p.isPopular,
      isActive: p.isActive,
      order: p.order,
    };
    if (p.id) {
      await db.update(packages).set(pkgValues).where(eq(packages.id, p.id));
    } else {
      await db.insert(packages).values(pkgValues);
    }
  }

  // Puja ke saath kaunse add-ons dikhein — dobara set kar dete hain
  await db.delete(pujaAddons).where(eq(pujaAddons.pujaId, savedId));
  if (data.addonIds.length > 0) {
    const valid = await db
      .select({ id: addons.id })
      .from(addons)
      .where(inArray(addons.id, data.addonIds));

    if (valid.length > 0) {
      await db.insert(pujaAddons).values(
        valid.map((a, i) => ({ pujaId: savedId, addonId: a.id, order: i })),
      );
    }
  }

  revalidatePath("/admin/pujas");
  revalidatePath("/pujas");
  revalidatePath(`/pujas/${data.slug}`);
  redirect("/admin/pujas?saved=1");
}

/* ------------------------------------------------------------------ */
/*  Add-ons                                                            */
/* ------------------------------------------------------------------ */

export async function saveAddonAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getAdminSession();
  if (!session) return { error: "Login zaroori hai." };

  const addonId = String(formData.get("addonId") ?? "");

  const parsed = adminAddonSchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    nameEn: formData.get("nameEn"),
    nameHi: formData.get("nameHi"),
    descEn: formData.get("descEn") ?? "",
    descHi: formData.get("descHi") ?? "",
    priceInPaise: Math.round(Number(formData.get("price") ?? 0) * 100),
    imageUrl: formData.get("imageUrl") ?? "",
    artKey: formData.get("artKey") ?? "kalash",
    kind: formData.get("kind") ?? "SERVICE",
    isActive: formData.get("isActive") === "on",
    order: Number(formData.get("order") ?? 0),
  });

  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;

  const values = {
    slug: d.slug,
    nameEn: d.nameEn,
    nameHi: d.nameHi,
    descEn: d.descEn,
    descHi: d.descHi,
    priceInPaise: d.priceInPaise,
    imageUrl: d.imageUrl || null,
    artKey: d.artKey,
    kind: d.kind,
    isActive: d.isActive,
    order: d.order,
    updatedAt: new Date(),
  };

  try {
    if (addonId) {
      await db.update(addons).set(values).where(eq(addons.id, addonId));
    } else {
      await db.insert(addons).values(values);
    }
  } catch (err) {
    const msg = String(err);
    if (msg.includes("addons_slug_key") || msg.includes("duplicate key")) {
      return { error: "Ye slug pehle se use ho raha hai. Koi doosra rakhein." };
    }
    console.error("[admin] addon save failed:", err);
    return { error: "Save nahi ho paya. Dobara koshish karein." };
  }

  revalidatePath("/admin/addons");
  revalidatePath("/pujas");
  redirect("/admin/addons?saved=1");
}

export async function toggleAddonActiveAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const id = String(formData.get("addonId") ?? "");
  const next = String(formData.get("next") ?? "") === "true";
  if (!id) return;

  await db
    .update(addons)
    .set({ isActive: next, updatedAt: new Date() })
    .where(eq(addons.id, id));

  revalidatePath("/admin/addons");
  revalidatePath("/pujas");
}

export async function deleteAddonAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const id = String(formData.get("addonId") ?? "");
  if (!id) return;

  try {
    await db.delete(addons).where(eq(addons.id, id));
  } catch {
    await db.update(addons).set({ isActive: false }).where(eq(addons.id, id));
  }

  revalidatePath("/admin/addons");
  revalidatePath("/pujas");
}

export async function togglePujaActiveAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const id = String(formData.get("pujaId") ?? "");
  const next = String(formData.get("next") ?? "") === "true";
  if (!id) return;

  await db
    .update(pujas)
    .set({ isActive: next, updatedAt: new Date() })
    .where(eq(pujas.id, id));

  revalidatePath("/admin/pujas");
  revalidatePath("/pujas");
}

/**
 * Puja delete.
 *
 * Normal delete tabhi hoti hai jab us puja par ek bhi booking na ho —
 * warna purani bookings ka record toot jayega. Bookings hone par saaf
 * message dikhta hai, aur chahein to "force" se bookings samet delete
 * kar sakte hain (admin ko dobara confirm karna padta hai).
 */
export async function deletePujaAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const id = String(formData.get("pujaId") ?? "");
  const force = String(formData.get("force") ?? "") === "true";
  if (!id) redirect("/admin/pujas");

  const [row] = await db
    .select({
      count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(bookings)
    .where(eq(bookings.pujaId, id));

  const bookingCount = row?.count ?? 0;

  if (bookingCount > 0 && !force) {
    revalidatePath("/admin/pujas");
    redirect(`/admin/pujas?blocked=${bookingCount}`);
  }

  if (force && bookingCount > 0) {
    // pehle bookings (aur unke add-ons/events cascade se) hatao
    await db.delete(bookings).where(eq(bookings.pujaId, id));
  }

  await db.delete(pujas).where(eq(pujas.id, id));

  revalidatePath("/admin/pujas");
  revalidatePath("/pujas");
  redirect("/admin/pujas?deleted=1");
}
