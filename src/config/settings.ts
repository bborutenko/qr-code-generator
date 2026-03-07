import { z } from "zod";

const envSchema = z.object({
  HOVERCODE_WORKSPACE_ID: z.string().min(1, "HOVERCODE_WORKSPACE_ID is required"),
  HOVERCODE_API_KEY: z.string().min(1, "HOVERCODE_API_KEY is required"),
  HOVERCODE_BASE_URL: z.url("HOVERCODE_BASE_URL must be a valid URL"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
})

const envs = {
    HOVERCODE_WORKSPACE_ID: process.env.HOVERCODE_WORKSPACE_ID,
    HOVERCODE_API_KEY: process.env.HOVERCODE_API_KEY,
    HOVERCODE_BASE_URL: process.env.HOVERCODE_BASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
};

const parsed = envSchema.safeParse(envs);

if (!parsed.success) {
  console.log("❌ Invalid environment variables:");
  throw new Error("Environment validation failed");
}

const settings = parsed.data;
export default settings;