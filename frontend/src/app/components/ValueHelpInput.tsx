import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Search, ChevronDown, X, Hash } from "lucide-react";

export interface VHOption {
  value: string;
  label: string;
  secondary?: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
}

interface ValueHelpInputProps {
  value: string;
  onChange: (value: string) => void;
  options: VHOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
  inputStyle?: React.CSSProperties;
}

const F = {
  primary: "#0070f2", text: "var(--app-text)", muted: "var(--app-muted)",
  border: "var(--app-border)", bg: "var(--app-bg)", white: "var(--app-surface)", error: "#bb0000",
};

export function ValueHelpInput({
  value, onChange, options, placeholder = "Search or select…",
  error, disabled, emptyMessage = "No matching entries found.", inputStyle,
}: ValueHelpInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) => {
    const q = query.toLowerCase();
    return !q || o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q) || (o.secondary ?? "").toLowerCase().includes(q);
  });

  useEffect(() => {
    if (!open) { setQuery(""); setHighlighted(0); return; }
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (opt: VHOption) => {
    onChange(opt.value);
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) { if (e.key === "F4" || e.key === "ArrowDown") { e.preventDefault(); setOpen(true); } return; }
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    if (e.key === "Enter" && filtered[highlighted]) { select(filtered[highlighted]); }
  };

  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.querySelectorAll("[data-option]")[highlighted] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Main Input */}
      <div
        className="flex items-center w-full overflow-hidden transition-all"
        style={{
          border: `1px solid ${error ? F.error : open ? F.primary : F.border}`,
          borderRadius: "4px",
          background: disabled ? F.bg : F.white,
          boxShadow: open ? `0 0 0 2px #0070f218` : "none",
        }}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown as unknown as React.KeyboardEventHandler<HTMLInputElement>}
          placeholder={placeholder}
          disabled={disabled}
          readOnly
          className="flex-1 px-3 py-2 text-sm outline-none bg-transparent cursor-pointer"
          style={{ color: F.text }}
        />
        {value && !disabled && (
          <button onClick={clear} className="px-1.5 py-1 hover:bg-gray-100" style={{ color: F.muted }}>
            <X size={12} />
          </button>
        )}
        <button
          onClick={() => !disabled && setOpen(!open)}
          className="px-2.5 py-1.5 border-l flex items-center gap-1 transition-colors"
          style={{
            borderColor: F.border,
            background: open ? "var(--app-active)" : F.bg,
            color: open ? F.primary : F.muted,
          }}
          title="Open suggestions"
          disabled={disabled}
        >
          <Search size={12} />
          <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </button>
      </div>
      {error && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: F.error }}>▲ {error}</p>}

      {/* Dropdown Panel */}
      {open && (
        <div
          className="absolute left-0 right-0 z-50 rounded shadow-xl overflow-hidden"
          style={{ top: "calc(100% + 4px)", background: F.white, border: `1px solid ${F.border}`, maxHeight: "320px", display: "flex", flexDirection: "column" }}
        >
          {/* Search Header */}
          <div className="px-3 py-2.5 flex-shrink-0" style={{ borderBottom: `1px solid ${F.border}`, background: "var(--app-subtle)" }}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: F.muted }} />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
                  onKeyDown={handleKeyDown as unknown as React.KeyboardEventHandler<HTMLInputElement>}
                  placeholder="Search entries…"
                  className="w-full pl-7 pr-3 py-1.5 text-xs outline-none rounded"
                  style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
                />
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: F.muted }}>{filtered.length} found</span>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-200" style={{ color: F.muted }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Options List */}
          <div ref={listRef} className="overflow-y-auto" style={{ flex: 1 }}>
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs" style={{ color: F.muted }}>{emptyMessage}</div>
            ) : (
              filtered.map((opt, idx) => (
                <button
                  key={opt.value}
                  data-option
                  onClick={() => select(opt)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    background: idx === highlighted ? "var(--app-active)" : idx % 2 === 0 ? F.white : "var(--app-subtle)",
                    borderBottom: `1px solid ${F.border}`,
                  }}
                  onMouseEnter={() => setHighlighted(idx)}
                >
                  <Hash size={12} style={{ color: F.muted, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: idx === highlighted ? F.primary : F.text, fontWeight: idx === highlighted ? 500 : 400 }}>
                      {opt.value}
                      {opt.label && opt.label !== opt.value && (
                        <span className="ml-2 text-xs" style={{ color: F.muted, fontWeight: 400 }}>({opt.label})</span>
                      )}
                    </p>
                    {opt.secondary && <p className="text-xs truncate mt-0.5" style={{ color: F.muted }}>{opt.secondary}</p>}
                  </div>
                  {opt.badge && (
                    <span className="px-2 py-0.5 text-xs rounded flex-shrink-0" style={{ background: opt.badgeBg ?? "#e8f2ff", color: opt.badgeColor ?? F.primary }}>
                      {opt.badge}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-1.5 flex-shrink-0" style={{ borderTop: `1px solid ${F.border}`, background: "var(--app-subtle)" }}>
            <p className="text-xs" style={{ color: F.muted }}>↑↓ Navigate · Enter Select · Esc Close</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Shared user/system data used across modules ─── */
export const MOCK_SAP_USERS: VHOption[] = [];
