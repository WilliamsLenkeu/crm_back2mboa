import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/db";
import { requireSession } from "@/lib/session";

export type UserPrefs = {
  columnWidths?: Record<string, number>;
  formDefaultActeur?: string;
  formEnabled?: boolean;
  sidebarCollapsed?: boolean;
  pageSize?: number;
  [key: string]: unknown;
};

function asPrefs(raw: unknown): UserPrefs {
  if (raw && typeof raw === "object") return raw as UserPrefs;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw || "{}") as UserPrefs;
    } catch {
      return {};
    }
  }
  return {};
}

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;
  const userId = session!.user.id;
  const row = await collections.userSettings().findOne({ userId });
  return NextResponse.json({ prefs: asPrefs(row?.prefs) });
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;
  const userId = session!.user.id;
  const body = (await req.json()) as { prefs?: UserPrefs };
  if (!body.prefs || typeof body.prefs !== "object") {
    return NextResponse.json({ error: "prefs requis" }, { status: 400 });
  }

  const prev = await collections.userSettings().findOne({ userId });
  const prevPrefs = asPrefs(prev?.prefs);
  const merged: UserPrefs = { ...prevPrefs, ...body.prefs };
  if (body.prefs.columnWidths) {
    merged.columnWidths = {
      ...prevPrefs.columnWidths,
      ...body.prefs.columnWidths,
    };
  }

  await collections.userSettings().updateOne(
    { userId },
    { $set: { userId, prefs: merged, updatedAt: new Date() } },
    { upsert: true },
  );
  return NextResponse.json({ prefs: merged });
}
