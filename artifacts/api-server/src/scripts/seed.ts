import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usersTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("admin123", 12);
  const existing = await db.select().from(usersTable).where(eq(usersTable.username, "admin"));
  if (existing.length === 0) {
    await db.insert(usersTable).values({ username: "admin", passwordHash });
    console.log("Created admin user (admin / admin123)");
  } else {
    console.log("Admin user already exists — skipping");
  }

  const defaultSettings: Array<{ key: string; value: string }> = [
    { key: "target_cities", value: JSON.stringify(["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao"]) },
    { key: "target_business_types", value: JSON.stringify(["Restaurante", "Hotel", "Delicatessen", "Supermercado gourmet", "Catering"]) },
    { key: "min_score", value: "60" },
    { key: "daily_contact_limit", value: "20" },
    { key: "sender_name", value: "La Bercianita" },
    { key: "sender_email", value: "hola@labercianita.com" },
    { key: "phone", value: "+34 987 000 000" },
    { key: "website", value: "https://www.labercianita.com/" },
  ];

  for (const setting of defaultSettings) {
    const row = await db.select().from(settingsTable).where(eq(settingsTable.key, setting.key));
    if (row.length === 0) {
      await db.insert(settingsTable).values(setting);
      console.log(`Created setting: ${setting.key}`);
    } else {
      console.log(`Setting already exists: ${setting.key} — skipping`);
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
