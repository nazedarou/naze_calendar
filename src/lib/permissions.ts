import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role,
  };
}

export async function requireOwner(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "OWNER") {
    redirect("/?error=forbidden");
  }
  return user;
}

export function isOwner(user: Pick<SessionUser, "role">) {
  return user.role === "OWNER";
}

export async function requireContractAccess(contractId: string): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role === "OWNER") return user;
  const assignment = await prisma.contractAssignment.findUnique({
    where: { contractId_userId: { contractId, userId: user.id } },
    select: { contractId: true },
  });
  if (!assignment) redirect("/?error=forbidden");
  return user;
}
