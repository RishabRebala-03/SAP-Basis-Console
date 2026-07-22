import { ArrowLeft, Clock, User, Server, Activity, CheckCircle2, AlertCircle, AlertTriangle, Shield, Hash, Copy, Check } from "lucide-react";
import { useState } from "react";
import { AuditLog, AuditModule, AuditStatus } from "../../contexts/AppContext";

const F = {
  primary: "#0070f2", success: "#107e3e", error: "#bb0000",
  warning: "#e9730c", text: "#32363a", muted: "#74777a",
  border: "#d9d9d9", bg: "#f5f6f7", white: "#ffffff",
};

const MODULE_META: Record<AuditModule, { color: string; bg: string }> = {
  "Single User":     { color: "#0070f2", bg: "#e8f2ff" },
  "Bulk User":       { color: "#6a1b9a", bg: "#f3e5f5" },
  "Password Reset":  { color: "#e9730c", bg: "#fff8f0" },
  "Lock/Unlock":     { color: "#bb0000", bg: "#fff2f2" },
  "Data Management": { color: "#107e3e", bg: "#f1fdf6" },
  "System":          { color: "#74777a", bg: "#f5f6f7" },
};

const STATUS_META: Record<AuditStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  Success: { color: "#107e3e", bg: "#f1fdf6", icon: <CheckCircle2 size={16} style={{ color: "#107e3e" }} /> },
  Failed:  { color: "#bb0000", bg: "#fff2f2", icon: <AlertCircle size={16} style={{ color: "#bb0000" }} /> },
  Warning: { color: "#e9730c", bg: "#fff8f0", icon: <AlertTriangle size={16} style={{ color: "#e9730c" }} /> },
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

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-4 rounded" style={{ background: F.bg, border: `1px solid ${F.border}` }}>
      <p className="text-xs mb-1.5" style={{ color: F.muted }}>{label}</p>
      <p className="text-sm" style={{ color: F.text, fontFamily: mono ? "monospace" : "inherit" }}>{value || "—"}</p>
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
      <div className="p-5">{children}</div>
    </div>
  );
}

