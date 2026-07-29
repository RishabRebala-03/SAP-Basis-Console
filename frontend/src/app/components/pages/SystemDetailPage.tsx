import { ArrowLeft, Server, Globe, Hash, Clock, Activity, Shield, CheckCircle2, AlertCircle, Copy, Check, Pencil } from "lucide-react";
import { useState } from "react";
import { SapSystem } from "../../contexts/AppContext";

const F = {
  primary: "#0070f2", success: "#107e3e", error: "#bb0000",
  warning: "#e9730c", text: "var(--app-text)", muted: "var(--app-muted)",
  border: "var(--app-border)", bg: "var(--app-bg)", white: "var(--app-surface)",
};

const ENV_META: Record<string, { color: string; bg: string; dot: string }> = {
  Production:  { color: "#bb0000", bg: "#fff2f2", dot: "#bb0000" },
  Quality:     { color: "#e9730c", bg: "#fff8f0", dot: "#e9730c" },
  Development: { color: "#0070f2", bg: "#e8f2ff", dot: "#0070f2" },
  Sandbox:     { color: "#74777a", bg: "#f5f6f7", dot: "#74777a" },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors" style={{ background: copied ? "#f1fdf6" : F.bg, border: `1px solid ${copied ? F.success : F.border}`, color: copied ? F.success : F.muted }}>
      {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
    </button>
  );
}

