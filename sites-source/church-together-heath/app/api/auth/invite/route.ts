import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { loginInvites, memberships } from "../../../../db/schema";
import { getAccess } from "../../../../db/access";
import { hashToken, normalizeEmail, randomToken, sameOrigin, validEmail } from "../../../../db/local-auth";
import { env } from "cloudflare:workers";

const siteUrl = "https://church-together-heath.heath-tolley.chatgpt.site";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const access = await getAccess(request);
    if (!access?.admin) return Response.json({ error: "Association administration only." }, { status: 403 });
    const body = await request.json() as { email?: string };
    const email = normalizeEmail(body.email ?? "");
    if (!validEmail(email)) return Response.json({ error: "Enter a valid email." }, { status: 400 });
    const db = getDb(); const [membership] = await db.select().from(memberships).where(eq(memberships.email, email)).limit(1);
    if (!membership) return Response.json({ error: "Assign this person to a church first." }, { status: 400 });
    await db.update(loginInvites).set({ usedAt: Date.now() }).where(eq(loginInvites.email, email));
    const token = randomToken();
    await db.insert(loginInvites).values({ tokenHash: await hashToken(token), email, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    const path = `/join#token=${token}`;
    const config = env as typeof env & { RESEND_API_KEY?: string; INVITE_FROM_EMAIL?: string };
    let delivery: "sent" | "manual" | "failed" = "manual";
    if (config.RESEND_API_KEY && config.INVITE_FROM_EMAIL) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { authorization: `Bearer ${config.RESEND_API_KEY}`, "content-type": "application/json" },
          body: JSON.stringify({ from: config.INVITE_FROM_EMAIL, to: [email], subject: "Your Church Together invitation", text: `You've been invited to Church Together. Open this private link to set your password and join your church workspace:\n\n${siteUrl}${path}\n\nThis link works once and expires in seven days. If you weren't expecting it, you can ignore this email.` }),
        });
        delivery = response.ok ? "sent" : "failed";
        if (!response.ok) console.error("invite email delivery failed", response.status);
      } catch (error) { delivery = "failed"; console.error("invite email delivery failed", error); }
    }
    return Response.json({ path, expiresInDays: 7, delivery }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { console.error("invite", error); return Response.json({ error: "Could not create the invite." }, { status: 500 }); }
}
