import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // App
  PORT: z.coerce.number().default(3001),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().default("dev-secret-change-in-production"),

  // Database
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/manufacturehub"),

  // Redis (optional – the server works without it; workers just won't run)
  REDIS_URL: z.string().optional(),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().default(""),

  // Alibaba
  ALIBABA_APP_KEY: z.string().default(""),
  ALIBABA_APP_SECRET: z.string().default(""),

  // SendGrid
  SENDGRID_API_KEY: z.string().default(""),
  SENDGRID_FROM_EMAIL: z.string().email().default("noreply@manufacturehub.io"),

  // S3
  S3_BUCKET: z.string().default("manufacturehub"),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().default(""),
  S3_SECRET_ACCESS_KEY: z.string().default(""),
  S3_ENDPOINT: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV === "development",
  isTest: env.NODE_ENV === "test",

  app: {
    port: env.PORT,
    corsOrigins: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
    jwtSecret: env.JWT_SECRET,
  },

  database: {
    url: env.DATABASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
    enabled: !!env.REDIS_URL,
  },

  anthropic: {
    apiKey: env.ANTHROPIC_API_KEY,
  },

  alibaba: {
    appKey: env.ALIBABA_APP_KEY,
    appSecret: env.ALIBABA_APP_SECRET,
  },

  sendgrid: {
    apiKey: env.SENDGRID_API_KEY,
    fromEmail: env.SENDGRID_FROM_EMAIL,
  },

  s3: {
    bucket: env.S3_BUCKET,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    endpoint: env.S3_ENDPOINT,
  },

  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
} as const;

export type Config = typeof config;
