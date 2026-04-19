import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loginAction } from "./actions";

type Props = {
  searchParams: Promise<{ callbackUrl?: string; error?: string; success?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { callbackUrl, error, success } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-ink-950">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-10">
          <div
            className="text-[42px] font-extrabold leading-none text-ink-100 tracking-tight mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FONK
          </div>
          <div
            className="text-[9px] uppercase text-ink-500"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.28em" }}
          >
            Interior Management
          </div>
        </div>

        {/* Rule */}
        <div className="border-t border-ink-600 mb-8" />

        {success === "password_changed" && (
          <div className="mb-6 border border-ok-dim bg-ok-ghost px-4 py-3 text-sm text-ok">
            Password changed — please sign in again.
          </div>
        )}

        <form action={loginAction} className="space-y-5">
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
            />
          </div>
          {error && (
            <div className="border border-danger-dim bg-danger-ghost px-4 py-3 text-sm text-danger" role="alert">
              {error === "CredentialsSignin"
                ? "Invalid email or password."
                : "Sign in failed. Please try again."}
            </div>
          )}
          <button type="submit" className="btn-primary w-full mt-2">
            Sign in →
          </button>
        </form>
      </div>
    </div>
  );
}
