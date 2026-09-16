import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { getDb, mongoClient } from "@/db";

function authHosts(): string[] {
  const hosts = ["localhost:3000", "*.vercel.app"];
  const url = process.env.BETTER_AUTH_URL;
  if (url) {
    try {
      hosts.push(new URL(url).host);
    } catch {
      /* ignore */
    }
  }
  return hosts;
}

export const auth = betterAuth({
  baseURL: {
    allowedHosts: authHosts(),
    protocol: process.env.NODE_ENV === "development" ? "http" : "https",
    fallback: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  },
  database: mongodbAdapter(getDb(), { client: mongoClient }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "member",
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
