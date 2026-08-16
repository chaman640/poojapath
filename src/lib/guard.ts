import "server-only";
import { NextResponse } from "next/server";
import { requireAdmin, type AdminSession } from "./auth";
import { siteConfig } from "./env";

/**
 * CSRF protection — cookie SameSite=Lax ke upar ek aur layer.
 * Har state-changing request ka Origin/Referer apne hi domain ka hona chahiye.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  const allowed = new Set<string>();
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }
  try {
    allowed.add(new URL(siteConfig.url).origin);
  } catch {
    /* ignore */
  }

  if (origin) return allowed.has(origin);
  if (referer) {
    try {
      return allowed.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }
  // Browser POST hamesha Origin bhejta hai; na ho to reject
  return false;
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Admin API routes ke liye: session + CSRF dono check */
export async function guardAdminApi(
  req: Request,
): Promise<{ session: AdminSession } | { response: NextResponse }> {
  if (req.method !== "GET" && !sameOrigin(req)) {
    return { response: jsonError("Request source verify nahi hua.", 403) };
  }
  const session = await requireAdmin();
  if (!session) {
    return { response: jsonError("Login zaroori hai.", 401) };
  }
  return { session };
}

/** Public POST routes ke liye: sirf CSRF check */
export function guardPublicPost(req: Request): NextResponse | null {
  if (!sameOrigin(req)) {
    return jsonError("Request source verify nahi hua.", 403);
  }
  return null;
}
