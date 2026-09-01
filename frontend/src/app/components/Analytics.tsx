import { useState, useMemo, useId } from "react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Filter,
  ChevronDown,
  X,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Server,
  Users,
  ArrowUpRight,
  Calendar,
} from "lucide-react";

import {
  useAppContext,
  AuditModule,
  AuditStatus,
} from "../contexts/AppContext";

import { DashNav } from "./Dashboard";
import { SearchableFilterDropdown } from "./SearchableFilterDropdown";

/* =========================================================
   COLORS
========================================================= */

const F = {
  primary: "#0070f2",
  success: "#107e3e",
  error: "#bb0000",
  warning: "#e9730c",
  purple: "#6a1b9a",

  text: "var(--app-text)",
  muted: "var(--app-muted)",
  border: "var(--app-border)",
  bg: "var(--app-bg)",
  white: "var(--app-surface)",
};

/* =========================================================
   MODULE META
========================================================= */

const MODULE_META: Record<
  AuditModule,
  {
    color: string;
    bg: string;
  }
> = {
  "Single User": {
    color: "#0070f2",
    bg: "#e8f2ff",
  },

  "Bulk User": {
    color: "#6a1b9a",
    bg: "#f3e5f5",
  },

  "Password Reset": {
    color: "#e9730c",
    bg: "#fff8f0",
  },

  "Lock/Unlock": {
    color: "#bb0000",
    bg: "#fff2f2",
  },

  "Data Management": {
    color: "#107e3e",
    bg: "#f1fdf6",
  },

  System: {
    color: "#74777a",
    bg: "#f5f6f7",
  },
};

/* =========================================================
   STATUS META
========================================================= */

const STATUS_META: Record<
  AuditStatus,
  {
    color: string;
  }
> = {
  Success: {
    color: "#107e3e",
  },

  Failed: {
    color: "#bb0000",
  },

  Warning: {
    color: "#e9730c",
  },
};

/* =========================================================
   TIME RANGES
========================================================= */

const TIME_RANGES = [
  {
    id: "24h",
    label: "Last 24 hours",
    hours: 24,
  },

  {
    id: "7d",
    label: "Last 7 days",
    days: 7,
  },

  {
    id: "14d",
    label: "Last 14 days",
    days: 14,
  },

  {
    id: "30d",
    label: "Last 30 days",
    days: 30,
  },
];

/* =========================================================
   TYPES
========================================================= */

interface Props {
  onNavigate: (view: DashNav) => void;
}

/* =========================================================
   FILTER NORMALIZER
========================================================= */

function normalizeFilterValue(value: string) {
  return value.trim().toLowerCase();
}

/* =========================================================
   LOCAL DATE KEY
========================================================= */

