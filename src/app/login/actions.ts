"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/") || "/";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      const code = err.type === "CredentialsSignin" ? "CredentialsSignin" : "AuthError";
      const safeCallback = encodeURIComponent(callbackUrl);
      redirect(`/login?error=${code}&callbackUrl=${safeCallback}`);
    }
    throw err;
  }
}
