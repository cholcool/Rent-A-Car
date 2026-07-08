import { defineConfig } from "prisma/config";
import { config } from "dotenv";

config();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not defined in environment variables");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx ./prisma/seed.ts", 
  },
  datasource: {
    url: process.env.DATABASE_URL, 
  },
});
