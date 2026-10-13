import { sameOrigin } from "../../../db/local-auth";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { churches, memberships } from "../../../db/schema";
import { getAccess } from "../../../db/access";
const midway = { key: "midway", name: "Midway Baptist Church", address: "905 Yoakum Avenue, New Tazewell, TN" };
export async function GET(request: Request) {
  try {
    const access = await getAccess(request); if (!access) return Response.json({ error: "Access has not been set up for this account." }, { status: 403 });
    const db = getDb(); const all = await db.select().from(churches);
    const list = [midway, ...all.filter(c => c.key !== "midway")].filter(c => access.admin || access.churches.includes(c.key));
    const members = access.admin ? await db.select().from(memberships) : [];
    return Response.json({ admin: access.admin, email: access.email, authType: access.authType, ownChurches: access.churches, roles: access.roleByChurch, churches: list, members }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { console.error("workspace GET", error); return Response.json({ error: "Workspace unavailable." }, { status: 500 }); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const access = await getAccess(request); if (!access?.admin) return Response.json({ error: "Association administration only." }, { status: 403 });
    const body = await request.json() as Record<string, unknown>;
    const db = getDb();
    if (body.action === "church") {
      const name = String(body.name ?? "").trim().slice(0,120);
      const key = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, "-").slice(0,70);
      if (!name || !key || key === "association" || key === "midway") return Response.json({ error: "Enter a distinct church name." }, { status: 400 });
      const [church] = await db.insert(churches).values({ key, name, address: String(body.address ?? "").trim().slice(0,180) }).onConflictDoNothing().returning();
      return church ? Response.json({ church }, { status: 201 }) : Response.json({ error: "This church already exists." }, { status: 409 });
    }
    if (body.action === "member") {
      const email = String(body.email ?? "").trim().toLowerCase().slice(0,160), churchKey = String(body.churchKey ?? ""), role = String(body.role ?? "editor");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["viewer", "editor", "church_admin", "association_admin"].includes(role)) return Response.json({ error: "Enter a valid email and role." }, { status: 400 });
      if ((churchKey === "association") !== (role === "association_admin")) return Response.json({ error: "Association administration must use the association scope." }, { status: 400 });
      const known = churchKey === "association" || churchKey === "midway" || !!(await db.select().from(churches).where(eq(churches.key, churchKey)).limit(1)).length;
      if (!known) return Response.json({ error: "Choose a registered church." }, { status: 400 });
      const [existing] = await db.select().from(memberships).where(and(eq(memberships.email, email), eq(memberships.churchKey, churchKey))).limit(1);
      const [member] = existing ? await db.update(memberships).set({ role }).where(eq(memberships.id, existing.id)).returning() : await db.insert(memberships).values({ email, churchKey, role }).returning();
      return Response.json({ member });
    }
    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) { console.error("workspace POST", error); return Response.json({ error: "Could not save workspace settings." }, { status: 500 }); }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const access = await getAccess(request); if (!access?.admin) return Response.json({ error: "Association administration only." }, { status: 403 });
    const body = await request.json() as { id?: number };
    if (!Number.isSafeInteger(body.id) || !body.id || body.id < 1) return Response.json({ error: "Invalid membership." }, { status: 400 });
    await getDb().delete(memberships).where(eq(memberships.id, body.id));
    return Response.json({ removed: true });
  } catch (error) { console.error("workspace DELETE", error); return Response.json({ error: "Could not remove access." }, { status: 500 }); }
}
