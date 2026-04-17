import { NextResponse } from "next/server";
import { requireUser } from "@/lib/permissions";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const user = await requireUser();
  return NextResponse.redirect(getGoogleAuthUrl(user.id));
}
