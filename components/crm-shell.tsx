"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ACTEURS, type ActeurKey } from "@/lib/acteurs";
import { authClient } from "@/lib/auth-client";
import { AppHeader, Sidebar } from "./crm/chrome";
import { CommandPalette } from "./crm/command-palette";
import { ContactDrawer } from "./crm/contact-drawer";
import { ContactsPage } from "./crm/contacts-page";
import { CrmContextMenu } from "./crm/context-menu";
import { Dashboard } from "./crm/dashboard";
import { PipelinePage } from "./crm/pipeline-page";
import { LocaleProvider } from "./crm/locale-context";
import { ExportModal } from "./crm/export-modal";
import { SessionKeepalive } from "./crm/session-keepalive";
import { SettingsPage, type UserPrefs } from "./crm/settings-page";
import { UsersPage } from "./crm/users-page";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import {
  blankContact,
  createdAtMs,
  EMPTY_FILTERS,
  loadRecent,
  pushRecent,
  RECENT_MS,
  uniqueSorted,
  updatedAtMs,
  type Contact,
  type ContactFilters,
  type Page,
  type QuickView,
  type SortKey,
} from "./crm/types";

function readSavedPage(): Page {
  try {
    const saved = localStorage.getItem("b2m-crm-page");
    if (
      saved === "dashboard" ||
      saved === "contacts" ||
      saved === "pipeline" ||
      saved === "settings" ||
      saved === "users"
    ) {
      return saved;
    }
  } catch {
    /* */
  }
  return "dashboard";
}

