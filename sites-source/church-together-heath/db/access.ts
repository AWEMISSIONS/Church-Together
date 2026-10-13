import { and, eq } from "drizzle-orm";
import { getDb } from "./index";
import { memberships } from "./schema";
import { localIdentity } from "./local-auth";

// Sites forwards a Site-scoped user ID, which differs from the account ID in
// the project's sharing policy. The forwarded email identifies this owner.
const associationOwnerEmail = "heath.tolley@gmail.com";
export type Access = { admin: boolean; email: string; churches: string[]; roleByChurch: Record<string, string>; authType: "chatgpt" | "local" };
export async function getAccess(request: Request): Promise<Access | null> {
  const id = request.headers.get("oai-authenticated-user-id");
  const local = id ? null : await localIdentity(request);
  const email = (id ? request.headers.get("oai-authenticated-user-email") : local?.email)?.trim().toLowerCase();
  if (!email || (!id && !local)) return null;
  if (id && email === associationOwnerEmail) return { admin: true, email, churches: ["midway"], roleByChurch: { midway: "church_admin" }, authType: "chatgpt" };
  const rows = await getDb().select().from(memberships).where(eq(memberships.email, email));
  if (!rows.length) return null;
  return { admin: rows.some(r => r.churchKey === "association" && r.role === "association_admin"), email, churches: rows.filter(r => r.churchKey !== "association").map(r => r.churchKey), roleByChurch: Object.fromEntries(rows.map(r => [r.churchKey, r.role])), authType: id ? "chatgpt" : "local" };
}
export function canRead(access: Access, churchKey: string, kind: string) { return churchKey === "association" || access.churches.includes(churchKey) || (access.admin && ["serve", "grow"].includes(kind)); }
export function canWrite(access: Access, churchKey: string, kind: string) { return (access.admin && (churchKey === "association" || ["serve", "grow"].includes(kind))) || (churchKey !== "association" && ["editor", "church_admin"].includes(access.roleByChurch[churchKey])); }
