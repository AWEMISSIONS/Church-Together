import { sameOrigin } from "../../../db/local-auth";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { items, participation } from "../../../db/schema";
import { canRead, canWrite, getAccess } from "../../../db/access";
const denied = () => Response.json({ error: "Church access is required." }, { status: 403 });
export async function GET(request: Request) {
  try {
    const access = await getAccess(request); if (!access) return denied();
    const rows = access.admin ? await getDb().select().from(participation) : await getDb().select().from(participation).where(inArray(participation.churchKey, access.churches));
    return Response.json({ participation: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { console.error("participation GET", e); return Response.json({ error: "Participation unavailable." }, { status: 500 }); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const access = await getAccess(request); if (!access) return denied();
    const body = await request.json() as Record<string, unknown>;
    const opportunityId = Number(body.opportunityId), churchKey = String(body.churchKey ?? "");
    if (!Number.isSafeInteger(opportunityId) || !canWrite(access, churchKey, "welcome") || churchKey === "association") return denied();
    const db = getDb();
    const [opportunity] = await db.select().from(items).where(and(eq(items.id, opportunityId), eq(items.kind, "association_opportunity"))).limit(1);
    if (!opportunity) return Response.json({ error: "Opportunity not found." }, { status: 404 });
    if (body.action === "join") {
      const [record] = await db.insert(participation).values({ opportunityId, churchKey, updatedAt: new Date().toISOString() }).onConflictDoUpdate({ target: [participation.opportunityId, participation.churchKey], set: { updatedAt: new Date().toISOString() } }).returning();
      return Response.json({ record });
    }
    if (body.action === "leave") {
      await db.delete(participation).where(and(eq(participation.opportunityId, opportunityId), eq(participation.churchKey, churchKey)));
      return Response.json({ removed: true });
    }
    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) { console.error("participation POST", e); return Response.json({ error: "Could not update participation." }, { status: 500 }); }
}
