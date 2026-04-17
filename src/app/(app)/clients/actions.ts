"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireOwner, requireUser } from "@/lib/permissions";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

function clean(s: string | undefined | null) {
  const v = (s ?? "").trim();
  return v === "" ? null : v;
}

export async function createClient(formData: FormData) {
  const user = await requireUser();
  const parsed = clientSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    notes: formData.get("notes") ?? "",
  });

  const client = await prisma.client.create({
    data: {
      name: parsed.name.trim(),
      email: clean(parsed.email),
      phone: clean(parsed.phone),
      address: clean(parsed.address),
      notes: clean(parsed.notes),
      createdById: user.id,
    },
  });
  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(id: string, formData: FormData) {
  await requireUser();
  const parsed = clientSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    notes: formData.get("notes") ?? "",
  });

  await prisma.client.update({
    where: { id },
    data: {
      name: parsed.name.trim(),
      email: clean(parsed.email),
      phone: clean(parsed.phone),
      address: clean(parsed.address),
      notes: clean(parsed.notes),
    },
  });
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

export async function deleteClient(id: string) {
  await requireOwner();
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
  redirect("/clients");
}
