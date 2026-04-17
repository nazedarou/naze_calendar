"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(Role),
});

export async function createEmployee(formData: FormData) {
  await requireOwner();
  const data = createSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error("A user with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email,
      passwordHash,
      role: data.role,
    },
  });
  revalidatePath("/employees");
}

const updateSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.nativeEnum(Role),
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
  password: z.string().optional(),
});

export async function updateEmployee(id: string, formData: FormData) {
  const owner = await requireOwner();
  const data = updateSchema.parse({
    name: formData.get("name"),
    role: formData.get("role"),
    active: formData.get("active") ?? "true",
    password: formData.get("password") ?? "",
  });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new Error("User not found");

  // Safeguards: prevent owner from locking themselves out.
  if (target.id === owner.id) {
    if (data.role !== "OWNER" || data.active === false) {
      throw new Error("You cannot remove your own owner role or deactivate yourself.");
    }
  }

  const patch: {
    name: string;
    role: Role;
    active: boolean;
    passwordHash?: string;
  } = {
    name: data.name.trim(),
    role: data.role,
    active: data.active,
  };

  if (data.password && data.password.length > 0) {
    if (data.password.length < 8) throw new Error("Password must be at least 8 characters");
    patch.passwordHash = await bcrypt.hash(data.password, 12);
  }

  await prisma.user.update({ where: { id }, data: patch });
  revalidatePath("/employees");
}

export async function deleteEmployee(id: string) {
  const owner = await requireOwner();
  if (id === owner.id) throw new Error("You cannot delete yourself.");
  await prisma.user.delete({ where: { id } });
  revalidatePath("/employees");
}