export default function CrmShell() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [page, setPage] = useState<Page>("dashboard");
  const [acteur, setActeur] = useState<ActeurKey | "">("");
  const [view, setView] = useState<QuickView>("all");
  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  const [sort, setSort] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [rows, setRows] = useState<Contact[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState<Contact | null>(null);
  const [sheetTab, setSheetTab] = useState<"infos" | "activite">("infos");
  const [toast, setToast] = useState("");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQ, setCmdQ] = useState("");
  const [recent, setRecent] = useState<{ id: string; nom: string }[]>([]);
  const [navOpen, setNavOpen] = useState(false);
  const [filters, setFilters] = useState<ContactFilters>(EMPTY_FILTERS);
  const [prefs, setPrefs] = useState<UserPrefs>({});
  const [exportOpen, setExportOpen] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const colSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cmdRef = useRef<HTMLInputElement>(null);
  const loadAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    setRecent(loadRecent());
    const saved = readSavedPage();
    const hadSaved = !!localStorage.getItem("b2m-crm-page");
    if (hadSaved) setPage(saved);
    setPageReady(true);

    void fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const p = (d.prefs || {}) as UserPrefs;
        setPrefs(p);
        if (!hadSaved && p.defaultPage) setPage(p.defaultPage);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!pageReady) return;
    try {
      localStorage.setItem("b2m-crm-page", page);
    } catch {
      /* */
    }
  }, [page, pageReady]);

  useEffect(() => {
    if (page === "users" && session?.user && session.user.role !== "admin") {
      setPage("dashboard");
    }
  }, [page, session?.user]);

  useEffect(() => {
    const t = setTimeout(() => setQDeb(q), 200);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    loadAbort.current?.abort();
    const ac = new AbortController();
    loadAbort.current = ac;

    if (!opts?.silent) setLoading(true);

    const base = new URLSearchParams();
    if (acteur) base.set("acteur", acteur);
    if (qDeb) base.set("q", qDeb);

    try {
      const firstSp = new URLSearchParams(base);
      firstSp.set("limit", "50");
      firstSp.set("offset", "0");
      firstSp.set("sort", "created");
      firstSp.set("dir", "desc");
      const res = await fetch(`/api/contacts?${firstSp}`, { signal: ac.signal });
      const data = await res.json();
      if (ac.signal.aborted) return;

      const first = (data.rows || []) as Contact[];
      setRows(first);
      const c: Record<string, number> = {};
      for (const x of data.counts || []) c[x.acteur] = x.n;
      setCounts(c);
      if (!opts?.silent) setLoading(false);
      setSelected(new Set());

      const total = Number(data.total) || first.length;
      if (first.length >= total || ac.signal.aborted) return;

      const CHUNK = 150;
      const offsets: number[] = [];
      for (let o = first.length; o < total; o += CHUNK) offsets.push(o);

      // lots en parallèle (3 à la fois) — plus rapide qu’un while séquentiel
      const PARALLEL = 3;
      for (let i = 0; i < offsets.length; i += PARALLEL) {
        if (ac.signal.aborted) return;
        const slice = offsets.slice(i, i + PARALLEL);
        const chunks = await Promise.all(
          slice.map(async (offset) => {
            const sp = new URLSearchParams(base);
            sp.set("limit", String(CHUNK));
            sp.set("offset", String(offset));
            sp.set("counts", "0");
            sp.set("sort", "created");
            sp.set("dir", "desc");
            const r = await fetch(`/api/contacts?${sp}`, { signal: ac.signal });
            const j = await r.json();
            return (j.rows || []) as Contact[];
          }),
        );
        if (ac.signal.aborted) return;
        const batch = chunks.flat();
        if (batch.length) setRows((prev) => [...prev, ...batch]);
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      if (!opts?.silent) setLoading(false);
    }
  }, [acteur, qDeb]);

  useEffect(() => {
    void load();
    return () => loadAbort.current?.abort();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(true);
        setCmdQ("");
        setTimeout(() => cmdRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
        setSheet(null);
        setNavOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const total = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts],
  );

  const viewCounts = useMemo(() => {
    const cutoff = Date.now() - RECENT_MS;
    const base = rows;
    return {
      all: base.length,
      haute: base.filter((r) => r.priorite === "Haute").length,
      incomplets: base.filter((r) => r.completude < 50).length,
      nouveaux: base.filter((r) => r.etapePipeline === "01_Nouveau").length,
      qualifies: base.filter((r) =>
        ["03_Qualifié", "04_Engagé", "05_Partenaire"].includes(r.etapePipeline),
      ).length,
      recents: base.filter((r) => createdAtMs(r) >= cutoff).length,
      pause: base.filter((r) => r.etapePipeline === "06_Pause").length,
      sans_email: base.filter((r) => !(r.email || "").trim()).length,
    } satisfies Record<QuickView, number>;
  }, [rows]);

  const paysOptions = useMemo(() => uniqueSorted(rows, "pays"), [rows]);
  const secteurOptions = useMemo(() => uniqueSorted(rows, "secteur"), [rows]);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (view === "haute") list = list.filter((r) => r.priorite === "Haute");
    if (view === "incomplets") list = list.filter((r) => r.completude < 50);
    if (view === "nouveaux") list = list.filter((r) => r.etapePipeline === "01_Nouveau");
    if (view === "qualifies")
      list = list.filter((r) =>
        ["03_Qualifié", "04_Engagé", "05_Partenaire"].includes(r.etapePipeline),
      );
    if (view === "pause") list = list.filter((r) => r.etapePipeline === "06_Pause");
    if (view === "sans_email") list = list.filter((r) => !(r.email || "").trim());
    if (view === "recents") {
      const cutoff = Date.now() - RECENT_MS;
      list = list.filter((r) => createdAtMs(r) >= cutoff);
    }

    if (filters.etape) list = list.filter((r) => r.etapePipeline === filters.etape);
    if (filters.priorite) list = list.filter((r) => r.priorite === filters.priorite);
    if (filters.pays) list = list.filter((r) => (r.pays || "").trim() === filters.pays);
    if (filters.secteur)
      list = list.filter((r) => (r.secteur || "").trim() === filters.secteur);

    const prioRank = (p: string | null) =>
      p === "Haute" ? 3 : p === "Moyenne" ? 2 : p === "Basse" ? 1 : 0;

    list.sort((a, b) => {
      let cmp = 0;
      if (sort === "nom") cmp = a.nom.localeCompare(b.nom, "fr");
      else if (sort === "score") cmp = a.score - b.score;
      else if (sort === "completude") cmp = a.completude - b.completude;
      else if (sort === "priorite") cmp = prioRank(a.priorite) - prioRank(b.priorite);
      else if (sort === "created") cmp = createdAtMs(a) - createdAtMs(b);
      else if (sort === "updated") cmp = updatedAtMs(a) - updatedAtMs(b);
      else if (sort === "pays")
        cmp = (a.pays || "").localeCompare(b.pays || "", "fr");
      else if (sort === "acteur")
        cmp = a.acteur.localeCompare(b.acteur, "fr");
      else if (sort === "organisation")
        cmp = (a.organisation || "").localeCompare(b.organisation || "", "fr");
      else cmp = a.etapePipeline.localeCompare(b.etapePipeline);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, view, sort, sortDir, filters]);

  const cmdHits = useMemo(() => {
    const needle = cmdQ.trim().toLowerCase();
    if (!needle) return rows.slice(0, 8);
    return rows
      .filter(
        (r) =>
          r.nom.toLowerCase().includes(needle) ||
          (r.organisation || "").toLowerCase().includes(needle) ||
          (r.email || "").toLowerCase().includes(needle),
      )
      .slice(0, 12);
  }, [cmdQ, rows]);

  const kpis = useMemo(() => {
    const haute = rows.filter((r) => r.priorite === "Haute").length;
    const incomplets = rows.filter((r) => r.completude < 50).length;
    const partenaires = rows.filter((r) => r.etapePipeline === "05_Partenaire").length;
    const avg =
      rows.length === 0
        ? 0
        : Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length);
    const avgCompletude =
      rows.length === 0
        ? 0
        : Math.round(rows.reduce((a, r) => a + r.completude, 0) / rows.length);
    const cutoff = Date.now() - RECENT_MS;
    const recents = rows.filter((r) => createdAtMs(r) >= cutoff).length;
    return { haute, incomplets, partenaires, avg, avgCompletude, recents };
  }, [rows]);

  function toggleSort(k: SortKey) {
    if (sort === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(k);
      setSortDir(k === "nom" || k === "pays" || k === "acteur" || k === "organisation" ? "asc" : "desc");
    }
  }

  async function openContact(id: string) {
    const res = await fetch(`/api/contacts/${id}`);
    if (!res.ok) return;
    const c: Contact = await res.json();
    setSheet(c);
    setSheetTab("infos");
    pushRecent({ id: c.id, nom: c.nom });
    setRecent(loadRecent());
    setCmdOpen(false);
  }

  async function saveContact(
    patch: Partial<Contact> & { journalNote?: string },
    opts?: { keepOpen?: boolean },
  ) {
    if (!sheet) return;

    if (!sheet.id) {
      const nom = String(patch.nom ?? sheet.nom ?? "").trim();
      if (!nom) {
        setToast("Le nom est obligatoire");
        return;
      }
      const acteurVal = String(patch.acteur || sheet.acteur || ACTEURS[0].k);
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patch, nom, acteur: acteurVal }),
      });
      if (!res.ok) {
        setToast("Création impossible");
        return;
      }
      const row = await res.json();
      setRows((prev) => [row, ...prev]);
      setCounts((c) => ({ ...c, [acteurVal]: (c[acteurVal] || 0) + 1 }));
      setToast("Contact créé");
      setPage("contacts");
      if (opts?.keepOpen) {
        await openContact(row.id);
        return;
      }
      setSheet(null);
      return;
    }

    const id = sheet.id;
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setToast("Échec enregistrement");
      return;
    }
    setToast("Enregistré");
    if (opts?.keepOpen) {
      await openContact(id);
      await load({ silent: true });
      return;
    }
    setSheet(null);
    await load({ silent: true });
  }

  function startCreate() {
    setSheet(blankContact(acteur || prefs.formDefaultActeur || ACTEURS[0].k));
    setSheetTab("infos");
    setNavOpen(false);
  }

  async function deleteContact(id: string) {
    if (!id) {
      setSheet(null);
      return;
    }
    if (!confirm(t((prefs.locale as Locale) || "fr").deleteConfirm)) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    setSheet(null);
    setToast(t((prefs.locale as Locale) || "fr").deleted);
    await load({ silent: true });
  }

  async function bulkDelete() {
    const ids = [...selected];
    if (!ids.length) return;
    if (!confirm(t((prefs.locale as Locale) || "fr").deleteBulkConfirm)) return;
    await Promise.all(ids.map((id) => fetch(`/api/contacts/${id}`, { method: "DELETE" })));
    setToast(`${ids.length} ${t((prefs.locale as Locale) || "fr").deletedBulk}`);
    setSelected(new Set());
    await load({ silent: true });
  }

  async function bulkPatch(patch: Partial<Contact>) {
    const ids = [...selected];
    if (!ids.length) return;
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/contacts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }),
      ),
    );
    setToast(`${ids.length} fiche(s) mises à jour`);
    await load({ silent: true });
  }

  async function moveStage(id: string, etapePipeline: string) {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapePipeline }),
    });
    await load({ silent: true });
  }

  function openExport() {
    setExportOpen(true);
  }

  async function logout() {
    await authClient.signOut();
    router.replace("/login");
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function onColumnWidths(next: Record<string, number>) {
    setPrefs((p) => ({ ...p, columnWidths: next }));
    if (colSaveTimer.current) clearTimeout(colSaveTimer.current);
    colSaveTimer.current = setTimeout(() => {
      void fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs: { columnWidths: next } }),
      });
    }, 400);
  }

  async function savePrefs(next: UserPrefs) {
    setPrefs(next);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefs: next }),
    });
    setToast("Paramètres enregistrés");
  }

  async function toggleSidebar() {
    const next = { ...prefs, sidebarCollapsed: !prefs.sidebarCollapsed };
    setPrefs(next);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefs: next }),
    });
  }

  function onPageSize(n: number) {
    const next = { ...prefs, pageSize: n };
    setPrefs(next);
    void fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefs: next }),
    });
  }

  return (
    <LocaleProvider locale={(prefs.locale as Locale) || "fr"}>
    <div className="flex h-dvh overflow-hidden">
      <SessionKeepalive />
      <Sidebar
        open={navOpen}
        collapsed={!!prefs.sidebarCollapsed}
        page={page}
        acteur={acteur}
        total={total}
        counts={counts}
        recent={recent}
        email={session?.user?.email}
        isAdmin={session?.user?.role === "admin"}
        showTypes={prefs.showNavTypes !== false}
        showRecents={prefs.showNavRecents !== false}
        onClose={() => setNavOpen(false)}
        onPage={setPage}
        onActeur={setActeur}
        onOpenRecent={(id) => void openContact(id)}
        onLogout={logout}
        onToggleCollapse={() => void toggleSidebar()}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <AppHeader
          onMenu={() => setNavOpen(true)}
          onSearch={() => {
            setCmdOpen(true);
            setTimeout(() => cmdRef.current?.focus(), 50);
          }}
          onExport={openExport}
          onCreate={startCreate}
        />

        <div className="flex-1 min-h-0 overflow-hidden p-3 sm:p-4 md:p-5 relative">
          <div key={page} className="h-full crm-page">
            {page === "dashboard" ? (
              <Dashboard
                total={acteur ? counts[acteur] || rows.length : total}
                kpis={kpis}
                counts={counts}
                rows={filtered}
                onOpenView={(v) => {
                  setView(v);
                  setPage("contacts");
                }}
                onOpenType={(k) => {
                  setActeur(k);
                  setPage("contacts");
                }}
              />
            ) : null}

            {page === "contacts" ? (
              <ContactsPage
                loading={loading}
                rows={filtered}
                selected={selected}
                view={view}
                viewCounts={viewCounts}
                acteur={acteur}
                sort={sort}
                sortDir={sortDir}
                q={q}
                filters={filters}
                paysOptions={paysOptions}
                secteurOptions={secteurOptions}
                onQ={setQ}
                onView={(v) => {
                  setView(v);
                  if (v === "recents") {
                    setSort("created");
                    setSortDir("desc");
                  }
                }}
                onFilters={setFilters}
                onSort={toggleSort}
                onToggleAll={toggleAll}
                onToggleOne={toggleOne}
                onOpen={openContact}
                onBulkEtape={(et) => bulkPatch({ etapePipeline: et })}
                onBulkPrio={(p) => bulkPatch({ priorite: p })}
                onBulkDelete={() => void bulkDelete()}
                columnWidths={prefs.columnWidths || {}}
                onColumnWidths={onColumnWidths}
                pageSize={prefs.pageSize || 25}
                onPageSize={onPageSize}
              />
            ) : null}

            {page === "pipeline" ? (
              <PipelinePage
                loading={loading}
                rows={filtered}
                onOpen={openContact}
                onMove={moveStage}
              />
            ) : null}

            {page === "settings" ? (
              <SettingsPage
                prefs={prefs}
                onSavePrefs={savePrefs}
                email={session?.user?.email}
                isAdmin={session?.user?.role === "admin"}
              />
            ) : null}

            {page === "users" && session?.user?.role === "admin" ? <UsersPage /> : null}
          </div>
        </div>
      </div>

      {sheet ? (
        <ContactDrawer
          contact={sheet}
          tab={sheetTab}
          onTab={setSheetTab}
          onClose={() => setSheet(null)}
          onSave={saveContact}
          onDelete={() => deleteContact(sheet.id)}
        />
      ) : null}

      {cmdOpen ? (
        <CommandPalette
          inputRef={cmdRef}
          value={cmdQ}
          onChange={setCmdQ}
          hits={cmdHits}
          onPick={(id) => openContact(id)}
          onClose={() => setCmdOpen(false)}
        />
      ) : null}

      {toast ? (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] bg-[var(--text-primary)] text-white px-4 py-2.5 rounded-[var(--radius-sm)] text-[13px] font-semibold shadow-[var(--shadow-2)] crm-fade"
          role="status"
        >
          {toast}
        </div>
      ) : null}

      {exportOpen ? (
        <ExportModal
          rows={filtered}
          selectedIds={[...selected]}
          acteur={acteur}
          onClose={() => setExportOpen(false)}
        />
      ) : null}

      <CrmContextMenu
        onNavigate={setPage}
        onCreate={startCreate}
        onSearch={() => {
          setCmdOpen(true);
          setTimeout(() => cmdRef.current?.focus(), 50);
        }}
        onRefresh={() => void load({ silent: true })}
        isAdmin={session?.user?.role === "admin"}
      />
    </div>
    </LocaleProvider>
  );
}
