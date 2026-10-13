"use client";
import { useEffect, useState } from "react";
import { Church } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function Join() {
  const [token, setToken] = useState(""); const [name, setName] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") ?? ""); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { const r = await fetch("/api/auth/redeem", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, name, password }) }); const data = await r.json() as { error?: string }; if (!r.ok) throw Error(data.error || "Could not set up access."); window.location.replace("/"); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not set up access."); setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-card"><div className="auth-logo"><Church size={25}/></div><span className="section-kicker">CHURCH TOGETHER</span><h1>Join your church team.</h1><p>Set or reset your password using the private link your administrator shared with you.</p>{token ? <form onSubmit={submit}><label>Your name<Input required maxLength={120} autoComplete="name" value={name} onChange={e => setName(e.target.value)}/></label><label>Password, at least 12 characters<Input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}/></label>{error && <p role="alert" className="auth-error">{error}</p>}<Button type="submit" disabled={busy}>{busy ? "Setting up…" : "Create account"}</Button></form> : <p role="alert" className="auth-error">This invitation link is incomplete. Ask your administrator for a new one.</p>}</div></main>;
}
