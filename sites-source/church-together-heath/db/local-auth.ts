import { and, eq, gt } from "drizzle-orm";
import { getDb } from "./index";
import { localSessions, localUsers } from "./schema";

const cookieName = "__Host-ct_session";
const encoder = new TextEncoder();
const iterations = 600_000;
const week = 7 * 24 * 60 * 60 * 1000;
export const normalizeEmail = (value: string) => value.trim().toLowerCase().slice(0, 160);
export const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const randomToken = () => base64url(crypto.getRandomValues(new Uint8Array(32)));
export const randomSalt = () => base64url(crypto.getRandomValues(new Uint8Array(16)));
function base64url(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
function fromBase64url(input: string) { const base = input.replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(base.padEnd(Math.ceil(base.length / 4) * 4, "=")), c => c.charCodeAt(0)); }
export async function hashToken(token: string) { return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(token)))); }
export async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromBase64url(salt), iterations }, key, 256);
  return base64url(new Uint8Array(bits));
}
export async function verifyPassword(password: string, salt: string, expected: string) {
  const actual = fromBase64url(await hashPassword(password, salt)); const other = fromBase64url(expected);
  if (actual.length !== other.length) return false;
  let difference = 0; for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ other[i];
  return difference === 0;
}
export async function createSession(userId: number) {
  const token = randomToken(); const expiresAt = Date.now() + week;
  await getDb().insert(localSessions).values({ tokenHash: await hashToken(token), userId, expiresAt });
  return `${cookieName}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(week / 1000)}`;
}
export async function localIdentity(request: Request) {
  const match = request.headers.get("cookie")?.match(/(?:^|;\s*)__Host-ct_session=([A-Za-z0-9_-]{40,50})(?:;|$)/);
  if (!match) return null;
  const tokenHash = await hashToken(match[1]);
  const db = getDb();
  const [session] = await db.select().from(localSessions).where(and(eq(localSessions.tokenHash, tokenHash), gt(localSessions.expiresAt, Date.now()))).limit(1);
  if (!session) return null;
  const [user] = await db.select().from(localUsers).where(eq(localUsers.id, session.userId)).limit(1);
  return user?.active ? { id: user.id, email: user.email, name: user.name, tokenHash } : null;
}
export async function clearSession(request: Request) {
  const identity = await localIdentity(request);
  if (identity) await getDb().delete(localSessions).where(eq(localSessions.tokenHash, identity.tokenHash));
  return `${cookieName}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}