function getLocalDateKey(
  dateInput: string | number | Date
) {
  const date = new Date(dateInput);

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* =========================================================
   LOCAL HOUR KEY
========================================================= */

function getLocalHourKey(
  dateInput: string | number | Date
) {
  const date = new Date(dateInput);

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const hour = String(
    date.getHours()
  ).padStart(2, "0");

  return `${year}-${month}-${day}-${hour}`;
}

/* =========================================================
   START OF DAY
========================================================= */

function startOfDay(date: Date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

/* =========================================================
   START OF HOUR
========================================================= */

function startOfHour(date: Date) {
  const result = new Date(date);

  result.setMinutes(0, 0, 0);

  return result;
}

/* =========================================================
   PANEL
========================================================= */

function Panel({
  title,
  icon,
  subtitle,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: F.white,
        border: `1px solid ${F.border}`,
      }}
    >
      <div
        className="flex items-center gap-2 px-5 py-3"
        style={{
          borderBottom: `1px solid ${F.border}`,
          background: "#fafafa",
        }}
      >
        <span style={{ color: F.muted }}>
          {icon}
        </span>

        <div>
          <h3
            className="text-sm"
            style={{
              color: F.text,
            }}
          >
            {title}
          </h3>

          {subtitle && (
            <p
              className="text-xs"
              style={{
                color: F.muted,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex-1" />

        {action}
      </div>

      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   CHART TOOLTIP
========================================================= */

function ChartTooltip({
  active,
  payload,
  label,
}: any) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className="rounded shadow-lg px-3 py-2"
      style={{
        background: F.white,
        border: `1px solid ${F.border}`,
      }}
    >
      {label !== undefined && (
        <p
          className="text-xs mb-1"
          style={{
            color: F.muted,
          }}
        >
          {label}
        </p>
      )}

      {payload.map(
        (p: any, i: number) => (
          <p
            key={i}
            className="text-sm"
            style={{
              color:
                p.color ||
                p.fill ||
                F.text,
            }}
          >
            {p.name}:{" "}
            <span
              style={{
                color: F.text,
              }}
            >
              {p.value}
            </span>
          </p>
        )
      )}
    </div>
  );
}

/* =========================================================
   ANALYTICS
========================================================= */

export function Analytics({
  onNavigate,
}: Props) {
  const {
    auditLogs,
    systems,
  } = useAppContext();

  const uid = useId().replace(
    /[^a-zA-Z0-9]/g,
    ""
  );

  /* =======================================================
     FILTERS
     CLOSED BY DEFAULT
  ======================================================= */

  const [showFilters, setShowFilters] =
    useState(false);

  const [range, setRange] =
    useState("30d");

  const [systemFilter, setSystemFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  /* =======================================================
     CURRENT TIME
  ======================================================= */

  const now = Date.now();

  /* =======================================================
     UNIQUE SYSTEMS
  ======================================================= */

  const uniqueSystems = useMemo(
    () =>
      [
        "All",
        ...Array.from(
          new Set(
            auditLogs
              .map((l) => l.system)
              .filter(
                (s) =>
                  s &&
                  s !== "—"
              )
          )
        ),
      ].sort((a, b) =>
        a.localeCompare(b)
      ),
    [auditLogs]
  );

  /* =======================================================
     SELECTED RANGE
  ======================================================= */

  const selectedRange = useMemo(
    () =>
      TIME_RANGES.find(
        (r) => r.id === range
      ) || TIME_RANGES[3],
    [range]
  );

  /* =======================================================
     FILTERED LOGS
  ======================================================= */

  const logs = useMemo(() => {
    const currentDate =
      new Date(now);

    const today =
      startOfDay(currentDate);

    return auditLogs.filter((l) => {
      const timestamp =
        new Date(
          l.timestamp
        ).getTime();

      if (
        Number.isNaN(timestamp)
      ) {
        return false;
      }

      let inRange = true;

      /* -----------------------------------------------
         LAST 24 HOURS
      ----------------------------------------------- */

      if (range === "24h") {
        const last24Hours =
          now -
          24 *
            60 *
            60 *
            1000;

        inRange =
          timestamp >=
            last24Hours &&
          timestamp <= now;
      }

      /* -----------------------------------------------
         LAST 7 DAYS
      ----------------------------------------------- */

      if (range === "7d") {
        const startDate =
          new Date(today);

        startDate.setDate(
          startDate.getDate() - 6
        );

        const logDate =
          startOfDay(
            new Date(timestamp)
          );

        inRange =
          logDate >= startDate &&
          logDate <= today;
      }

      /* -----------------------------------------------
         LAST 14 DAYS
      ----------------------------------------------- */

      if (range === "14d") {
        const startDate =
          new Date(today);

        startDate.setDate(
          startDate.getDate() - 13
        );

        const logDate =
          startOfDay(
            new Date(timestamp)
          );

        inRange =
          logDate >= startDate &&
          logDate <= today;
      }

      /* -----------------------------------------------
         LAST 30 DAYS
      ----------------------------------------------- */

      if (range === "30d") {
        const startDate =
          new Date(today);

        startDate.setDate(
          startDate.getDate() - 29
        );

        const logDate =
          startOfDay(
            new Date(timestamp)
          );

        inRange =
          logDate >= startDate &&
          logDate <= today;
      }

      /* -----------------------------------------------
         SYSTEM FILTER
      ----------------------------------------------- */

      const inSys =
        systemFilter === "All" ||
        normalizeFilterValue(
          l.system
        ) ===
          normalizeFilterValue(
            systemFilter
          );

      /* -----------------------------------------------
         STATUS FILTER
      ----------------------------------------------- */

      const inStatus =
        statusFilter === "All" ||
        normalizeFilterValue(
          l.status
        ) ===
          normalizeFilterValue(
            statusFilter
          );

      return (
        inRange &&
        inSys &&
        inStatus
      );
    });
  }, [
    auditLogs,
    range,
    systemFilter,
    statusFilter,
    now,
  ]);

  /* =======================================================
     FILTER ACTIVE
  ======================================================= */

  const filtersActive =
    range !== "30d" ||
    systemFilter !== "All" ||
    statusFilter !== "All";

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setRange("30d");
    setSystemFilter("All");
    setStatusFilter("All");
  };

  /* =======================================================
     OPERATIONS OVER TIME
  ======================================================= */

  const trendData = useMemo(() => {
    /* =====================================================
       24 HOURS
    ===================================================== */

    if (range === "24h") {
      const currentHour =
        startOfHour(
          new Date(now)
        );

      const buckets: {
        date: string;
        label: string;
        Success: number;
        Failed: number;
        Warning: number;
      }[] = [];

      for (
        let i = 23;
        i >= 0;
        i--
      ) {
        const hour =
          new Date(
            currentHour
          );

        hour.setHours(
          hour.getHours() - i
        );

        const key =
          getLocalHourKey(hour);

        buckets.push({
          date: key,

          label:
            hour.toLocaleTimeString(
              "en-GB",
              {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }
            ),

          Success: 0,
          Failed: 0,
          Warning: 0,
        });
      }

      logs.forEach((log) => {
        const key =
          getLocalHourKey(
            log.timestamp
          );

        const bucket =
          buckets.find(
            (item) =>
              item.date === key
          );

        if (!bucket) {
          return;
        }

        if (
          log.status ===
          "Success"
        ) {
          bucket.Success += 1;
        }

        if (
          log.status ===
          "Failed"
        ) {
          bucket.Failed += 1;
        }

        if (
          log.status ===
          "Warning"
        ) {
          bucket.Warning += 1;
        }
      });

      return buckets;
    }

    /* =====================================================
       DAILY RANGES
    ===================================================== */

    const numberOfDays =
      range === "7d"
        ? 7
        : range === "14d"
        ? 14
        : 30;

    const today =
      startOfDay(
        new Date(now)
      );

    const buckets: {
      date: string;
      label: string;
      Success: number;
      Failed: number;
      Warning: number;
    }[] = [];

    for (
      let i = numberOfDays - 1;
      i >= 0;
      i--
    ) {
      const date =
        new Date(today);

      date.setDate(
        date.getDate() - i
      );

      const key =
        getLocalDateKey(date);

      buckets.push({
        date: key,

        label:
          date.toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "short",
            }
          ),

        Success: 0,
        Failed: 0,
        Warning: 0,
      });
    }

    logs.forEach((log) => {
      const key =
        getLocalDateKey(
          log.timestamp
        );

      const bucket =
        buckets.find(
          (item) =>
            item.date === key
        );

      if (!bucket) {
        return;
      }

      if (
        log.status ===
        "Success"
      ) {
        bucket.Success += 1;
      }

      if (
        log.status ===
        "Failed"
      ) {
        bucket.Failed += 1;
      }

      if (
        log.status ===
        "Warning"
      ) {
        bucket.Warning += 1;
      }
    });

    return buckets;
  }, [
    logs,
    range,
    now,
  ]);

  /* =======================================================
     GRAPH DISPLAY SETTINGS
  ======================================================= */

  const trendLabelInterval =
    range === "24h"
      ? 1
      : 0;

  const isDailyGraph =
    range === "7d" ||
    range === "14d" ||
    range === "30d";

  /* =======================================================
     TREND SUBTITLE
  ======================================================= */

  const trendSubtitle =
    range === "24h"
      ? "Hourly activity · Last 24 hours"
      : range === "7d"
      ? "Daily activity · Last 7 days"
      : range === "14d"
      ? "Daily activity · Last 14 days"
      : "Daily activity · Last 30 days";

  /* =======================================================
     MODULE DATA
  ======================================================= */

  const moduleData = useMemo(() => {
    const moduleCounts: Record<
      string,
      number
    > = {};

    logs.forEach((l) => {
      moduleCounts[l.module] =
        (moduleCounts[l.module] ??
          0) + 1;
    });

    return (
      Object.keys(
        MODULE_META
      ) as AuditModule[]
    )
      .map((mod) => ({
        name: mod,

        value:
          moduleCounts[mod] ??
          0,

        color:
          MODULE_META[mod]
            .color,
      }))
      .filter(
        (x) => x.value > 0
      );
  }, [logs]);

  /* =======================================================
     STATUS DATA
  ======================================================= */

  const statusData = useMemo(() => {
    const statusCounts: Record<
      string,
      number
    > = {};

    logs.forEach((l) => {
      statusCounts[l.status] =
        (statusCounts[l.status] ??
          0) + 1;
    });

    return (
      Object.keys(
        STATUS_META
      ) as AuditStatus[]
    )
      .map((status) => ({
        name: status,

        value:
          statusCounts[
            status
          ] ?? 0,

        color:
          STATUS_META[status]
            .color,
      }))
      .filter(
        (x) => x.value > 0
      );
  }, [logs]);

  /* =======================================================
     PERFORMER DATA
  ======================================================= */

  const performerData = useMemo(() => {
    const performerCounts: Record<
      string,
      number
    > = {};

    logs.forEach((l) => {
      performerCounts[
        l.performedBy
      ] =
        (performerCounts[
          l.performedBy
        ] ?? 0) + 1;
    });

    return Object.entries(
      performerCounts
    )
      .map(
        ([name, value]) => ({
          name,
          value,
        })
      )
      .sort(
        (a, b) =>
          b.value - a.value
      );
  }, [logs]);

  /* =======================================================
     SYSTEM DATA
  ======================================================= */

  const systemData = useMemo(() => {
    const systemCounts: Record<
      string,
      number
    > = {};

    logs.forEach((l) => {
      if (
        l.system === "—"
      ) {
        return;
      }

      systemCounts[l.system] =
        (systemCounts[l.system] ??
          0) + 1;
    });

    return Object.entries(
      systemCounts
    )
      .map(
        ([name, value]) => ({
          name,
          value,
        })
      )
      .sort(
        (a, b) =>
          b.value - a.value
      );
  }, [logs]);

  /* =======================================================
     SUMMARY VALUES
  ======================================================= */

  const total = logs.length;

  const success =
    logs.filter(
      (l) =>
        l.status ===
        "Success"
    ).length;

  const successRate =
    total
      ? Math.round(
          (success /
            total) *
            100
        )
      : 0;

  const avgDuration =
    total
      ? Math.round(
          logs.reduce(
            (sum, l) =>
              sum +
              l.durationMs,
            0
          ) / total
        )
      : 0;

  const activeSystems =
    systems.filter(
      (s) =>
        s.status ===
        "Active"
    ).length;

  /* =======================================================
     SUMMARY CARDS
  ======================================================= */

  const summary = [
    {
      label: "Total Operations",
      value: total,
      icon: Activity,
      color: F.primary,
      bg: "#e8f2ff",
      nav: "audit-logs" as DashNav,
    },

    {
      label: "Success Rate",
      value: `${successRate}%`,
      icon: TrendingUp,
      color: F.success,
      bg: "#f1fdf6",
      nav: "audit-logs" as DashNav,
    },

    {
      label: "Avg Duration",
      value: `${avgDuration}ms`,
      icon: Calendar,
      color: F.purple,
      bg: "#f3e5f5",
      nav: "audit-logs" as DashNav,
    },

    {
      label: "Active Systems",
      value: activeSystems,
      icon: Server,
      color: F.warning,
      bg: "#fff8f0",
      nav: "data-management" as DashNav,
    },
  ];

  /* =======================================================
     MAX PERFORMER
  ======================================================= */

  const maxPerformer =
    Math.max(
      1,
      ...performerData.map(
        (p) => p.value
      )
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex flex-col gap-5">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            style={{
              color: F.text,

              /*
               * BOLD ANALYTICS HEADING
               * Same visual emphasis as Dashboard
               */
              fontWeight: 700,
            }}
          >
            Analytics
          </h1>

          <p
            className="text-sm mt-0.5"
            style={{
              color: F.muted,
            }}
          >
            Provisioning activity
            insights ·{" "}
            {
              selectedRange.label
            }
          </p>
        </div>

        <button
          onClick={() =>
            onNavigate(
              "audit-logs"
            )
          }
          className="flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors"
          style={{
            background:
              F.primary,
            color: "#fff",
          }}
        >
          Open Audit Logs

          <ArrowUpRight
            size={14}
          />
        </button>
      </div>

      {/* =================================================
          COLLAPSIBLE FILTERS
          CLOSED BY DEFAULT
      ================================================= */}

      <div
        className="rounded-lg overflow-visible relative z-20"
        style={{
          background: F.white,
          border: `1px solid ${F.border}`,
        }}
      >
        <button
          type="button"
          onClick={() =>
            setShowFilters(
              (current) =>
                !current
            )
          }
          className="w-full flex items-center gap-2 px-5 py-3 text-left"
          style={{
            background:
              "#fafafa",
          }}
        >
          <Filter
            size={14}
            style={{
              color:
                F.primary,
            }}
          />

          <span
            className="text-sm"
            style={{
              color: F.text,
              
            }}
          >
            Filters
          </span>

          {filtersActive && (
            <span
              className="px-2 py-0.5 rounded-full text-xs text-white"
              style={{
                background:
                  F.primary,
              }}
            >
              Active
            </span>
          )}

          <div className="flex-1" />

          <ChevronDown
            size={16}
            style={{
              color:
                F.muted,

              transform:
                showFilters
                  ? "rotate(180deg)"
                  : "rotate(0deg)",

              transition:
                "transform 0.2s",
            }}
          />
        </button>

        {showFilters && (
          <div
            className="px-5 py-4 flex flex-wrap items-end gap-5 relative z-30"
            style={{
              borderTop: `1px solid ${F.border}`,
            }}
          >
            {/* TIME RANGE */}

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs"
                style={{
                  color:
                    F.muted,
                  fontWeight: 600,
                }}
              >
                Time Range
              </label>

              <div className="flex gap-1 flex-wrap">
                {TIME_RANGES.map(
                  (r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() =>
                        setRange(
                          r.id
                        )
                      }
                      className="px-3 py-1.5 rounded text-xs transition-colors"
                      style={{
                        background:
                          range ===
                          r.id
                            ? F.primary
                            : F.bg,

                        color:
                          range ===
                          r.id
                            ? "#fff"
                            : F.text,

                        border: `1px solid ${
                          range ===
                          r.id
                            ? F.primary
                            : F.border
                        }`,

                        fontWeight:
                          range ===
                          r.id
                            ? 600
                            : 400,
                      }}
                    >
                      {
                        r.label
                      }
                    </button>
                  )
                )}
              </div>
            </div>

            {/* SYSTEM */}

            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <SearchableFilterDropdown
                label="System"
                value={
                  systemFilter ===
                  "All"
                    ? ""
                    : systemFilter
                }
                onChange={(value) =>
                  setSystemFilter(
                    value ||
                      "All"
                  )
                }
                options={uniqueSystems.map(
                  (system) =>
                    system ===
                    "All"
                      ? ""
                      : system
                )}
                allLabel="All Systems"
                placeholder="Search system…"
              />
            </div>

            {/* STATUS */}

            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <SearchableFilterDropdown
                label="Status"
                value={
                  statusFilter ===
                  "All"
                    ? ""
                    : statusFilter
                }
                onChange={(value) =>
                  setStatusFilter(
                    value ||
                      "All"
                  )
                }
                options={[
                  "",
                  "Success",
                  "Warning",
                  "Failed",
                ]}
                allLabel="All Statuses"
                placeholder="Search status…"
              />
            </div>

            {/* CLEAR */}

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors"
              style={{
                border: `1px solid ${
                  filtersActive
                    ? "#bb000030"
                    : F.border
                }`,

                background:
                  filtersActive
                    ? "#fff2f2"
                    : F.white,

                color:
                  filtersActive
                    ? F.error
                    : F.muted,

                fontWeight: 600,
              }}
            >
              <X size={12} />

              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map(
          (s) => (
            <button
              key={s.label}
              type="button"
              onClick={() =>
                onNavigate(
                  s.nav
                )
              }
              className="rounded-lg p-4 text-left transition-all flex items-center gap-3"
              style={{
                background:
                  F.white,

                border: `1px solid ${F.border}`,
              }}
              onMouseEnter={(
                e
              ) => {
                e.currentTarget.style.borderColor =
                  s.color;

                e.currentTarget.style.boxShadow =
                  "0 4px 14px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(
                e
              ) => {
                e.currentTarget.style.borderColor =
                  F.border;

                e.currentTarget.style.boxShadow =
                  "none";
              }}
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    s.bg,
                }}
              >
                <s.icon
                  size={20}
                  style={{
                    color:
                      s.color,
                  }}
                />
              </div>

              <div>
                {/* BOLD NUMBER */}

                <p
                  style={{
                    fontSize:
                      "24px",

                    /*
                     * BOLD SUMMARY VALUE
                     */
                    fontWeight: 700,

                    color:
                      F.text,
                  }}
                >
                  {s.value}
                </p>

                {/* BOLD LABEL */}

                <p
                  className="text-xs"
                  style={{
                    color:
                      F.muted,

                    /*
                     * BOLD SUMMARY LABEL
                     */
                    fontWeight: 700,
                  }}
                >
                  {s.label}
                </p>
              </div>
            </button>
          )
        )}
      </div>

      {/* =================================================
          OPERATIONS OVER TIME
      ================================================= */}

      <Panel
        title="Operations Over Time"
        subtitle={trendSubtitle}
        icon={
          <TrendingUp
            size={14}
          />
        }
      >
        {total === 0 ? (
          <p
            className="text-sm text-center py-16"
            style={{
              color:
                F.muted,
            }}
          >
            No data for the
            selected filters.
          </p>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={
              isDailyGraph
                ? 330
                : 300
            }
          >
            <AreaChart
              data={trendData}
              margin={{
                top: 8,
                right: 8,
                left: -16,
                bottom:
                  isDailyGraph
                    ? 25
                    : 0,
              }}
              onClick={() =>
                onNavigate(
                  "audit-logs"
                )
              }
              style={{
                cursor:
                  "pointer",
              }}
            >
              <defs>
                <linearGradient
                  id={`${uid}gSuccess`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={
                      F.success
                    }
                    stopOpacity={
                      0.35
                    }
                  />

                  <stop
                    offset="100%"
                    stopColor={
                      F.success
                    }
                    stopOpacity={
                      0.02
                    }
                  />
                </linearGradient>

                <linearGradient
                  id={`${uid}gWarning`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={
                      F.warning
                    }
                    stopOpacity={
                      0.35
                    }
                  />

                  <stop
                    offset="100%"
                    stopColor={
                      F.warning
                    }
                    stopOpacity={
                      0.02
                    }
                  />
                </linearGradient>

                <linearGradient
                  id={`${uid}gFailed`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={
                      F.error
                    }
                    stopOpacity={
                      0.35
                    }
                  />

                  <stop
                    offset="100%"
                    stopColor={
                      F.error
                    }
                    stopOpacity={
                      0.02
                    }
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--app-border)"
                vertical={false}
                opacity={0.45}
              />

              <XAxis
                dataKey="label"
                interval={
                  trendLabelInterval
                }
                tick={{
                  fontSize:
                    isDailyGraph
                      ? 10
                      : 11,
                  fill: F.muted,
                }}
                axisLine={{
                  stroke:
                    F.border,
                }}
                tickLine={
                  false
                }
                angle={
                  isDailyGraph
                    ? -45
                    : 0
                }
                textAnchor={
                  isDailyGraph
                    ? "end"
                    : "middle"
                }
                height={
                  isDailyGraph
                    ? 65
                    : 30
                }
              />

              <YAxis
                tick={{
                  fontSize: 11,
                  fill: F.muted,
                }}
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                allowDecimals={
                  false
                }
              />

              <Tooltip
                content={
                  <ChartTooltip />
                }
              />

              <Legend
                wrapperStyle={{
                  fontSize:
                    "12px",
                }}
              />

              <Area
                type="monotone"
                dataKey="Success"
                stackId="1"
                stroke={
                  F.success
                }
                fill={`url(#${uid}gSuccess)`}
                strokeWidth={
                  2
                }
              />

              <Area
                type="monotone"
                dataKey="Warning"
                stackId="1"
                stroke={
                  F.warning
                }
                fill={`url(#${uid}gWarning)`}
                strokeWidth={
                  2
                }
              />

              <Area
                type="monotone"
                dataKey="Failed"
                stackId="1"
                stroke={
                  F.error
                }
                fill={`url(#${uid}gFailed)`}
                strokeWidth={
                  2
                }
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* =================================================
          MODULE + STATUS
      ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* MODULE */}

        <div className="lg:col-span-3">
          <Panel
            title="Activity by Module"
            subtitle="Click a bar to open Audit Logs"
            icon={
              <BarChart3
                size={14}
              />
            }
          >
            {moduleData.length ===
            0 ? (
              <p
                className="text-sm text-center py-16"
                style={{
                  color:
                    F.muted,
                }}
              >
                No data.
              </p>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={280}
              >
                <BarChart
                  data={
                    moduleData
                  }
                  margin={{
                    top: 8,
                    right: 8,
                    left: -16,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--app-border)"
                    vertical={
                      false
                    }
                    opacity={
                      0.45
                    }
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 10,
                      fill: F.muted,
                    }}
                    axisLine={{
                      stroke:
                        F.border,
                    }}
                    tickLine={
                      false
                    }
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={50}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: F.muted,
                    }}
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    allowDecimals={
                      false
                    }
                  />

                  <Tooltip
                    content={
                      <ChartTooltip />
                    }
                    cursor={{
                      fill: "rgba(0,112,242,0.06)",
                    }}
                  />

                  <Bar
                    dataKey="value"
                    name="Operations"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                    cursor="pointer"
                    onClick={() =>
                      onNavigate(
                        "audit-logs"
                      )
                    }
                  >
                    {moduleData.map(
                      (d) => (
                        <Cell
                          key={`${uid}-mod-${d.name}`}
                          fill={
                            d.color
                          }
                        />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        {/* STATUS */}

        <div className="lg:col-span-2">
          <Panel
            title="Status Distribution"
            subtitle="Outcome breakdown"
            icon={
              <PieIcon
                size={14}
              />
            }
          >
            {statusData.length ===
            0 ? (
              <p
                className="text-sm text-center py-16"
                style={{
                  color:
                    F.muted,
                }}
              >
                No data.
              </p>
            ) : (
              <>
                <ResponsiveContainer
                  width="100%"
                  height={200}
                >
                  <PieChart>
                    <Pie
                      data={
                        statusData
                      }
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={
                        50
                      }
                      outerRadius={
                        80
                      }
                      paddingAngle={
                        3
                      }
                      cursor="pointer"
                      onClick={() =>
                        onNavigate(
                          "audit-logs"
                        )
                      }
                    >
                      {statusData.map(
                        (d) => (
                          <Cell
                            key={`${uid}-st-${d.name}`}
                            fill={
                              d.color
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      content={
                        <ChartTooltip />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-col gap-2 mt-3">
                  {statusData.map(
                    (d) => (
                      <div
                        key={
                          d.name
                        }
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              background:
                                d.color,
                            }}
                          />

                          <span
                            className="text-xs"
                            style={{
                              color:
                                F.text,
                            }}
                          >
                            {
                              d.name
                            }
                          </span>
                        </div>

                        <span
                          className="text-xs"
                          style={{
                            color:
                              F.muted,
                          }}
                        >
                          {d.value} ·{" "}
                          {Math.round(
                            (d.value /
                              total) *
                              100
                          )}
                          %
                        </span>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </Panel>
        </div>
      </div>

      {/* =================================================
          OPERATOR + SYSTEM
      ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* OPERATOR */}

        <Panel
          title="Operations by Operator"
          subtitle="Who performed the actions"
          icon={
            <Users
              size={14}
            />
          }
        >
          {performerData.length ===
          0 ? (
            <p
              className="text-sm text-center py-8"
              style={{
                color:
                  F.muted,
              }}
            >
              No data.
            </p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {performerData.map(
                (p) => (
                  <div
                    key={
                      p.name
                    }
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                      style={{
                        background:
                          F.primary,
                      }}
                    >
                      {p.name.slice(
                        0,
                        2
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-xs"
                          style={{
                            color:
                              F.text,
                          }}
                        >
                          {
                            p.name
                          }
                        </span>

                        <span
                          className="text-xs"
                          style={{
                            color:
                              F.muted,
                          }}
                        >
                          {
                            p.value
                          }
                        </span>
                      </div>

                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{
                          background:
                            F.bg,
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${
                              (p.value /
                                maxPerformer) *
                              100
                            }%`,
                            background:
                              F.primary,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </Panel>

        {/* SYSTEM */}

        <Panel
          title="Operations by System"
          subtitle="Target environment volume"
          icon={
            <Server
              size={14}
            />
          }
        >
          {systemData.length ===
          0 ? (
            <p
              className="text-sm text-center py-8"
              style={{
                color:
                  F.muted,
              }}
            >
              No system-scoped
              data.
            </p>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(
                180,
                systemData.length *
                  46
              )}
            >
              <BarChart
                data={
                  systemData
                }
                layout="vertical"
                margin={{
                  top: 4,
                  right: 16,
                  left: 8,
                  bottom: 4,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--app-border)"
                  horizontal={
                    false
                  }
                  opacity={0.45}
                />

                <XAxis
                  type="number"
                  tick={{
                    fontSize: 11,
                    fill: F.muted,
                  }}
                  axisLine={
                    false
                  }
                  tickLine={
                    false
                  }
                  allowDecimals={
                    false
                  }
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{
                    fontSize: 11,
                    fill: F.text,
                  }}
                  axisLine={
                    false
                  }
                  tickLine={
                    false
                  }
                  width={48}
                />

                <Tooltip
                  content={
                    <ChartTooltip />
                  }
                  cursor={{
                    fill: "rgba(0,112,242,0.06)",
                  }}
                />

                <Bar
                  dataKey="value"
                  name="Operations"
                  fill={
                    F.purple
                  }
                  radius={[
                    0,
                    4,
                    4,
                    0,
                  ]}
                  cursor="pointer"
                  onClick={() =>
                    onNavigate(
                      "data-management"
                    )
                  }
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>
    </div>
  );
}