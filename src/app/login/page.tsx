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
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-brand-50">
      <div className="w-full max-w-sm card p-10">
        <div className="text-center mb-8">
          <span className="font-serif text-3xl text-brand-800" style={{ letterSpacing: "0.15em" }}>FONK</span>
          <p className="mt-2 text-xs uppercase tracking-widest text-brand-400">Sign in to continue</p>
        </div>

        {success === "password_changed" && (
          <p className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
            Password changed. Please sign in again.
          </p>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="input" />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error === "CredentialsSignin"
                ? "Invalid email or password."
                : "Sign in failed. Please try again."}
            </p>
          )}
          <button type="submit" className="btn-primary w-full">Sign in</button>
        </form>
      </div>
    </div>
  );
}