export function AuditDetailPage({ log, onBack }: { log: AuditLog; onBack: () => void }) {
  const mod  = MODULE_META[log.module];
  const sta  = STATUS_META[log.status];
  const ts   = new Date(log.timestamp);

  return (
    <div className="min-h-full" style={{ background: F.bg }}>
      {/* Page Header Bar */}
      <div className="px-6 py-3 flex items-center gap-3" style={{ background: F.white, borderBottom: `1px solid ${F.border}` }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors"
          style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
        >
          <ArrowLeft size={14} /> Back to Audit Logs
        </button>
        <div className="h-4 w-px" style={{ background: F.border }} />
        <span className="text-sm" style={{ color: F.muted }}>SAP Basis</span>
        <span className="text-sm" style={{ color: F.muted }}>/</span>
        <span className="text-sm" style={{ color: F.muted }}>Audit Logs</span>
        <span className="text-sm" style={{ color: F.muted }}>/</span>
        <span className="text-sm" style={{ color: F.text }}>Log Detail</span>
      </div>

      <div className="p-6 max-w-6xl mx-auto flex flex-col gap-5">
        {/* Hero Header */}
        <div className="rounded-lg overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
          <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #1d2d3e 0%, #0d1e2e 100%)" }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded text-xs" style={{ background: mod.bg, color: mod.color }}>{log.module}</span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs" style={{ background: sta.bg, color: sta.color }}>
                    {sta.icon} {log.status}
                  </span>
                </div>
                <h1 className="text-xl text-white">{log.action}</h1>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {ts.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at {ts.toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Hash size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{log.id}</span>
                <CopyButton text={log.id} />
              </div>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderTop: `1px solid ${F.border}`, borderColor: F.border }}>
            {[
              { label: "Target Object", value: log.targetObject, mono: true },
              { label: "System / Client", value: log.system !== "—" ? `${log.system} / ${log.client}` : "N/A" },
              { label: "Performed By", value: log.performedBy },
              { label: "Duration", value: `${log.durationMs} ms` },
            ].map((item) => (
              <div key={item.label} className="px-5 py-3">
                <p className="text-xs mb-0.5" style={{ color: F.muted }}>{item.label}</p>
                <p className="text-sm" style={{ color: F.text, fontFamily: item.mono ? "monospace" : "inherit" }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column — key details */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Action Details */}
            <Section title="Action Details" icon={<Activity size={14} />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <InfoCard label="Module"       value={log.module} />
                <InfoCard label="Action Type"  value={log.action} />
                <InfoCard label="Target Object" value={log.targetObject} mono />
                <InfoCard label="Status"       value={log.status} />
              </div>
              <div>
                <p className="text-xs mb-2" style={{ color: F.muted }}>Description</p>
                <div className="p-4 rounded text-sm" style={{ background: F.bg, border: `1px solid ${F.border}`, color: F.text, lineHeight: 1.7 }}>
                  {log.details}
                </div>
              </div>
              {log.errorCode && (
                <div className="mt-3 flex items-center justify-between p-3 rounded" style={{ background: "#fff2f2", border: `1px solid #bb000030` }}>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: F.error }}>Error Code</p>
                    <code className="text-sm" style={{ color: F.error }}>{log.errorCode}</code>
                  </div>
                  <CopyButton text={log.errorCode} />
                </div>
              )}
            </Section>

            {/* Change Delta */}
            {(log.changesBefore || log.changesAfter) && (
              <Section title="Change Delta" icon={<Shield size={14} />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {log.changesBefore && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: F.error }} />
                        <p className="text-xs" style={{ color: F.error }}>Before Change</p>
                      </div>
                      <div className="p-3 rounded text-xs font-mono" style={{ background: "#fff2f2", border: `1px solid #bb000020`, color: F.error, lineHeight: 1.8 }}>
                        {log.changesBefore}
                      </div>
                    </div>
                  )}
                  {log.changesAfter && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: F.success }} />
                        <p className="text-xs" style={{ color: F.success }}>After Change</p>
                      </div>
                      <div className="p-3 rounded text-xs font-mono" style={{ background: "#f1fdf6", border: `1px solid #107e3e20`, color: F.success, lineHeight: 1.8 }}>
                        {log.changesAfter}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}
          </div>

          {/* Right column — session & metadata */}
          <div className="flex flex-col gap-5">
            {/* Session & Network */}
            <Section title="Session & Network" icon={<Server size={14} />}>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Session ID",   value: log.sessionId, mono: true },
                  { label: "IP Address",   value: log.ipAddress, mono: true },
                  { label: "Performed By", value: log.performedBy },
                  { label: "Duration",     value: `${log.durationMs} ms` },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5 pb-3" style={{ borderBottom: `1px solid ${F.border}` }}>
                    <p className="text-xs" style={{ color: F.muted }}>{item.label}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm truncate" style={{ color: F.text, fontFamily: item.mono ? "monospace" : "inherit" }}>{item.value}</p>
                      {item.mono && <CopyButton text={item.value} />}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Timestamp Details */}
            <Section title="Timestamp" icon={<Clock size={14} />}>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Date",      value: ts.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) },
                  { label: "Time",      value: ts.toLocaleTimeString() },
                  { label: "Day",       value: ts.toLocaleDateString("en-GB", { weekday: "long" }) },
                  { label: "ISO 8601",  value: log.timestamp, mono: true },
                  { label: "Unix Epoch", value: String(Math.floor(ts.getTime() / 1000)), mono: true },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-start gap-2 pb-3" style={{ borderBottom: `1px solid ${F.border}` }}>
                    <p className="text-xs flex-shrink-0" style={{ color: F.muted }}>{item.label}</p>
                    <p className="text-xs text-right" style={{ color: F.text, fontFamily: item.mono ? "monospace" : "inherit" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* User Info */}
            <Section title="Operator" icon={<User size={14} />}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0" style={{ background: F.primary }}>
                  {log.performedBy.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm" style={{ color: F.text }}>{log.performedBy}</p>
                  <p className="text-xs" style={{ color: F.muted }}>SAP Basis Administrator</p>
                </div>
              </div>
              <div className="p-3 rounded text-xs" style={{ background: F.bg, border: `1px solid ${F.border}`, color: F.muted }}>
                Session: <span className="font-mono" style={{ color: F.text }}>{log.sessionId}</span>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
