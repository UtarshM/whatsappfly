import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Fallback to a dummy URL during build time to prevent crashes
    url: env("DATABASE_URL") || "postgresql://postgres:postgres@localhost:5432/whatsappfly",
  },
});
