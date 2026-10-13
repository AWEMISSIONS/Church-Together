"use client";
import { useState } from "react";
import { Church } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function Login() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) }); const data = await r.json() as { error?: string }; if (!r.ok) throw Error(data.error || "Could not sign in."); window.location.assign("/"); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not sign in."); setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-card"><div className="auth-logo"><Church size={25}/></div><span className="section-kicker">CHURCH TOGETHER</span><h1>Welcome back.</h1><p>Sign in to your church workspace. You do not need a ChatGPT account.</p><form onSubmit={submit}><label>Email address<Input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}/></label><label>Password<Input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}/></label>{error && <p role="alert" className="auth-error">{error}</p>}<Button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button></form><p className="auth-foot">New here or need a password reset? Ask your church administrator for a new invitation link.</p><a className="auth-admin" href="/signin-with-chatgpt?return_to=%2F" target="_top">Existing administrator sign-in</a></div></main>;
}
