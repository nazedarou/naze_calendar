import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  const name = process.env.OWNER_NAME ?? "Company Owner";

  if (!email || !password) {
    throw new Error(
      "OWNER_EMAIL and OWNER_PASSWORD must be set in the environment to seed the owner account.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const owner = await prisma.user.upsert({
    where: { email },
    update: {
      // Promote to OWNER if user already exists with a different role
      role: Role.OWNER,
      active: true,
      name,
    },
    create: {
      email,
      name,
      passwordHash,
      role: Role.OWNER,
    },
  });

  console.log(`Seeded owner account: ${owner.email} (${owner.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
