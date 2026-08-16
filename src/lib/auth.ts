import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { getAuthSecret, isProd } from "./env";

export const SESSION_COOKIE = "pp_admin_session";
const SESSION_HOURS = 8;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const BCRYPT_ROUNDS = 12;

export type AdminSession = {
  sub: string;
  email: string;
  name: string;
  role: string;
  ver: number;
};

/* ------------------------------------------------------------------ */
/*  Passwords                                                          */
/* ------------------------------------------------------------------ */

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/* ------------------------------------------------------------------ */
/*  JWT session                                                        */
/* ------------------------------------------------------------------ */

async function signSession(payload: AdminSession) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer("pooja-path")
    .setAudience("pooja-path-admin")
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getAuthSecret());
}

export async function createSessionCookie(payload: AdminSession) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function destroySessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Session padho aur database se dobara verify karo.
 * (Sirf JWT par bharosa nahi karte — agar admin disable ho gaya ya
 *  tokenVersion badla, to purana token turant invalid ho jata hai.)
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getAuthSecret(), {
      issuer: "pooja-path",
      audience: "pooja-path-admin",
      algorithms: ["HS256"],
    });

    const sub = typeof payload.sub === "string" ? payload.sub : String(payload.sub ?? "");
    if (!sub) return null;

    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, sub))
      .limit(1);

    if (!user || !user.isActive) return null;
    if (user.tokenVersion !== payload.ver) return null;

    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ver: user.tokenVersion,
    };
  } catch {
    return null;
  }
}

/** API routes me use karein — null return ho to 401 bhej dein */
export async function requireAdmin(): Promise<AdminSession | null> {
  return getAdminSession();
}

/* ------------------------------------------------------------------ */
/*  Login with lockout                                                 */
/* ------------------------------------------------------------------ */

export type LoginResult =
  | { ok: true; session: AdminSession }
  | { ok: false; reason: "invalid" | "locked" | "disabled"; minutes?: number };

export async function attemptLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  const normalized = email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, normalized))
    .limit(1);

  // User na mile tab bhi bcrypt chalao — timing se pata na chale
  if (!user) {
    await bcrypt.compare(
      password,
      "$2b$12$0000000000000000000000000000000000000000000000000000",
    );
    return { ok: false, reason: "invalid" };
  }

  if (!user.isActive) return { ok: false, reason: "disabled" };

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return {
      ok: false,
      reason: "locked",
      minutes: Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000),
    };
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    const failed = user.failedAttempts + 1;
    const lock =
      failed >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCK_MINUTES * 60_000)
        : null;
    await db
      .update(adminUsers)
      .set({
        failedAttempts: lock ? 0 : failed,
        lockedUntil: lock,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, user.id));

    return lock
      ? { ok: false, reason: "locked", minutes: LOCK_MINUTES }
      : { ok: false, reason: "invalid" };
  }

  await db
    .update(adminUsers)
    .set({
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, user.id));

  return {
    ok: true,
    session: {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ver: user.tokenVersion,
    },
  };
}
