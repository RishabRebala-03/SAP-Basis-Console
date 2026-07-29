import { useState } from "react";
import { ArrowLeft, Shield, Bell, Monitor, ChevronRight, ToggleLeft, ToggleRight, Save, CheckCircle2 } from "lucide-react";

const F = {
  primary: "#0070f2", success: "#107e3e", error: "#bb0000",
  warning: "#e9730c", text: "var(--app-text)", muted: "var(--app-muted)",
  border: "var(--app-border)", bg: "var(--app-bg)", white: "var(--app-surface)",
};

export interface AppSettings {
  language: string; dateFormat: string; timezone: string; sessionTimeout: string;
  emailAlerts: boolean; browserNotifs: boolean; density: string; theme: string;
  auditRetention: string; defaultSystem: string;
  notificationTriggers: {
    userCreationSuccess: boolean;
    userCreationFailure: boolean;
    bulkImportCompletion: boolean;
    passwordReset: boolean;
    wrongPasswordUnlockEvents: boolean;
    systemRegistryChanges: boolean;
  };
  displayPreferences: {
    alternateRowStriping: boolean;
    freezeFirstColumn: boolean;
    showRowNumbers: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: "English (US)", dateFormat: "DD/MM/YYYY", timezone: "UTC+0 (London)",
  sessionTimeout: "30 minutes", emailAlerts: true, browserNotifs: false,
  density: "Comfortable", theme: "Light", auditRetention: "90 days", defaultSystem: "",
  notificationTriggers: {
    userCreationSuccess: true,
    userCreationFailure: true,
    bulkImportCompletion: true,
    passwordReset: false,
    wrongPasswordUnlockEvents: true,
    systemRegistryChanges: false,
  },
  displayPreferences: {
    alternateRowStriping: true,
    freezeFirstColumn: false,
    showRowNumbers: false,
  },
};

type Section = "security" | "notifications" | "display";

const SECTIONS: { id: Section; label: string; icon: typeof Globe }[] = [
  { id: "security",      label: "Security",       icon: Shield  },
  { id: "notifications", label: "Notifications",  icon: Bell    },
  { id: "display",       label: "Display",        icon: Monitor },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{ color: value ? F.primary : F.muted }}>
      {value ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
    </button>
  );
}

function SelectField({ label, sub, value, options, onChange }: { label: string; sub?: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${F.border}` }}>
      <div>
        <p className="text-sm" style={{ color: F.text }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: F.muted }}>{sub}</p>}
      </div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="text-sm px-3 py-1.5 rounded outline-none" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${F.border}` }}>
      <div>
        <p className="text-sm" style={{ color: F.text }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: F.muted }}>{sub}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

