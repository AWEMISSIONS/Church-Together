import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { localUsers, loginAttempts, memberships } from "../../../../db/schema";
import { createSession, normalizeEmail, sameOrigin, validEmail, verifyPassword } from "../../../../db/local-auth";
const windowMs = 15 * 60 * 1000;
const invalid = () => Response.json({ error: "Email or password is incorrect." }, { status: 401 });
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json() as { email?: string; password?: string };
    const email = normalizeEmail(body.email ?? ""); const password = body.password ?? "";
    if (!validEmail(email) || !password || password.length > 128) return invalid();
    const db = getDb(); const now = Date.now();
    const [attempt] = await db.select().from(loginAttempts).where(eq(loginAttempts.email, email)).limit(1);
    if (attempt && attempt.lockedUntil > now) return Response.json({ error: "Too many attempts. Please try again in 15 minutes." }, { status: 429 });
    const [user] = await db.select().from(localUsers).where(eq(localUsers.email, email)).limit(1);
    const [membership] = user ? await db.select().from(memberships).where(eq(memberships.email, email)).limit(1) : [];
    const okay = !!user?.active && !!membership && await verifyPassword(password, user.salt, user.passwordHash);
    if (!okay) {
      const failedCount = attempt && now - attempt.windowStart < windowMs ? attempt.failedCount + 1 : 1;
      await db.insert(loginAttempts).values({ email, failedCount, windowStart: attempt && now - attempt.windowStart < windowMs ? attempt.windowStart : now, lockedUntil: failedCount >= 5 ? now + windowMs : 0 }).onConflictDoUpdate({ target: loginAttempts.email, set: { failedCount, windowStart: attempt && now - attempt.windowStart < windowMs ? attempt.windowStart : now, lockedUntil: failedCount >= 5 ? now + windowMs : 0 } });
      return invalid();
    }
    await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
    const cookie = await createSession(user.id);
    return Response.json({ success: true }, { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } });
  } catch (error) { console.error("login", error); return Response.json({ error: "Sign-in is temporarily unavailable." }, { status: 500 }); }
}
