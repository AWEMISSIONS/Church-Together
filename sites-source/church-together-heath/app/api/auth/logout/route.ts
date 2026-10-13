import { clearSession, sameOrigin } from "../../../../db/local-auth";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const cookie = await clearSession(request);
  return Response.json({ success: true }, { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } });
}
