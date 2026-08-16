import { z } from "zod";

/** HTML/script injection se bachne ke liye — plain text hi allow karte hain */
const plainText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((v) => !/[<>]/.test(v), {
      message: "< aur > characters allowed nahi hain",
    });

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?91[- ]?)?[6-9]\d{9}$/, "Sahi 10-digit mobile number daalein");

export const bookingSchema = z.object({
  pujaSlug: z.string().trim().min(1).max(200),
  packageId: z.string().trim().min(1).max(64),
  devoteeName: plainText(120).pipe(z.string().min(2, "Naam bahut chhota hai")),
  gotra: plainText(80).pipe(z.string().min(2, "Gotra likhein (pata na ho to 'Kashyap')")),
  phone: phoneSchema,
  email: z.union([z.string().trim().email().max(200), z.literal("")]).optional(),
  memberNames: z.array(plainText(120)).max(20).optional().default([]),
  addonIds: z.array(z.string().trim().max(64)).max(30).optional().default([]),
  sankalp: plainText(500).optional().default(""),
  addressLine: plainText(300).optional().default(""),
  city: plainText(120).optional().default(""),
  state: plainText(120).optional().default(""),
  pincode: z
    .union([z.string().trim().regex(/^\d{6}$/, "6 digit pincode"), z.literal("")])
    .optional()
    .default(""),
  whatsappOptIn: z.boolean().optional().default(true),
});

export type BookingInput = z.infer<typeof bookingSchema>;

/**
 * Tracking: sirf phone number zaroori hai.
 * Booking ID optional — de diya to seedha usi booking par le jate hain.
 */
export const trackSchema = z.object({
  bookingCode: z.union([z.string().trim().max(40), z.literal("")]).optional(),
  phone: phoneSchema,
});

export const contactSchema = z.object({
  name: plainText(120).pipe(z.string().min(2)),
  phone: phoneSchema,
  email: z.union([z.string().trim().email().max(200), z.literal("")]).optional(),
  subject: plainText(200).pipe(z.string().min(3)),
  message: plainText(2000).pipe(z.string().min(10, "Thoda vistaar se likhein")),
  // Honeypot — bots isko bhar dete hain, insaan nahi
  website: z.string().max(0).optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(4).max(80),
  razorpay_payment_id: z.string().trim().min(4).max(80),
  razorpay_signature: z.string().trim().min(4).max(200),
});

/* ------------------------- Admin schemas ------------------------- */

const packageSchema = z.object({
  id: z.string().optional(),
  nameEn: plainText(160).pipe(z.string().min(2)),
  nameHi: plainText(160).pipe(z.string().min(1)),
  priceInPaise: z.coerce.number().int().min(100).max(100_000_000),
  mrpInPaise: z.coerce.number().int().min(0).max(100_000_000).nullable().optional(),
  maxMembers: z.coerce.number().int().min(1).max(50).default(1),
  featuresEn: z.array(plainText(200)).max(15).default([]),
  featuresHi: z.array(plainText(200)).max(15).default([]),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(999).default(0),
});

/** Cloudinary/https photo URL — khaali bhi ho sakta hai */
const imageUrl = z
  .union([
    z
      .string()
      .trim()
      .max(600)
      .refine((v) => /^https:\/\//i.test(v), { message: "Photo ka link https:// hona chahiye" }),
    z.literal(""),
  ])
  .optional()
  .default("");

export const adminAddonSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Sirf chhote letters, number aur hyphen")
    .min(2)
    .max(160),
  nameEn: plainText(200).pipe(z.string().min(2)),
  nameHi: plainText(200).pipe(z.string().min(1)),
  descEn: plainText(600).default(""),
  descHi: plainText(600).default(""),
  priceInPaise: z.coerce.number().int().min(0).max(100_000_000),
  imageUrl,
  artKey: z.string().trim().max(40).default("kalash"),
  kind: z.enum(["DELIVERY", "SERVICE"]),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const adminPujaSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Sirf chhote letters, number aur hyphen")
    .min(3)
    .max(200),
  titleEn: plainText(250).pipe(z.string().min(3)),
  titleHi: plainText(250).pipe(z.string().min(1)),
  subtitleEn: plainText(300).default(""),
  subtitleHi: plainText(300).default(""),
  descriptionEn: plainText(6000).default(""),
  descriptionHi: plainText(6000).default(""),
  benefitsEn: z.array(plainText(300)).max(20).default([]),
  benefitsHi: z.array(plainText(300)).max(20).default([]),
  ritualsEn: z.array(plainText(300)).max(20).default([]),
  ritualsHi: z.array(plainText(300)).max(20).default([]),
  artKey: z.string().trim().max(40).default("om"),
  imageUrl,
  addonIds: z.array(z.string().trim().max(64)).max(30).default([]),
  pujaDate: z.string().trim().min(4),

  // Mandir aur category dono ab type kiye ja sakte hain.
  // Naam pehle se ho to wahi use hota hai, naya ho to apne aap ban jata hai.
  templeName: plainText(200).default(""),
  templeNameHi: plainText(200).default(""),
  templeCity: plainText(120).default(""),
  templeCityHi: plainText(120).default(""),
  templeState: plainText(120).default(""),
  templeStateHi: plainText(120).default(""),
  categoryName: plainText(160).default(""),
  categoryNameHi: plainText(160).default(""),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  seatsTotal: z.coerce.number().int().min(0).max(100000).nullable().optional(),
  order: z.coerce.number().int().min(0).max(9999).default(0),
  packages: z.array(packageSchema).min(1, "Kam se kam ek package banayein").max(6),
});

/** Sirf http/https link — javascript: jaisi URL se XSS na ho */
const safeUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^https?:\/\//i.test(v), {
    message: "Link http:// ya https:// se shuru hona chahiye",
  });

export const adminBookingUpdateSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "PAID",
    "CONFIRMED",
    "PERFORMED",
    "VIDEO_SENT",
    "PRASAD_DISPATCHED",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
  ]),
  videoUrl: z.union([safeUrl, z.literal("")]).optional(),
  prasadTracking: plainText(120).optional().default(""),
  adminNote: plainText(1000).optional().default(""),
  notify: z.boolean().optional().default(true),
});

/** Zod error ko user-friendly message me badalta hai */
export function firstError(err: z.ZodError): string {
  const issue = err.issues[0];
  return issue?.message || "Form me kuch galat hai";
}
