import React, { useEffect, useMemo, useState } from "react";
import "./App.css"; // Ensure you have your Tailwind CSS setup

// ---- Config ----
const API_BASE = "http://localhost:9090/delivery-tracking"; // adjust if your backend is hosted elsewhere

const STATUS = ["PENDING", "IN_TRANSIT", "DELIVERED"] as const;

// Generic fetch wrapper
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message += ` - ${body.message}`;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

// Types mirrored from your Ballerina service
type Delivery = {
  trackingCode: string;
  customerId: string;
  customerEmail: string;
  weightKg: number;
  origin?: string;
  destination?: string;
  description?: string;
  status: (typeof STATUS)[number];
  createdDate: string;
  deliveredDate?: string;
  cost: number;
};

type Summary = {
  totalDeliveries: number;
  averageCost: number;
  statusBreakdown: { pending: number; inTransit: number; delivered: number };
};

export default function App() {
  // Ensure our fallback CSS is injected even if Tailwind isn't configured yet.
  return (
    <>
      <StyleInjector />
      <Shell />
    </>
  );
}

function Shell() {
  const [tab, setTab] = useState<"create" | "list" | "summary" | "monitor">(
    "create"
  );

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b border-muted">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-xl bg-primary/10 grid place-items-center">📦</span>
            <h1 className="text-xl md:text-2xl font-bold">Delivery Tracking</h1>
          </div>
          <nav className="flex gap-2">
            {[
              ["create", "Create"],
              ["list", "Deliveries"],
              ["summary", "Summary"],
              ["monitor", "Monitor"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`tab ${tab === key ? "tab-active" : ""}`}
                onClick={() => setTab(key as any)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === "create" && <CreateDelivery onCreated={() => setTab("list")} />}
        {tab === "list" && <Deliveries />}
        {tab === "summary" && <SummaryView />}
        {tab === "monitor" && <MonitorView />}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-xs text-muted-foreground">
        Backend: <code className="px-1.5 py-0.5 rounded bg-muted">{API_BASE}</code>
      </footer>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Section({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl shadow-sm p-5 border border-muted mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Badge({ children, tone = "default" as "default" | "success" | "warn" }) {
  const cls =
    tone === "success"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "warn"
      ? "bg-amber-100 text-amber-800"
      : "bg-gray-100 text-gray-800";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{children}</span>;
}

function CreateDelivery({ onCreated }: { onCreated?: () => void }) {
  const [form, setForm] = useState({
    customerId: "",
    customerEmail: "",
    weightKg: 1,
    origin: "",
    destination: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Delivery | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const created = await api<Delivery>("/deliveries", {
        method: "POST",
        body: JSON.stringify({ ...form, weightKg: Number(form.weightKg) }),
      });
      setResult(created);
      toast("Delivery created.");
      onCreated?.();
      setForm({ customerId: "", customerEmail: "", weightKg: 1, origin: "", destination: "", description: "" });
    } catch (err: any) {
      setError(err.message);
      toast(err.message, true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section title="Create a Delivery">
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Customer ID" required hint="Your internal customer identifier">
          <input
            className="input"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            required
          />
        </Field>
        <Field label="Customer Email" required>
          <input
            type="email"
            className="input"
            value={form.customerEmail}
            onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
            required
          />
        </Field>
        <Field label="Weight (kg)" required>
          <input
            type="number"
            min={0}
            step={0.1}
            className="input"
            value={form.weightKg}
            onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
            required
          />
        </Field>
        <Field label="Origin">
          <input
            className="input"
            value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value })}
            placeholder="Warehouse A"
          />
        </Field>
        <Field label="Destination">
          <input
            className="input"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            placeholder="City B"
          />
        </Field>
        <Field label="Description">
          <input
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Books, electronics…"
          />
        </Field>
        <div className="md:col-span-2 flex items-center gap-3">
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? "Creating…" : "Create Delivery"}
          </button>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
      </form>

      {result && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
          <div className="font-medium">Created</div>
          <div className="flex flex-wrap gap-4 mt-1 items-center">
            <span>Tracking Code: <code className="px-1.5 py-0.5 bg-white rounded border">{result.trackingCode}</code></span>
            <span>Cost: <strong>{result.cost}</strong></span>
            <Badge tone={result.status === "DELIVERED" ? "success" : result.status === "IN_TRANSIT" ? "warn" : "default"}>{result.status}</Badge>
            <button className="btn" onClick={() => copy(result.trackingCode)}>Copy code</button>
          </div>
        </div>
      )}
    </Section>
  );
}

function Deliveries() {
  const [status, setStatus] = useState<string>("");
  const [customerId, setCustomerId] = useState("");
  const [data, setData] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (customerId) params.set("customerId", customerId);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [status, customerId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await api<Delivery[]>(`/deliveries${q}`);
      setData(list);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function updateStatus(trackingCode: string, newStatus: Delivery["status"]) {
    const deliveredDate =
      newStatus === "DELIVERED"
        ? prompt("Delivered ISO timestamp (e.g., 2025-08-04T12:10:00Z) Leave blank to omit.") || undefined
        : undefined;
    try {
      await api<Delivery>(`/deliveries/${encodeURIComponent(trackingCode)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus, deliveredDate }),
      });
      await load();
      toast("Status updated.");
    } catch (err: any) {
      toast(err.message, true);
    }
  }

  return (
    <Section
      title="Deliveries"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Field label="Status">
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">(any)</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Customer ID">
          <input className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="cust-001" />
        </Field>
      </div>

      {error && <p className="text-destructive text-sm mb-3">{error}</p>}

      <div className="grid gap-3">
        {data.map((d) => (
          <div key={d.trackingCode} className="rounded-2xl border border-muted bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Tracking</div>
                <div className="font-mono text-base md:text-lg">{d.trackingCode}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={d.status === "DELIVERED" ? "success" : d.status === "IN_TRANSIT" ? "warn" : "default"}>{d.status}</Badge>
                <button className="btn" onClick={() => copy(d.trackingCode)}>Copy</button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Info label="Customer" value={d.customerId} />
              <Info label="Email" value={<span className="truncate inline-block max-w-[180px] align-bottom">{d.customerEmail}</span>} />
              <Info label="Weight" value={`${d.weightKg} kg`} />
              <Info label="Cost" value={d.cost} />
              <Info label="Origin" value={d.origin || "—"} />
              <Info label="Destination" value={d.destination || "—"} />
              <Info label="Created" value={d.createdDate} />
              <Info label="Delivered" value={d.deliveredDate || "—"} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {STATUS.map((s) => (
                <button
                  key={s}
                  title={`Mark ${s}`}
                  className={`chip ${d.status === s ? "chip-active" : ""}`}
                  onClick={() => updateStatus(d.trackingCode, s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
        {data.length === 0 && !loading && (
          <Empty title="No deliveries found" subtitle="Try adjusting filters or create a new delivery." />
        )}
      </div>
    </Section>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function SummaryView() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setSummary(await api<Summary>("/summary"));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Section title="Summary" actions={<button className="btn" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>}>
      {error && <p className="text-destructive text-sm mb-3">{error}</p>}
      {summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <KPI title="Total Deliveries" value={summary.totalDeliveries} />
          <KPI title="Average Cost" value={summary.averageCost.toFixed(2)} />
          <KPI title="Pending" value={summary.statusBreakdown.pending} />
          <KPI title="In Transit" value={summary.statusBreakdown.inTransit} />
          <KPI title="Delivered" value={summary.statusBreakdown.delivered} />
        </div>
      ) : (
        <SkeletonKPIs />
      )}
    </Section>
  );
}

function KPI({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-muted shadow p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function SkeletonKPIs() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-muted p-4 animate-pulse">
          <div className="h-3 w-24 bg-muted rounded mb-3" />
          <div className="h-6 w-16 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

function MonitorView() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<any[]>("/monitor");
      setItems(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Section title="Carrier Monitor (JSON + XML)" actions={<button className="btn" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>}>
      {error && <p className="text-destructive text-sm mb-3">{error}</p>}
      <div className="grid gap-3">
        {items.map((t, i) => (
          <div key={i} className="rounded-2xl border border-muted bg-card p-4 shadow-sm">
            <div className="flex flex-wrap justify-between items-center">
              <div className="font-mono text-base">{t.trackingCode}</div>
              <Badge>{t.carrier}</Badge>
            </div>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Info label="Location" value={t.location} />
              <Info label="Timestamp" value={t.timestamp} />
              <Info label="Status" value={t.status} />
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && (
          <Empty title="No tracking items yet" subtitle="Feeds will appear here when available." />
        )}
      </div>
    </Section>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-muted p-8 text-center bg-card">
      <div className="text-lg font-semibold">{title}</div>
      {subtitle && <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>}
    </div>
  );
}

// ---- Tiny utility styles (Tailwind-like utility classes + light/dark design tokens) ----
const styles = `
:root{--bg:#0b0c0f;--card:#ffffff;--muted:#e6e6e6;--fg:#0b0c0f;--muted-fg:#6b7280;--primary:#111827;--destructive:#dc2626}
@media (prefers-color-scheme: dark){:root{--bg:#0b0c0f;--card:#111318;--muted:#22262e;--fg:#f4f4f5;--muted-fg:#9ca3af;--primary:#d1d5db;--destructive:#f87171}}
.bg-surface{background:var(--bg)}
.bg-card{background:var(--card)}
.text-foreground{color:var(--fg)}
.text-muted-foreground{color:var(--muted-fg)}
.border-muted{border-color:var(--muted)}
.text-destructive{color:var(--destructive)}
.bg-muted{background:var(--muted)}
.bg-primary\/10{background:color-mix(in srgb, var(--primary) 10%, transparent)}

.input{width:100%;border:1px solid var(--muted);background:var(--card);border-radius:0.75rem;padding:0.5rem 0.75rem;outline:none}
.input:focus{box-shadow:0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent)}

.btn{padding:0.5rem 0.75rem;border-radius:0.75rem;background:var(--muted);color:var(--fg);border:1px solid var(--muted);transition:.15s;}
.btn:hover{filter:brightness(0.98)}
.btn-primary{padding:0.6rem 1rem;border-radius:0.9rem;background:var(--fg);color:var(--bg);border:1px solid var(--fg);}

.tab{padding:0.4rem 0.8rem;border-radius:999px;border:1px solid var(--muted);background:var(--card);font-size:.9rem}
.tab-active{background:var(--fg);color:var(--bg);border-color:var(--fg)}

.chip{padding:0.35rem 0.7rem;border-radius:999px;border:1px solid var(--muted);background:var(--card);font-size:.8rem}
.chip-active{background:var(--fg);color:var(--bg);border-color:var(--fg)}
`;

function StyleInjector() {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = styles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  return null;
}

// Simple toast notifications
function toast(message: string, error = false) {
  const el = document.createElement("div");
  el.textContent = message;
  el.className = `fixed right-4 top-4 z-50 px-3 py-2 rounded-xl shadow ${
    error ? "bg-red-600 text-white" : "bg-black text-white"
  }`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied");
  } catch {
    toast("Copy failed", true);
  }
}

export { Shell as Component };
