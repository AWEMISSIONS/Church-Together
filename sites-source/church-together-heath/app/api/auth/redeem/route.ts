import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../../../../db";
import { localSessions, localUsers, loginInvites, memberships } from "../../../../db/schema";
import { createSession, hashPassword, hashToken, randomSalt, sameOrigin } from "../../../../db/local-auth";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json() as { token?: string; name?: string; password?: string };
    const token = body.token ?? "", name = (body.name ?? "").trim().slice(0, 120), password = body.password ?? "";
    if (!/^[A-Za-z0-9_-]{43}$/.test(token) || !name || password.length < 12 || password.length > 128) return Response.json({ error: "Enter your name and a password of at least 12 characters." }, { status: 400 });
    const db = getDb(); const now = Date.now(); const tokenHash = await hashToken(token);
    const [invite] = await db.select().from(loginInvites).where(and(eq(loginInvites.tokenHash, tokenHash), eq(loginInvites.usedAt, 0), gt(loginInvites.expiresAt, now))).limit(1);
    if (!invite) return Response.json({ error: "This invite has expired or was already used. Ask an administrator for a new link." }, { status: 410 });
    const [member] = await db.select().from(memberships).where(eq(memberships.email, invite.email)).limit(1);
    if (!member) return Response.json({ error: "Church access was removed. Ask an administrator for help." }, { status: 403 });
    const salt = randomSalt(), passwordHash = await hashPassword(password, salt);
    const [claimed] = await db.update(loginInvites).set({ usedAt: now }).where(and(eq(loginInvites.id, invite.id), eq(loginInvites.usedAt, 0))).returning();
    if (!claimed) return Response.json({ error: "This invite was already used." }, { status: 410 });
    const [existing] = await db.select().from(localUsers).where(eq(localUsers.email, invite.email)).limit(1);
    const [user] = existing ? await db.update(localUsers).set({ name, salt, passwordHash, active: 1 }).where(eq(localUsers.id, existing.id)).returning() : await db.insert(localUsers).values({ email: invite.email, name, salt, passwordHash }).returning();
    if (existing) await db.delete(localSessions).where(eq(localSessions.userId, existing.id));
    const cookie = await createSession(user.id);
    return Response.json({ success: true }, { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } });
  } catch (error) { console.error("redeem", error); return Response.json({ error: "Could not finish setup. Ask for a new invitation." }, { status: 500 }); }
}
