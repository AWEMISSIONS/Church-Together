import { sameOrigin } from "../../../db/local-auth";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { churches, items } from "../../../db/schema";
import { canRead, canWrite, getAccess } from "../../../db/access";

const kinds = new Set(["welcome", "care", "care_member", "care_facility", "serve", "grow", "association_opportunity"]);
const denied = () => Response.json({ error: "You do not have access to this church workspace." }, { status: 403 });
const unavailable = (error: unknown) => { console.error("items API", error); return Response.json({ error: "The workspace is temporarily unavailable." }, { status: 500 }); };
const value = (body: Record<string, unknown>, key: string, limit: number) => String(body[key] ?? "").trim().slice(0, limit);

export async function GET(request: Request) {
  try {
    const access = await getAccess(request); if (!access) return denied();
    const db = getDb();
    const rows = access.admin ? (await db.select().from(items).orderBy(desc(items.id)).limit(500)).filter(i => canRead(access, i.churchKey, i.kind)) : await db.select().from(items).where(inArray(items.churchKey, [...access.churches, "association"])).orderBy(desc(items.id)).limit(500);
    return Response.json({ items: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return unavailable(error); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const access = await getAccess(request); if (!access) return denied();
    const body = await request.json() as Record<string, unknown>;
    const kind = value(body, "kind", 40), churchKey = value(body, "churchKey", 80), title = value(body, "title", 120);
    if (!kinds.has(kind) || !title || !canWrite(access, churchKey, kind) || (kind === "association_opportunity") !== (churchKey === "association")) return Response.json({ error: "Choose an authorized church and a valid title." }, { status: 400 });
    if (churchKey !== "association" && churchKey !== "midway") {
      const known = await getDb().select({ key: churches.key }).from(churches).where(eq(churches.key, churchKey)).limit(1);
      if (!known.length) return Response.json({ error: "This church has not been registered." }, { status: 400 });
    }
    const fields = { detail: value(body,"detail",1000), contact: value(body,"contact",160), phone: value(body,"phone",40), email: value(body,"email",160), preferredContact: value(body,"preferredContact",30), assignedTo: value(body,"assignedTo",120), dueDate: value(body,"dueDate",10), priority: value(body,"priority",10) || "normal" };
    if (!valid(fields)) return Response.json({ error: "Check the contact, due date, and priority fields." }, { status: 400 });
    const [item] = await getDb().insert(items).values({ kind, churchKey, title, ...fields, updatedAt: new Date().toISOString() }).returning();
    return Response.json({ item }, { status: 201 });
  } catch (error) { return unavailable(error); }
}
function valid(fields: { phone: string; email: string; preferredContact: string; dueDate: string; priority: string }) {
  return (/^$|^[+0-9(). -]{7,40}$/.test(fields.phone) && /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) && ["", "call", "text", "email"].includes(fields.preferredContact) && /^$|^\d{4}-\d{2}-\d{2}$/.test(fields.dueDate) && ["normal", "urgent"].includes(fields.priority));
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const access = await getAccess(request); if (!access) return denied();
    const body = await request.json() as Record<string, unknown>;
    const id = Number(body.id), expectedVersion = Number(body.version);
    if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(expectedVersion)) return Response.json({ error: "Invalid update." }, { status: 400 });
    const db = getDb(); const [existing] = await db.select().from(items).where(eq(items.id, id)).limit(1);
    if (!existing) return Response.json({ error: "Item not found." }, { status: 404 });
    if (!canWrite(access, existing.churchKey, existing.kind)) return denied();
    if (existing.version !== expectedVersion) return Response.json({ error: "Someone else changed this item. Refresh and review their update before saving." }, { status: 409 });
    const changes: Record<string, string | number> = { version: expectedVersion + 1, updatedAt: new Date().toISOString() };
    const fields = ["title", "detail", "contact", "phone", "email", "preferredContact", "assignedTo", "dueDate", "priority", "status"] as const;
    const limits = { title: 120, detail: 1000, contact: 160, phone: 40, email: 160, preferredContact: 30, assignedTo: 120, dueDate: 10, priority: 10, status: 10 };
    for (const field of fields) if (field in body) changes[field] = value(body, field, limits[field]);
    if (("title" in changes && !changes.title) || ("status" in changes && !["open", "done"].includes(String(changes.status))) || !valid({ phone: String(changes.phone ?? existing.phone), email: String(changes.email ?? existing.email), preferredContact: String(changes.preferredContact ?? existing.preferredContact), dueDate: String(changes.dueDate ?? existing.dueDate), priority: String(changes.priority ?? existing.priority) })) return Response.json({ error: "Check the fields and try again." }, { status: 400 });
    const [item] = await db.update(items).set(changes).where(and(eq(items.id, id), eq(items.version, expectedVersion))).returning();
    return item ? Response.json({ item }) : Response.json({ error: "Someone else changed this item. Refresh to review it." }, { status: 409 });
  } catch (error) { return unavailable(error); }
}