function InfoRow({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${F.border}` }}>
      <span className="text-xs" style={{ color: F.muted }}>{label}</span>
      {children ?? (
        <span className="text-sm" style={{ color: F.text, fontFamily: mono ? "monospace" : "inherit" }}>{value || "—"}</span>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
        <span style={{ color: F.muted }}>{icon}</span>
        <h3 className="text-sm" style={{ color: F.text }}>{title}</h3>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

const MOCK_METRICS = [
  { label: "Active Users",   value: "—",   sub: "Fetched from BAPI" },
  { label: "Locked Users",   value: "—",   sub: "Accounts with lock flag" },
  { label: "Pending Resets", value: "—",   sub: "Awaiting first logon" },
  { label: "Last Activity",  value: "Today", sub: "Most recent provisioning action" },
];

export function SystemDetailPage({ system, onBack, onEdit }: {
  system: SapSystem;
  onBack: () => void;
  onEdit?: () => void;
}) {
  const env = ENV_META[system.environment] ?? { color: F.muted, bg: F.bg, dot: F.muted };
  const createdDate = new Date(system.createdAt);

  return (
    <div className="min-h-full" style={{ background: F.bg }}>
      {/* Page Header Bar */}
      <div className="px-6 py-3 flex items-center gap-3" style={{ background: F.white, borderBottom: `1px solid ${F.border}` }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors"
          style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
        >
          <ArrowLeft size={14} /> Back to Data Management
        </button>
        <div className="h-4 w-px" style={{ background: F.border }} />
        <span className="text-sm" style={{ color: F.muted }}>SAP Basis</span>
        <span className="text-sm" style={{ color: F.muted }}>/</span>
        <span className="text-sm" style={{ color: F.muted }}>Data Management</span>
        <span className="text-sm" style={{ color: F.muted }}>/</span>
        <span className="text-sm" style={{ color: F.text }}>{system.systemId}</span>
        {onEdit && (
          <button
            onClick={onEdit}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm rounded"
            style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
          >
            <Pencil size={13} /> Edit System
          </button>
        )}
      </div>

      <div className="p-6 max-w-6xl mx-auto flex flex-col gap-5">
        {/* Hero Card */}
        <div className="rounded-lg overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
          <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #1d2d3e 0%, #0d1e2e 100%)" }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded text-xs" style={{ background: env.bg, color: env.color }}>{system.environment}</span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs" style={{ background: system.status === "Active" ? "#f1fdf6" : "#f5f6f7", color: system.status === "Active" ? F.success : F.muted }}>
                    {system.status === "Active" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {system.status}
                  </span>
                </div>
                <h1 className="text-2xl text-white">{system.systemId}</h1>
                <p className="text-base mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>{system.systemName}</p>
                {system.description && (
                  <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>{system.description}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <Hash size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                  <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>Client {system.client}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                  <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{system.host}</span>
                  <CopyButton text={system.host} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderTop: `1px solid ${F.border}` }}>
            {MOCK_METRICS.map((m) => (
              <div key={m.label} className="px-5 py-3">
                <p className="text-xs mb-0.5" style={{ color: F.muted }}>{m.label}</p>
                <p className="text-sm" style={{ color: F.text }}>{m.value}</p>
                <p className="text-xs" style={{ color: F.muted }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left — System Identity & Connection */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Section title="System Identity" icon={<Server size={14} />}>
              <InfoRow label="System ID" value={system.systemId} mono />
              <InfoRow label="System Name" value={system.systemName} />
              <InfoRow label="Client Number" value={system.client} mono />
              <InfoRow label="Environment" >
                <span className="px-2 py-0.5 rounded text-xs" style={{ background: env.bg, color: env.color }}>{system.environment}</span>
              </InfoRow>
              <InfoRow label="Status">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: env.dot }} />
                  <span className="text-sm" style={{ color: system.status === "Active" ? F.success : F.muted }}>{system.status}</span>
                </span>
              </InfoRow>
              {system.description && <InfoRow label="Description" value={system.description} />}
            </Section>

            <Section title="Connection Details" icon={<Globe size={14} />}>
              <InfoRow label="Host / Application Server">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono" style={{ color: F.text }}>{system.host}</span>
                  <CopyButton text={system.host} />
                </div>
              </InfoRow>
              <InfoRow label="SAP System Number" value="00" mono />
              <InfoRow label="Message Server" value={`${system.host}:3600`} mono />
              <InfoRow label="RFC Destination" value={`${system.systemId}_CLNT${system.client}`} mono />
              <div className="py-3">
                <p className="text-xs mb-2" style={{ color: F.muted }}>Connection String</p>
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded" style={{ background: F.bg, border: `1px solid ${F.border}` }}>
                  <code className="text-xs font-mono truncate" style={{ color: F.text }}>
                    ashost={system.host} sysnr=00 client={system.client}
                  </code>
                  <CopyButton text={`ashost=${system.host} sysnr=00 client=${system.client}`} />
                </div>
              </div>
            </Section>
          </div>

          {/* Right — Metadata & Audit */}
          <div className="flex flex-col gap-5">
            <Section title="Registry Metadata" icon={<Activity size={14} />}>
              <InfoRow label="Registered On" value={createdDate.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })} />
              <InfoRow label="Registered By" value={system.createdBy} />
              <InfoRow label="Record ID">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono" style={{ color: F.muted }}>{system.id.slice(0, 12)}…</span>
                  <CopyButton text={system.id} />
                </div>
              </InfoRow>
              <InfoRow label="Last Modified" value="—" />
            </Section>

            <Section title="Authorization Scope" icon={<Shield size={14} />}>
              <div className="py-3 flex flex-col gap-2">
                {[
                  { label: "User Provisioning",   enabled: true  },
                  { label: "Password Reset",       enabled: true  },
                  { label: "Role Assignment",      enabled: system.environment !== "Sandbox" },
                  { label: "Bulk Operations",      enabled: system.environment !== "Production" },
                  { label: "System Decommission",  enabled: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: F.text }}>{item.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: item.enabled ? "#f1fdf6" : "#f5f6f7", color: item.enabled ? F.success : F.muted }}>
                      {item.enabled ? "Allowed" : "Restricted"}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Timestamps" icon={<Clock size={14} />}>
              <InfoRow label="Created"      value={createdDate.toLocaleDateString()} />
              <InfoRow label="Day"          value={createdDate.toLocaleDateString("en-GB", { weekday: "long" })} />
              <InfoRow label="ISO 8601"     value={system.createdAt} mono />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