export function SettingsPage({ settings, onChange, onBack }: {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  onBack: () => void;
}) {
  const [active, setActive] = useState<Section>("display");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = (k: keyof AppSettings) => (v: string | boolean) => onChange({ [k]: v });

  return (
    <div className="min-h-full" style={{ background: F.bg }}>
      {/* Page Header */}
      <div className="px-6 py-3 flex items-center gap-3" style={{ background: F.white, borderBottom: `1px solid ${F.border}` }}>
        <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
          <ArrowLeft size={14} /> Back to Console
        </button>
        <div className="h-4 w-px" style={{ background: F.border }} />
        <span className="text-sm" style={{ color: F.muted }}>SAP Basis</span>
        <span className="text-sm" style={{ color: F.muted }}>/</span>
        <span className="text-sm" style={{ color: F.text }}>Application Settings</span>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-1.5 text-sm rounded text-white"
          style={{ background: saved ? F.success : F.primary }}
        >
          {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
        </button>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-xl" style={{ color: F.text }}>Application Settings</h1>
          <p className="text-sm mt-1" style={{ color: F.muted }}>Configure application preferences, security policies, and display options.</p>
        </div>

        <div className="flex gap-6">
          {/* Left Nav */}
          <aside className="flex-shrink-0 w-52">
            <div className="rounded sticky top-6" style={{ background: F.white, border: `1px solid ${F.border}` }}>
              {SECTIONS.map((s) => {
                const isActive = active === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left transition-colors"
                    style={{
                      borderBottom: `1px solid ${F.border}`,
                      background: isActive ? "var(--app-active)" : F.white,
                      borderLeft: `3px solid ${isActive ? F.primary : "transparent"}`,
                    }}
                  >
                    <s.icon size={14} style={{ color: isActive ? F.primary : F.muted }} />
                    <span className="text-sm" style={{ color: isActive ? F.primary : F.text }}>{s.label}</span>
                    {isActive && <ChevronRight size={13} className="ml-auto" style={{ color: F.primary }} />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Content */}
          <div className="flex-1 min-w-0">
<<<<<<< Updated upstream
            {active === "general" && (
              <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <div className="px-6 py-4" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
                  <h2 className="text-base" style={{ color: F.text }}>General Settings</h2>
                  <p className="text-xs mt-0.5" style={{ color: F.muted }}>Localization, formatting, and regional preferences.</p>
                </div>
                <div className="px-6">
                  <SelectField label="Language" sub="Interface display language" value={settings.language} options={["English (US)", "English (UK)", "German (DE)", "French (FR)", "Japanese (JP)", "Chinese (Simplified)"]} onChange={set("language") as (v: string) => void} />
                  <SelectField label="Date Format" sub="How dates are displayed throughout the application" value={settings.dateFormat} options={["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MMM-YYYY"]} onChange={set("dateFormat") as (v: string) => void} />
                  <SelectField label="Time Zone" sub="Time zone for displaying timestamps" value={settings.timezone} options={["UTC-8 (Pacific)", "UTC-5 (Eastern)", "UTC+0 (London)", "UTC+1 (Berlin/Paris)", "UTC+3 (Moscow)", "UTC+5:30 (India)", "UTC+8 (Singapore/HK)", "UTC+9 (Tokyo)"]} onChange={set("timezone") as (v: string) => void} />
                  <SelectField label="Default System" sub="Pre-selected system in provisioning modules" value={settings.defaultSystem || "None"} options={["None", "PRD – Production", "QAS – Quality", "DEV – Development"]} onChange={set("defaultSystem") as (v: string) => void} />
                </div>
              </div>
            )}

=======
>>>>>>> Stashed changes
            {active === "security" && (
              <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <div className="px-6 py-4" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
                  <h2 className="text-base" style={{ color: F.text }}>Security Settings</h2>
                  <p className="text-xs mt-0.5" style={{ color: F.muted }}>Session management and audit trail configuration.</p>
                </div>
                <div className="px-6">
                  <SelectField label="Session Timeout" sub="Automatically log out after inactivity" value={settings.sessionTimeout} options={["15 minutes", "30 minutes", "1 hour", "2 hours", "4 hours", "8 hours"]} onChange={set("sessionTimeout") as (v: string) => void} />
                  <SelectField label="Audit Log Retention" sub="Duration to retain audit log entries" value={settings.auditRetention} options={["30 days", "60 days", "90 days", "180 days", "1 year", "Indefinite"]} onChange={set("auditRetention") as (v: string) => void} />
                  <div className="py-4" style={{ borderBottom: `1px solid ${F.border}` }}>
                    <p className="text-sm mb-3" style={{ color: F.text }}>Current Session</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["Logged in as", "ADMIN"],
                        ["Role", "Basis Administrator"],
                        ["Session ID", "SES-A4B7C2D1"],
                        ["Login Time", "Today 08:30 UTC"],
                        ["IP Address", "10.42.8.201"],
                        ["Auth Objects", "S_USER_GRP, S_USR_ADM, S_TCODE"],
                      ].map(([k, v]) => (
                        <div key={k} className="p-3 rounded" style={{ background: F.bg, border: `1px solid ${F.border}` }}>
                          <p className="text-xs mb-0.5" style={{ color: F.muted }}>{k}</p>
                          <p className="text-xs" style={{ color: F.text }}>{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {active === "notifications" && (
              <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <div className="px-6 py-4" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
                  <h2 className="text-base" style={{ color: F.text }}>Notification Preferences</h2>
                  <p className="text-xs mt-0.5" style={{ color: F.muted }}>Configure how and when you receive alerts.</p>
                </div>
                <div className="px-6">
                  <ToggleField label="Email Alerts" sub="Receive provisioning results and failures by email" value={settings.emailAlerts} onChange={set("emailAlerts") as (v: boolean) => void} />
                  <ToggleField label="Browser Notifications" sub="Show desktop push notifications for completed actions" value={settings.browserNotifs} onChange={set("browserNotifs") as (v: boolean) => void} />
                  <div className="py-4" style={{ borderBottom: `1px solid ${F.border}` }}>
                    <p className="text-sm mb-3" style={{ color: F.text }}>Notification Triggers</p>
                    <div className="flex flex-col gap-2">
<<<<<<< Updated upstream
                      {[
                        { label: "User creation success", default: true },
                        { label: "User creation failure", default: true },
                        { label: "Bulk import completion", default: true },
                        { label: "Password reset", default: false },
                        { label: "Lock / unlock events", default: true },
                        { label: "System registry changes", default: false },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-3 rounded" style={{ background: F.bg, border: `1px solid ${F.border}` }}>
                          <span className="text-sm" style={{ color: F.text }}>{item.label}</span>
                          <Toggle value={item.default} onChange={() => {}} />
=======
                      {([
                        ["User creation success", settings.notificationTriggers.userCreationSuccess, "userCreationSuccess"],
                        ["User creation failure", settings.notificationTriggers.userCreationFailure, "userCreationFailure"],
                        ["Bulk import completion", settings.notificationTriggers.bulkImportCompletion, "bulkImportCompletion"],
                        ["Password reset", settings.notificationTriggers.passwordReset, "passwordReset"],
                        ["Wrong-password unlock events", settings.notificationTriggers.wrongPasswordUnlockEvents, "wrongPasswordUnlockEvents"],
                        ["System registry changes", settings.notificationTriggers.systemRegistryChanges, "systemRegistryChanges"],
                      ] as const).map(([label, value, key]) => (
                        <div key={label} className="flex items-center justify-between p-3 rounded" style={{ background: F.bg, border: `1px solid ${F.border}` }}>
                          <span className="text-sm" style={{ color: F.text }}>{label}</span>
                          <Toggle
                            value={value}
                            onChange={(next) => onChange({ notificationTriggers: { ...settings.notificationTriggers, [key]: next } })}
                          />
>>>>>>> Stashed changes
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {active === "display" && (
              <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <div className="px-6 py-4" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
                  <h2 className="text-base" style={{ color: F.text }}>Display & Appearance</h2>
                  <p className="text-xs mt-0.5" style={{ color: F.muted }}>UI density, theme, and layout preferences.</p>
                </div>
                <div className="px-6">
                  <SelectField label="Display Density" sub="Controls spacing and padding throughout the UI" value={settings.density} options={["Compact", "Comfortable", "Spacious"]} onChange={set("density") as (v: string) => void} />
                  <SelectField label="Theme" sub="Application colour theme (Light is the SAP Horizon default)" value={settings.theme} options={["Light", "Dark"]} onChange={set("theme") as (v: string) => void} />
                  <div className="py-4" style={{ borderBottom: `1px solid ${F.border}` }}>
                    <p className="text-sm mb-3" style={{ color: F.text }}>Table Preferences</p>
                    <div className="flex flex-col gap-3">
                      {([
                        ["Alternate row striping", settings.displayPreferences.alternateRowStriping, "alternateRowStriping"],
                        ["Freeze first column on scroll", settings.displayPreferences.freezeFirstColumn, "freezeFirstColumn"],
                        ["Show row numbers", settings.displayPreferences.showRowNumbers, "showRowNumbers"],
                      ] as const).map(([label, value, key]) => (
                        <div key={label} className="flex items-center justify-between p-3 rounded" style={{ background: F.bg, border: `1px solid ${F.border}` }}>
                          <span className="text-sm" style={{ color: F.text }}>{label}</span>
                          <Toggle
                            value={value}
                            onChange={(next) => onChange({ displayPreferences: { ...settings.displayPreferences, [key]: next } })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
