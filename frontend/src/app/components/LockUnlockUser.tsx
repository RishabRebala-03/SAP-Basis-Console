import { useState, useMemo, useEffect, useRef } from "react";
import {
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  X,
  Server,
  History,
  Search,
} from "lucide-react";

import { useAppContext } from "../contexts/AppContext";
import { lockUserApi, unlockUserApi } from "../../api/sapApi";
import { SearchableFilterDropdown } from "./SearchableFilterDropdown";
import type { TableDisplayPreferences } from "./pages/SettingsPage";

/* =========================================================
   COLORS
========================================================= */

const F = {
  primary: "#0070f2",
  success: "#107e3e",
  error: "#bb0000",
  warning: "#e9730c",

  text: "var(--app-text)",
  muted: "var(--app-muted)",
  border: "var(--app-border)",
  bg: "var(--app-bg)",
  white: "var(--app-surface)",
};

type Action = "lock" | "unlock";

/* =========================================================
   SYSTEM SELECTOR
========================================================= */

function SystemSelector({
  systems,
  selectedId,
  onChange,
}: {
  systems: ReturnType<typeof useAppContext>["systems"];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const active = systems.filter(
    (s) => s.status === "Active"
  );

  return (
    <div
      className="mb-5 flex items-center gap-3 p-3 rounded"
      style={{
        background: "#e8f2ff",
        border: `1px solid #0070f230`,
      }}
    >
      <Server
        size={15}
        style={{
          color: F.primary,
          flexShrink: 0,
        }}
      />

      <label
        className="text-sm flex-shrink-0"
        style={{
          color: F.primary,
        }}
      >
        Target System:
      </label>

      <select
        value={selectedId}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="flex-1 px-3 py-1.5 text-sm rounded outline-none"
        style={{
          border: `1px solid #0070f240`,
          background: F.white,
          color: F.text,
        }}
      >
        <option value="">
          — Select SAP System —
        </option>

        {active.map((s) => (
          <option
            key={s.id}
            value={s.id}
          >
            {s.systemId} – {s.systemName} (Client{" "}
            {s.client})
          </option>
        ))}
      </select>

      {selectedId &&
        (() => {
          const s = systems.find(
            (x) =>
              x.id === selectedId ||
              x.systemId === selectedId
          );

          if (!s) return null;

          return (
            <span
              className="text-xs px-2 py-0.5 rounded flex-shrink-0"
              style={{
                background:
                  s.environment === "Production"
                    ? "#fff2f2"
                    : s.environment === "Quality"
                    ? "#fff8f0"
                    : "#e8f2ff",

                color:
                  s.environment === "Production"
                    ? F.error
                    : s.environment === "Quality"
                    ? F.warning
                    : F.primary,
              }}
            >
              {s.environment}
            </span>
          );
        })()}
    </div>
  );
}

/* =========================================================
   CONFIRM DIALOG
========================================================= */

function ConfirmDialog({
  username,
  action,
  system,
  onConfirm,
  onCancel,
}: {
  username: string;
  action: Action;
  system: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isLock = action === "lock";

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.dataset.theme ===
      "dark";

  const panelBg = isDark
    ? isLock
      ? "rgba(187, 0, 0, 0.16)"
      : "rgba(233, 115, 12, 0.16)"
    : isLock
    ? "#fff2f2"
    : "#fff8f0";

  const panelBorder = isDark
    ? isLock
      ? "rgba(187, 0, 0, 0.35)"
      : "rgba(233, 115, 12, 0.35)"
    : isLock
    ? "#bb000030"
    : "#e9730c30";

  const panelText = isDark
    ? "rgba(255,255,255,0.92)"
    : F.text;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="rounded shadow-xl w-full max-w-md mx-4"
        style={{
          background: F.white,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            borderBottom: `1px solid ${F.border}`,
          }}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert
              size={18}
              style={{
                color: isLock
                  ? F.error
                  : F.warning,
              }}
            />

            <h3
              className="text-base font-semibold"
              style={{
                color: F.text,
              }}
            >
              Confirm{" "}
              {isLock
                ? "Lock User"
                : "Unlock User"}
            </h3>
          </div>

          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-gray-100"
            style={{
              color: F.muted,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <div
            className="flex items-start gap-3 p-3 rounded mb-4"
            style={{
              background: panelBg,
              border: `1px solid ${panelBorder}`,
            }}
          >
            {isLock ? (
              <Lock
                size={16}
                style={{
                  color: F.error,
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              />
            ) : (
              <Unlock
                size={16}
                style={{
                  color: F.warning,
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              />
            )}

            <p
              className="text-sm"
              style={{
                color: panelText,
              }}
            >
              {isLock
                ? "You are about to lock"
                : "You are about to unlock"}{" "}
              user{" "}
              <strong>
                {username.toUpperCase()}
              </strong>{" "}
              in{" "}
              <strong>{system}</strong>.
            </p>
          </div>

          <p
            className="text-xs"
            style={{
              color: F.muted,
            }}
          >
            This action will execute directly
            against the live SAP OData Gateway
            and will be recorded in the security
            audit log.
          </p>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 px-5 py-4"
          style={{
            borderTop: `1px solid ${F.border}`,
            background: "#fafafa",
          }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded"
            style={{
              border: `1px solid ${F.border}`,
              background: F.white,
              color: F.text,
            }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded text-white font-medium"
            style={{
              background: isLock
                ? F.error
                : F.success,
            }}
          >
            {isLock
              ? "Lock User"
              : "Unlock User"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const cfg =
    status === "Success"
      ? {
          bg: "#f1fdf6",
          color: F.success,
          border: "#107e3e40",
        }
      : status === "Failed"
      ? {
          bg: "#fff2f2",
          color: F.error,
          border: "#bb000040",
        }
      : {
          bg: "#fff8f0",
          color: F.warning,
          border: "#e9730c40",
        };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {status === "Success" ? (
        <CheckCircle2 size={10} />
      ) : (
        <AlertCircle size={10} />
      )}

      {status}
    </span>
  );
}

/* =========================================================
   SEARCH AUTOCOMPLETE
========================================================= */

function SearchAutocomplete({
  value,
  onChange,
  targets,
  systems,
  performers,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  targets: string[];
  systems: string[];
  performers: string[];
  placeholder?: string;
}) {
  const [open, setOpen] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (
      e: MouseEvent
    ) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          e.target as Node
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      onOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        onOutside
      );
  }, []);

  const groups = [
    {
      label: "Username",
      values: targets,
    },
    {
      label: "System",
      values: systems,
    },
    {
      label: "Performed By",
      values: performers,
    },
  ]
    .map((g) => ({
      ...g,

      visible: value
        ? g.values.filter((v) =>
            v
              .toLowerCase()
              .includes(
                value.toLowerCase()
              )
          )
        : g.values.slice(0, 5),
    }))
    .filter(
      (g) => g.visible.length > 0
    );

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <div className="relative">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2"
          style={{
            color: F.muted,
          }}
        />

        <input
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          onFocus={() =>
            setOpen(true)
          }
          placeholder={
            placeholder ??
            "Search usernames, systems, performers…"
          }
          className="w-full px-3 py-1.5 pl-7 text-xs rounded outline-none"
          style={{
            border: `1px solid ${F.border}`,
            background: F.white,
            color: F.text,
          }}
        />
      </div>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded shadow-xl z-50 overflow-hidden"
          style={{
            background: F.white,
            border: `1px solid ${F.border}`,
          }}
        >
          <div
            style={{
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            {groups.map((g) => (
              <div key={g.label}>
                <div
                  className="px-3 py-1.5 text-[11px]"
                  style={{
                    background: "#fafafa",
                    borderBottom: `1px solid ${F.border}`,
                    color: F.muted,
                  }}
                >
                  {g.label}
                </div>

                {g.visible.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(v);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--app-subtle)]"
                    style={{
                      color: F.text,
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   RECENT ACTIVITY
   WITH SCROLLBAR
========================================================= */

function HistoryTabMini() {
  const { auditLogs } =
    useAppContext();

  const lockLogs = useMemo(
    () =>
      auditLogs
        .filter(
          (l) =>
            l.module === "Lock/Unlock"
        )
        .sort(
          (a, b) =>
            new Date(
              b.timestamp
            ).getTime() -
            new Date(
              a.timestamp
            ).getTime()
        ),
    [auditLogs]
  );

  if (lockLogs.length === 0) {
    return (
      <div
        className="p-4 text-xs text-center"
        style={{
          color: F.muted,
        }}
      >
        No recent lock/unlock activity.
      </div>
    );
  }

  return (
    <div
      style={{
        maxHeight: "360px",
        overflowY: "auto",
        overflowX: "hidden",

        /* Firefox */
        scrollbarWidth: "thin",
        scrollbarColor: `${F.border} transparent`,
      }}
    >
      <div
        className="divide-y"
        style={{
          borderColor: F.border,
        }}
      >
        {lockLogs.map((l) => (
          <div
            key={l.id}
            className="p-3 text-xs"
            style={{
              minHeight: "78px",
            }}
          >
            <div className="flex items-center justify-between mb-1 gap-2">
              <span
                className="font-semibold truncate"
                style={{
                  color: F.text,
                  maxWidth: "180px",
                }}
                title={l.targetObject}
              >
                {l.targetObject}
              </span>

              <StatusBadge
                status={l.status}
              />
            </div>

            <p
              style={{
                color: F.muted,
              }}
            >
              {l.action} in {l.system}
            </p>

            <p
              className="text-[11px] mt-0.5"
              style={{
                color: F.muted,
              }}
            >
              {new Date(
                l.timestamp
              ).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   HISTORY TAB
========================================================= */

function HistoryTab({
  displayPreferences,
}: {
  displayPreferences: TableDisplayPreferences;
}) {
  const { auditLogs } =
    useAppContext();

  const lockLogs = useMemo(
    () =>
      auditLogs.filter(
        (l) =>
          l.module === "Lock/Unlock"
      ),
    [auditLogs]
  );

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [systemFilter, setSystemFilter] =
    useState("All");

  const [appliedSearch, setAppliedSearch] =
    useState("");

  const [appliedStatus, setAppliedStatus] =
    useState("All");

  const [appliedSystem, setAppliedSystem] =
    useState("All");

  const [hasSubmitted, setHasSubmitted] =
    useState(false);

  const uniqueSystems = useMemo(
    () =>
      [
        "All",
        ...Array.from(
          new Set(
            lockLogs
              .map((l) => l.system)
              .filter(
                (s) =>
                  s &&
                  s !== "—"
              )
          )
        ),
      ].sort(),
    [lockLogs]
  );

  const filtered = useMemo(() => {
    if (!hasSubmitted) return [];

    const q =
      appliedSearch
        .trim()
        .toLowerCase();

    return lockLogs.filter((l) => {
      const matchSearch =
        !q ||
        l.targetObject
          .toLowerCase()
          .includes(q) ||
        l.system
          .toLowerCase()
          .includes(q) ||
        l.performedBy
          .toLowerCase()
          .includes(q) ||
        l.details
          .toLowerCase()
          .includes(q) ||
        l.action
          .toLowerCase()
          .includes(q);

      const matchStatus =
        appliedStatus === "All" ||
        l.status ===
          appliedStatus;

      const matchSystem =
        appliedSystem === "All" ||
        l.system ===
          appliedSystem;

      return (
        matchSearch &&
        matchStatus &&
        matchSystem
      );
    });
  }, [
    lockLogs,
    appliedSearch,
    appliedStatus,
    appliedSystem,
    hasSubmitted,
  ]);

  const activeFilterCount = [
    statusFilter !== "All",
    systemFilter !== "All",
    search.trim().length > 0,
  ].filter(Boolean).length;

  const submitFilters = () => {
    setAppliedSearch(search);
    setAppliedStatus(
      statusFilter
    );
    setAppliedSystem(
      systemFilter
    );
    setHasSubmitted(true);
  };

  const clearAll = () => {
    setSearch("");
    setStatusFilter("All");
    setSystemFilter("All");

    setAppliedSearch("");
    setAppliedStatus("All");
    setAppliedSystem("All");

    setHasSubmitted(false);
  };

  if (lockLogs.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 gap-3 rounded"
        style={{
          background: F.white,
          border: `1px solid ${F.border}`,
          color: F.muted,
        }}
      >
        <History
          size={36}
          strokeWidth={1.2}
        />

        <p className="text-sm">
          No lock / unlock audit logs
          recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded overflow-visible relative"
      style={{
        background: F.white,
        border: `1px solid ${F.border}`,
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          borderBottom: `1px solid ${F.border}`,
          backgroundColor:
            "#1d2d3e",
          color: "white",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        <h3
          className="text-sm font-semibold"
          style={{
            color: "white",
          }}
        >
          Lock / Unlock Audit History
        </h3>

        <span
          className="text-xs px-2.5 py-0.5 rounded font-medium"
          style={{
            background: "#e8f2ff",
            color: F.primary,
          }}
        >
          {lockLogs.length} total
          entries
        </span>
      </div>

      {/* Filters */}
      <div
        className="px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
        style={{
          borderBottom: `1px solid ${F.border}`,
        }}
      >
        <div>
          <label
            className="block text-xs mb-1"
            style={{
              color: F.muted,
            }}
          >
            Search
          </label>

          <SearchAutocomplete
            value={search}
            onChange={setSearch}
            targets={Array.from(
              new Set(
                lockLogs
                  .map(
                    (l) =>
                      l.targetObject
                  )
                  .filter(Boolean)
              )
            )}
            systems={uniqueSystems.filter(
              (s) => s !== "All"
            )}
            performers={Array.from(
              new Set(
                lockLogs
                  .map(
                    (l) =>
                      l.performedBy
                  )
                  .filter(Boolean)
              )
            )}
            placeholder="Search values…"
          />
        </div>

        <SearchableFilterDropdown
          label="System"
          value={
            systemFilter === "All"
              ? ""
              : systemFilter
          }
          onChange={(v) =>
            setSystemFilter(
              v || "All"
            )
          }
          options={uniqueSystems.map(
            (s) =>
              s === "All"
                ? ""
                : s
          )}
          allLabel="All Systems"
          placeholder="Search system…"
        />

        <SearchableFilterDropdown
          label="Status"
          value={
            statusFilter === "All"
              ? ""
              : statusFilter
          }
          onChange={(v) =>
            setStatusFilter(
              v || "All"
            )
          }
          options={[
            "",
            "Success",
            "Failed",
            "Warning",
          ]}
          allLabel="All Statuses"
          placeholder="Search status…"
        />
      </div>

      {/* Filter Buttons */}
      <div
        className="px-4 py-2.5 flex items-center gap-3"
        style={{
          borderBottom: `1px solid ${F.border}`,
        }}
      >
        <button
          onClick={submitFilters}
          className="px-4 py-1.5 text-xs rounded text-white"
          style={{
            background: F.primary,
          }}
        >
          Go
        </button>

        <button
          onClick={clearAll}
          className="px-3 py-1.5 text-xs rounded"
          style={{
            border: `1px solid ${F.border}`,
            color: activeFilterCount
              ? F.error
              : F.muted,
            background:
              activeFilterCount
                ? "#fff2f2"
                : F.white,
          }}
        >
          Clear All Filters
        </button>

        <span
          className="text-xs ml-auto"
          style={{
            color: F.muted,
          }}
        >
          {hasSubmitted
            ? `${filtered.length} entries shown`
            : "0 entries shown"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr
              style={{
                borderBottom: `1px solid ${F.border}`,
                backgroundColor:
                  "#1d2d3e",
                color: "white",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {displayPreferences.showRowNumbers && (
                <th className="p-3">
                  #
                </th>
              )}

              <th className="p-3">
                Time
              </th>

              <th className="p-3">
                Username
              </th>

              <th className="p-3">
                Action
              </th>

              <th className="p-3">
                System
              </th>

              <th className="p-3">
                Status
              </th>

              <th className="p-3">
                Performed By
              </th>

              <th className="p-3">
                Details
              </th>
            </tr>
          </thead>

          <tbody
            className="divide-y"
            style={{
              borderColor: F.border,
            }}
          >
            {(hasSubmitted
              ? filtered
              : []
            ).map((log, i) => (
              <tr
                key={log.id}
                className="hover:bg-[var(--app-subtle)]"
              >
                {displayPreferences.showRowNumbers && (
                  <td className="p-3 text-gray-500">
                    {i + 1}
                  </td>
                )}

                <td className="p-3 text-gray-500 whitespace-nowrap">
                  {new Date(
                    log.timestamp
                  ).toLocaleString()}
                </td>

                <td
                  className="p-3 font-semibold"
                  style={{
                    color: F.text,
                  }}
                >
                  {log.targetObject}
                </td>

                <td className="p-3">
                  {log.action}
                </td>

                <td className="p-3">
                  {log.system}
                </td>

                <td className="p-3">
                  <StatusBadge
                    status={log.status}
                  />
                </td>

                <td className="p-3 text-gray-600">
                  {log.performedBy}
                </td>

                <td className="p-3 text-gray-500">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export function LockUnlockUser({
  displayPreferences,
}: {
  displayPreferences?: TableDisplayPreferences;
}) {
  const {
    systems,
    logAction,
  } = useAppContext();

  const prefs =
    displayPreferences ?? {
      alternateRowStriping: true,
      freezeFirstColumn: false,
      showRowNumbers: false,
    };

  const [activeTab, setActiveTab] =
    useState<
      "control" | "history"
    >("control");

  const [selectedSystem, setSelectedSystem] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [action, setAction] =
    useState<Action>("unlock");

  const [reason, setReason] =
    useState("");

  const [errors, setErrors] =
    useState<
      Record<string, string>
    >({});

  const [
    showConfirmDialog,
    setShowConfirmDialog,
  ] = useState(false);

  const [status, setStatus] =
    useState<
      "idle" | "success" | "error"
    >("idle");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [lastAction, setLastAction] =
    useState<{
      username: string;
      action: Action;
      system: string;
      verifiedAt?: string;
    } | null>(null);

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validate = (): boolean => {
    const e: Record<
      string,
      string
    > = {};

    if (!selectedSystem) {
      e.system =
        "Please select a target SAP system";
    }

    if (!username.trim()) {
      e.username =
        "Username is required";
    }

    setErrors(e);

    return (
      Object.keys(e).length === 0
    );
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmitClick = () => {
    if (validate()) {
      setShowConfirmDialog(true);
    }
  };

  /* =======================================================
     CONFIRM ACTION
  ======================================================= */

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    const sys = systems.find(
      (s) =>
        s.id === selectedSystem ||
        s.systemId === selectedSystem
    );

    const targetSystemId = (
      sys?.systemId ||
      selectedSystem ||
      "SHD"
    )
      .replace("sys-", "")
      .toUpperCase();

    const uname =
      username
        .trim()
        .toUpperCase();

    const defaultReason =
      action === "lock"
        ? "Locked via BASIS Console"
        : "Wrong Password Attempts";

    const finalReason =
      reason.trim() ||
      defaultReason;

    try {
      const res =
        action === "lock"
          ? await lockUserApi({
              system_id:
                targetSystemId,
              username: uname,
              reason:
                finalReason,
            })
          : await unlockUserApi({
              system_id:
                targetSystemId,
              username: uname,
              reason:
                finalReason,
            });

      const verifiedTime =
        res.VerifiedAt ||
        new Date().toLocaleTimeString();

      const newStatus =
        res.LockStatus ||
        (action === "lock"
          ? "Locked"
          : "Unlocked");

      setLoading(false);

      setLastAction({
        username: uname,
        action,
        system:
          targetSystemId,
        verifiedAt:
          verifiedTime,
      });

      if (
        action === "unlock" &&
        newStatus === "Locked"
      ) {
        setStatus("error");

        setErrorMessage(
          res.Message ||
            "Unlock request was submitted, but SAP still reports the user as locked."
        );
      } else {
        setStatus("success");
      }

      logAction({
        module:
          "Lock/Unlock",

        action:
          action === "lock"
            ? "Lock User"
            : "Unlock User",

        targetObject: uname,

        system:
          targetSystemId,

        client:
          sys?.client ?? "100",

        status:
          action === "unlock" &&
          newStatus === "Locked"
            ? "Warning"
            : "Success",

        durationMs: 850,

        details:
          res.Message ||
          (action === "lock"
            ? `User ${uname} locked in ${targetSystemId}`
            : `User ${uname} unlocked in ${targetSystemId}`),

        changesBefore:
          `Status: ${
            action === "lock"
              ? "Active"
              : "Locked"
          }`,

        changesAfter:
          `Status: ${newStatus}`,
      });
    } catch (err: any) {
      setLoading(false);
      setStatus("error");

      setErrorMessage(
        err.message ||
          `${
            action === "lock"
              ? "Lock"
              : "Unlock"
          } failed in SAP system.`
      );

      logAction({
        module:
          "Lock/Unlock",

        action:
          action === "lock"
            ? "Lock User"
            : "Unlock User",

        targetObject: uname,

        system:
          targetSystemId,

        client:
          sys?.client ?? "100",

        status: "Failed",

        durationMs: 550,

        details:
          err.message ||
          `${
            action === "lock"
              ? "Lock"
              : "Unlock"
          } failed in SAP system.`,

        errorCode:
          "SAP_SYSTEM_ERROR",
      });
    }
  };

  /* =======================================================
     RESET
  ======================================================= */

  const handleReset = () => {
    setUsername("");
    setAction("unlock");
    setReason("");
    setErrors({});
    setStatus("idle");
    setErrorMessage("");
    setSelectedSystem("");
    setLastAction(null);
  };

  /* =======================================================
     SELECTED SYSTEM
  ======================================================= */

  const sys = systems.find(
    (s) =>
      s.id === selectedSystem ||
      s.systemId === selectedSystem
  );

  /* =======================================================
     TAB BUTTON
  ======================================================= */

  const tabBtn = (
    active: boolean
  ) =>
    ({
      color: active
        ? F.primary
        : F.muted,

      fontWeight: active
        ? "600"
        : "400",

      borderBottom: active
        ? `2px solid ${F.primary}`
        : "2px solid transparent",

      marginBottom: "-2px",

      background:
        "transparent",

      outline: "none",
    } as React.CSSProperties);

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <div className="max-w-6xl mx-auto">

      {/* CONFIRM DIALOG */}

      {showConfirmDialog && (
        <ConfirmDialog
          username={username}
          action={action}
          system={
            sys
              ? `${sys.systemId} / Client ${sys.client}`
              : "—"
          }
          onConfirm={
            handleConfirm
          }
          onCancel={() =>
            setShowConfirmDialog(
              false
            )
          }
        />
      )}

      {/* PAGE TITLE */}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1
            className="text-xl font-semibold"
            style={{
              color: F.text,
            }}
          >
            Lock / Unlock User
          </h1>
        </div>

        <p
          className="text-sm"
          style={{
            color: F.muted,
          }}
        >
          Directly enter the SAP username
          to execute lock or unlock
          actions against live SAP OData
          Gateway.
        </p>
      </div>

      {/* TABS */}

      <div
        className="flex gap-0 mb-6"
        style={{
          borderBottom: `2px solid ${F.border}`,
        }}
      >
        <button
          id="tab-lock-control"
          onClick={() =>
            setActiveTab(
              "control"
            )
          }
          className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all"
          style={tabBtn(
            activeTab ===
              "control"
          )}
        >
          <Lock size={15} />
          User Control
        </button>

        <button
          id="tab-lock-history"
          onClick={() =>
            setActiveTab(
              "history"
            )
          }
          className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all"
          style={tabBtn(
            activeTab ===
              "history"
          )}
        >
          <History size={15} />
          History
        </button>
      </div>

      {/* ===================================================
          CONTROL TAB
      =================================================== */}

      {activeTab === "control" && (
        <>
          {/* SUCCESS MESSAGE */}

          {status === "success" &&
            lastAction && (
              <div
                className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded"
                style={{
                  background:
                    "#f1fdf6",
                  border: `1px solid ${F.success}`,
                }}
              >
                <CheckCircle2
                  size={18}
                  style={{
                    color:
                      F.success,
                    flexShrink: 0,
                    marginTop:
                      "2px",
                  }}
                />

                <div>
                  <p
                    className="text-sm"
                    style={{
                      color:
                        F.success,
                    }}
                  >
                    User{" "}
                    <strong>
                      {
                        lastAction.username
                      }
                    </strong>{" "}
                    successfully{" "}
                    <strong>
                      {lastAction.action ===
                      "lock"
                        ? "locked"
                        : "unlocked"}
                    </strong>{" "}
                    in{" "}
                    <strong>
                      {
                        lastAction.system
                      }
                    </strong>
                    .
                  </p>

                  <p
                    className="text-xs mt-0.5"
                    style={{
                      color:
                        F.muted,
                    }}
                  >
                    Executed in SAP
                    system and
                    recorded in audit
                    log at{" "}
                    {lastAction.verifiedAt ||
                      new Date().toLocaleTimeString()}
                    .
                  </p>
                </div>
              </div>
            )}

          {/* ERROR MESSAGE */}

          {status === "error" && (
            <div
              className="mb-5 flex items-start gap-3 px-4 py-3 rounded"
              style={{
                background:
                  "#fff2f2",
                border: `1px solid ${F.error}`,
              }}
            >
              <AlertCircle
                size={18}
                style={{
                  color: F.error,
                  flexShrink: 0,
                  marginTop:
                    "2px",
                }}
              />

              <div>
                <p
                  className="text-sm font-medium"
                  style={{
                    color:
                      F.error,
                  }}
                >
                  {errorMessage ||
                    "Operation failed in SAP system."}
                </p>
              </div>
            </div>
          )}

          {/* SYSTEM SELECTOR */}

          <SystemSelector
            systems={systems}
            selectedId={
              selectedSystem
            }
            onChange={(id) => {
              setSelectedSystem(id);
              setStatus("idle");
            }}
          />

          {/* SYSTEM ERROR */}

          {errors.system && (
            <p
              className="flex items-center gap-1 mb-4 text-xs"
              style={{
                color: F.error,
              }}
            >
              <AlertCircle size={11} />
              {errors.system}
            </p>
          )}

          {/* MAIN GRID */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT SIDE */}

            <div className="lg:col-span-2">
              <div
                className="rounded"
                style={{
                  background:
                    F.white,
                  border: `1px solid ${F.border}`,
                  overflow:
                    "hidden",
                }}
              >
                {/* HEADER */}

                <div
                  className="px-5 py-3"
                  style={{
                    backgroundColor:
                      "#1d2d3e",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  <h3
                    className="text-sm font-semibold"
                    style={{
                      color:
                        "white",
                    }}
                  >
                    User Account
                    Control
                  </h3>
                </div>

                {/* FORM */}

                <div className="p-5">

                  {/* USERNAME */}

                  <div className="mb-5">
                    <label
                      className="block text-sm mb-1"
                      style={{
                        color:
                          F.muted,
                      }}
                    >
                      SAP Username{" "}
                      <span
                        style={{
                          color:
                            F.error,
                        }}
                      >
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      value={
                        username
                      }
                      onChange={(e) => {
                        setUsername(
                          e.target
                            .value
                        );

                        setStatus(
                          "idle"
                        );

                        if (
                          errors.username
                        ) {
                          setErrors(
                            (
                              errs
                            ) => {
                              const n =
                                {
                                  ...errs,
                                };

                              delete n.username;

                              return n;
                            }
                          );
                        }
                      }}
                      placeholder="Enter SAP Username (e.g. JDOE)"
                      className="w-full px-3 py-2 text-sm rounded outline-none"
                      style={{
                        border: `1px solid ${
                          errors.username
                            ? F.error
                            : F.border
                        }`,
                        background:
                          F.white,
                        color:
                          F.text,
                      }}
                    />

                    {errors.username && (
                      <p
                        className="flex items-center gap-1 mt-1 text-xs"
                        style={{
                          color:
                            F.error,
                        }}
                      >
                        <AlertCircle
                          size={11}
                        />

                        {
                          errors.username
                        }
                      </p>
                    )}
                  </div>

                  {/* ACTION */}

                  <div className="mb-5">
                    <label
                      className="block text-sm mb-2"
                      style={{
                        color:
                          F.muted,
                      }}
                    >
                      Action{" "}
                      <span
                        style={{
                          color:
                            F.error,
                        }}
                      >
                        *
                      </span>
                    </label>

                    <div className="grid grid-cols-2 gap-3">

                      {/* UNLOCK */}

                      <button
                        type="button"
                        onClick={() =>
                          setAction(
                            "unlock"
                          )
                        }
                        className="flex items-center gap-3 p-4 rounded text-left transition-all"
                        style={{
                          border: `2px solid ${
                            action ===
                            "unlock"
                              ? F.success
                              : F.border
                          }`,
                          background:
                            action ===
                            "unlock"
                              ? "#f1fdf6"
                              : F.white,
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background:
                              action ===
                              "unlock"
                                ? F.success
                                : "#f5f6f7",
                          }}
                        >
                          <Unlock
                            size={16}
                            style={{
                              color:
                                action ===
                                "unlock"
                                  ? "#fff"
                                  : F.muted,
                            }}
                          />
                        </div>

                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{
                              color:
                                action ===
                                "unlock"
                                  ? F.success
                                  : F.text,
                            }}
                          >
                            Unlock User
                          </p>

                          <p
                            className="text-xs mt-0.5"
                            style={{
                              color:
                                F.muted,
                            }}
                          >
                            Unlocks user
                            directly via
                            SAP OData API
                          </p>
                        </div>
                      </button>

                      {/* LOCK */}

                      <button
                        type="button"
                        onClick={() =>
                          setAction(
                            "lock"
                          )
                        }
                        className="flex items-center gap-3 p-4 rounded text-left transition-all"
                        style={{
                          border: `2px solid ${
                            action ===
                            "lock"
                              ? F.error
                              : F.border
                          }`,
                          background:
                            action ===
                            "lock"
                              ? "#fff2f2"
                              : F.white,
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background:
                              action ===
                              "lock"
                                ? F.error
                                : "#f5f6f7",
                          }}
                        >
                          <Lock
                            size={16}
                            style={{
                              color:
                                action ===
                                "lock"
                                  ? "#fff"
                                  : F.muted,
                            }}
                          />
                        </div>

                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{
                              color:
                                action ===
                                "lock"
                                  ? F.error
                                  : F.text,
                            }}
                          >
                            Lock User
                          </p>

                          <p
                            className="text-xs mt-0.5"
                            style={{
                              color:
                                F.muted,
                            }}
                          >
                            Locks user
                            directly via
                            SAP OData API
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* REASON */}

                  <div className="mb-2">
                    <label
                      className="block text-sm mb-1"
                      style={{
                        color:
                          F.muted,
                      }}
                    >
                      Reason
                      (Optional)
                    </label>

                    <input
                      type="text"
                      value={reason}
                      onChange={(e) =>
                        setReason(
                          e.target
                            .value
                        )
                      }
                      placeholder={
                        action ===
                        "lock"
                          ? "Locked via BASIS Console"
                          : "Wrong Password Attempts"
                      }
                      className="w-full px-3 py-2 text-sm rounded outline-none"
                      style={{
                        border: `1px solid ${F.border}`,
                        background:
                          F.white,
                        color:
                          F.text,
                      }}
                    />
                  </div>
                </div>

                {/* BUTTONS */}

                <div
                  className="px-5 py-4 flex items-center justify-between"
                  style={{
                    borderTop: `1px solid ${F.border}`,
                    background:
                      "#fafafa",
                  }}
                >
                  <button
                    type="button"
                    onClick={
                      handleReset
                    }
                    className="px-4 py-2 text-sm rounded font-medium"
                    style={{
                      border: `1px solid ${F.border}`,
                      background:
                        F.white,
                      color:
                        F.text,
                    }}
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleSubmitClick
                    }
                    disabled={
                      loading ||
                      !selectedSystem ||
                      !username.trim()
                    }
                    className="flex items-center gap-2 px-5 py-2 text-sm rounded text-white font-medium shadow-sm"
                    style={{
                      background:
                        loading ||
                        !selectedSystem ||
                        !username.trim()
                          ? "#a0c4f8"
                          : action ===
                            "lock"
                          ? F.error
                          : F.success,
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" />

                        Applying in
                        SAP...
                      </>
                    ) : action ===
                      "lock" ? (
                      <>
                        <Lock
                          size={14}
                        />
                        Lock User
                      </>
                    ) : (
                      <>
                        <Unlock
                          size={14}
                        />
                        Unlock User
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================
                RIGHT SIDE - RECENT ACTIVITY
            ================================================= */}

            <div>
              <div
                className="rounded"
                style={{
                  background:
                    F.white,
                  border: `1px solid ${F.border}`,
                  overflow:
                    "hidden",
                }}
              >
                {/* RECENT ACTIVITY HEADER */}

                <div
                  className="px-4 py-3"
                  style={{
                    backgroundColor:
                      "#1d2d3e",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  <h3
                    className="text-sm font-semibold"
                    style={{
                      color:
                        "white",
                    }}
                  >
                    Recent Activity
                  </h3>
                </div>

                {/* SCROLLABLE RECENT ACTIVITY */}

                <HistoryTabMini />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================================================
          HISTORY TAB
      =================================================== */}

      {activeTab === "history" && (
        <HistoryTab
          displayPreferences={
            prefs
          }
        />
      )}
    </div>
  );
}