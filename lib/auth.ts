import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { getDb, mongoClient } from "@/db";
import { ac, adminRole, managerRole } from "@/lib/auth-permissions";

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
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  session: {
    expiresIn: 60 * 30,
    updateAge: 60,
  },
  plugins: [
    admin({
      ac,
      roles: {
        admin: adminRole,
        manager: managerRole,
      },
      adminRoles: ["admin"],
      defaultRole: "manager",
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type AppRole = "admin" | "manager";
