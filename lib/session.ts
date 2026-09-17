import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  return { session, error: null };
}

export function isAdmin(session: { user: { role?: string | null } }) {
  return session.user.role === "admin";
}

/** Accès CRM : admin ou manager */
export function isStaff(session: { user: { role?: string | null } }) {
  const r = session.user.role;
  return r === "admin" || r === "manager";
}

export async function requireAdmin() {
  const { session, error } = await requireSession();
  if (error) return { session: null, error };
  if (!session || !isAdmin(session)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
