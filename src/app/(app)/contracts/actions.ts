"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";

const milestoneSchema = z.object({
  label: z.string().min(1).max(120),
  amount: z.coerce.number().nonnegative(),
  dueDate: z.coerce.date(),
});

const contractSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  totalAmount: z.coerce.number().positive(),
  currency: z.string().min(1).max(8).default("USD"),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"]),
  startDate: z.coerce.date(),
  endDate: z
    .union([z.coerce.date(), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  assignedUserIds: z.array(z.string()).default([]),
  milestones: z.array(milestoneSchema).length(4, "Must have exactly 4 milestones"),
});

function parseMilestones(formData: FormData) {
  return [1, 2, 3, 4].map((i) => ({
    label: String(formData.get(`milestone_${i}_label`) ?? ""),
    amount: String(formData.get(`milestone_${i}_amount`) ?? "0"),
    dueDate: String(formData.get(`milestone_${i}_dueDate`) ?? ""),
  }));
}

function parseAssignedUserIds(formData: FormData): string[] {
  return formData.getAll("assignedUserIds").map((v) => String(v)).filter(Boolean);
}

function buildPayload(formData: FormData) {
  return {
    clientId: String(formData.get("clientId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    totalAmount: String(formData.get("totalAmount") ?? "0"),
    currency: String(formData.get("currency") ?? "USD"),
    status: String(formData.get("status") ?? "DRAFT"),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    assignedUserIds: parseAssignedUserIds(formData),
    milestones: parseMilestones(formData),
  };
}

export async function createContract(formData: FormData) {
  const user = await requireOwner();
  const data = contractSchema.parse(buildPayload(formData));

  const contract = await prisma.contract.create({
    data: {
      clientId: data.clientId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      totalAmount: new Prisma.Decimal(data.totalAmount),
      currency: data.currency,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      createdById: user.id,
      payments: {
        create: data.milestones.map((m, idx) => ({
          stage: idx + 1,
          label: m.label.trim(),
          amount: new Prisma.Decimal(m.amount),
          dueDate: m.dueDate,
        })),
      },
      assignments: {
        create: data.assignedUserIds.map((userId) => ({ userId })),
      },
    },
  });

  revalidatePath("/contracts");
  redirect(`/contracts/${contract.id}`);
}

export async function updateContract(id: string, formData: FormData) {
  await requireOwner();
  const data = contractSchema.parse(buildPayload(formData));

  await prisma.$transaction(async (tx) => {
    await tx.contract.update({
      where: { id },
      data: {
        clientId: data.clientId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        totalAmount: new Prisma.Decimal(data.totalAmount),
        currency: data.currency,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
      },
    });

    for (let idx = 0; idx < data.milestones.length; idx++) {
      const m = data.milestones[idx];
      await tx.paymentMilestone.upsert({
        where: { contractId_stage: { contractId: id, stage: idx + 1 } },
        update: {
          label: m.label.trim(),
          amount: new Prisma.Decimal(m.amount),
          dueDate: m.dueDate,
        },
        create: {
          contractId: id,
          stage: idx + 1,
          label: m.label.trim(),
          amount: new Prisma.Decimal(m.amount),
          dueDate: m.dueDate,
        },
      });
    }

    await tx.contractAssignment.deleteMany({ where: { contractId: id } });
    if (data.assignedUserIds.length > 0) {
      await tx.contractAssignment.createMany({
        data: data.assignedUserIds.map((userId) => ({ contractId: id, userId })),
      });
    }
  });

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${id}`);
  redirect(`/contracts/${id}`);
}

export async function deleteContract(id: string) {
  await requireOwner();
  await prisma.contract.delete({ where: { id } });
  revalidatePath("/contracts");
  redirect("/contracts");
}

const markPaidSchema = z.object({
  paid: z.enum(["true", "false"]),
});

export async function togglePayment(milestoneId: string, formData: FormData) {
  await requireOwner();
  const { paid } = markPaidSchema.parse({ paid: formData.get("paid") });

  const m = await prisma.paymentMilestone.update({
    where: { id: milestoneId },
    data:
      paid === "true"
        ? { status: "PAID", paidDate: new Date() }
        : { status: "PENDING", paidDate: null },
    select: { contractId: true },
  });
  revalidatePath(`/contracts/${m.contractId}`);
  revalidatePath("/");
  revalidatePath("/contracts");
}

