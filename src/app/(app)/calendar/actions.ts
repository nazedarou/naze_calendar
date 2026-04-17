"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";

import { prisma } from "@/lib/db";
import { requireOwner, requireUser } from "@/lib/permissions";
import { syncEventToGoogle, deleteEventFromGoogle } from "@/lib/google-calendar";

const TZ = "Asia/Singapore";

const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  startAt: z.string().transform((s) => fromZonedTime(s, TZ)),
  clientId: z.string().optional(),
  contractId: z.string().optional(),
  assignedUserIds: z.array(z.string()).default([]),
});

function clean(s: string | undefined | null) {
  const v = (s ?? "").toString().trim();
  return v === "" ? null : v;
}

function buildPayload(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    location: String(formData.get("location") ?? ""),
    startAt: String(formData.get("startAt") ?? ""),
    clientId: String(formData.get("clientId") ?? "") || undefined,
    contractId: String(formData.get("contractId") ?? "") || undefined,
    assignedUserIds: formData.getAll("assignedUserIds").map((v) => String(v)).filter(Boolean),
  };
}

export async function createEvent(formData: FormData) {
  const user = await requireUser();
  const data = eventSchema.parse(buildPayload(formData));

  const event = await prisma.event.create({
    data: {
      title: data.title.trim(),
      description: clean(data.description),
      location: clean(data.location),
      startAt: data.startAt,
      clientId: clean(data.clientId),
      contractId: clean(data.contractId),
      createdById: user.id,
      assignments: {
        create: data.assignedUserIds.map((userId) => ({ userId })),
      },
    },
  });
  revalidatePath("/calendar");
  revalidatePath("/");
  syncEventToGoogle(event.id).catch(console.error);
  redirect(`/calendar/${event.id}`);
}

export async function updateEvent(id: string, formData: FormData) {
  await requireUser();
  const data = eventSchema.parse(buildPayload(formData));

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id },
      data: {
        title: data.title.trim(),
        description: clean(data.description),
        location: clean(data.location),
        startAt: data.startAt,
        clientId: clean(data.clientId),
        contractId: clean(data.contractId),
      },
    });
    await tx.eventAssignment.deleteMany({ where: { eventId: id } });
    if (data.assignedUserIds.length > 0) {
      await tx.eventAssignment.createMany({
        data: data.assignedUserIds.map((userId) => ({ eventId: id, userId })),
      });
    }
  });
  revalidatePath("/calendar");
  revalidatePath(`/calendar/${id}`);
  revalidatePath("/");
  syncEventToGoogle(id).catch(console.error);
  redirect(`/calendar/${id}`);
}

export async function deleteEvent(id: string) {
  await requireOwner();
  await deleteEventFromGoogle(id).catch(console.error);
  await prisma.event.delete({ where: { id } });
  revalidatePath("/calendar");
  revalidatePath("/");
  redirect("/calendar");
}
