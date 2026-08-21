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
  { color: string; bg: string }
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
  { color: string }
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
   =========================================================
   
   ORDER:
   1. Last 30 days
   2. Last 7 days
   3. Last 24 hours
   4. All Time
   ========================================================= */

const TIME_RANGES = [
  {
    id: "30d",
    label: "Last 30 days",
    days: 30,
  },

  {
    id: "7d",
    label: "Last 7 days",
    days: 7,
  },

  {
    id: "24h",
    label: "Last 24 hours",
    days: 1,
  },

  {
    id: "all",
    label: "All Time",
    days: null,
  },
];

/* =========================================================
   NORMALIZE FILTER
   ========================================================= */

function normalizeFilterValue(value: string) {
  return value.trim().toLowerCase();
}

/* =========================================================
   PROPS
   ========================================================= */

interface Props {
  onNavigate: (view: DashNav) => void;
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
        className="
          flex
          items-center
          gap-2
          px-5
          py-3
        "
        style={{
          borderBottom: `1px solid ${F.border}`,
          background: "#fafafa",
        }}
      >
        <span
          style={{
            color: F.muted,
          }}
        >
          {icon}
        </span>

        <div>
          <h3
            className="text-sm"
            style={{
              color: F.text,
              fontWeight: 600,
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
      className="
        rounded
        shadow-lg
        px-3
        py-2
      "
      style={{
        background: F.white,
        border: `1px solid ${F.border}`,
      }}
    >
      {label !== undefined && (
        <p
          className="
            text-xs
            mb-1
          "
          style={{
            color: F.muted,
          }}
        >
          {label}
        </p>
      )}

      {payload.map((p: any, i: number) => (
        <p
          key={i}
          className="text-sm"
          style={{
            color: p.color || p.fill || F.text,
          }}
        >
          {p.name}:{" "}

          <span
            style={{
              color: F.text,
              fontWeight: 600,
            }}
          >
            {p.value}
          </span>
        </p>
      ))}
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
     FILTER PANEL
     CLOSED BY DEFAULT
     ======================================================= */

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);

  /* =======================================================
     DEFAULT TIME RANGE
     LAST 30 DAYS
     ======================================================= */

  const [
    range,
    setRange,
  ] = useState("30d");

  const [
    systemFilter,
    setSystemFilter,
  ] = useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  /* =======================================================
     UNIQUE SYSTEMS
     ======================================================= */

  const uniqueSystems = useMemo(
    () => {
      const systemsList = Array.from(
        new Set(
          auditLogs
            .map((l) => l.system)
            .filter(
              (s) =>
                s &&
                s !== "—"
            )
        )
      ).sort((a, b) =>
        a.localeCompare(b)
      );

      return [
        "All",
        ...systemsList,
      ];
    },
    [auditLogs]
  );

  /* =======================================================
     CURRENT RANGE
     ======================================================= */

  const selectedRange =
    TIME_RANGES.find(
      (r) => r.id === range
    ) || TIME_RANGES[0];

  const rangeDays =
    selectedRange.days;

  /* =======================================================
     CURRENT TIME
     ======================================================= */

  const now = Date.now();

  /* =======================================================
     FILTER LOGS
     ======================================================= */

  const logs = useMemo(
    () => {
      return auditLogs.filter(
        (l) => {
          const logTime =
            new Date(
              l.timestamp
            ).getTime();

          const ageMs =
            now - logTime;

          let inRange = false;

          /* ---------------------------------------------
             ALL TIME
             --------------------------------------------- */

          if (range === "all") {
            inRange = true;
          }

          /* ---------------------------------------------
             LAST 24 HOURS
             --------------------------------------------- */

          else if (
            range === "24h"
          ) {
            inRange =
              ageMs <=
              24 *
                60 *
                60 *
                1000;
          }

          /* ---------------------------------------------
             LAST 7 / 30 DAYS
             --------------------------------------------- */

          else {
            inRange =
              ageMs <=
              (rangeDays ?? 0) *
                24 *
                60 *
                60 *
                1000;
          }

          const inSystem =
            systemFilter ===
              "All" ||
            normalizeFilterValue(
              l.system
            ) ===
              normalizeFilterValue(
                systemFilter
              );

          const inStatus =
            statusFilter ===
              "All" ||
            normalizeFilterValue(
              l.status
            ) ===
              normalizeFilterValue(
                statusFilter
              );

          return (
            inRange &&
            inSystem &&
            inStatus
          );
        }
      );
    },
    [
      auditLogs,
      range,
      rangeDays,
      systemFilter,
      statusFilter,
      now,
    ]
  );

  /* =======================================================
     FILTER STATUS
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

  /* =========================================================
     OPERATIONS OVER TIME
     ========================================================= */

  const trendData = useMemo(
    () => {
      /* ================================================
         LAST 24 HOURS
         ================================================ */

      if (range === "24h") {
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
          const d = new Date(
            now -
              i *
                60 *
                60 *
                1000
          );

          buckets.push({
            date: d.toISOString(),

            label:
              d.toLocaleTimeString(
                "en-US",
                {
                  hour: "numeric",
                  minute: "2-digit",
                }
              ),

            Success: 0,
            Failed: 0,
            Warning: 0,
          });
        }

        logs.forEach(
          (log) => {
            const logDate =
              new Date(
                log.timestamp
              );

            const logHour =
              new Date(
                logDate.getFullYear(),
                logDate.getMonth(),
                logDate.getDate(),
                logDate.getHours()
              ).getTime();

            const bucket =
              buckets.find(
                (b) => {
                  const bDate =
                    new Date(
                      b.date
                    );

                  const bucketHour =
                    new Date(
                      bDate.getFullYear(),
                      bDate.getMonth(),
                      bDate.getDate(),
                      bDate.getHours()
                    ).getTime();

                  return (
                    bucketHour ===
                    logHour
                  );
                }
              );

            if (bucket) {
              bucket[
                log.status
              ] += 1;
            }
          }
        );

        return buckets;
      }

      /* ================================================
         ALL TIME
         
         Create daily buckets from the oldest
         log date to today.
         ================================================ */

      if (range === "all") {
        if (logs.length === 0) {
          return [];
        }

        const dates =
          logs
            .map((log) =>
              new Date(
                log.timestamp
              ).getTime()
            )
            .filter(
              (time) =>
                !Number.isNaN(time)
            );

        if (dates.length === 0) {
          return [];
        }

        const oldestDate =
          new Date(
            Math.min(...dates)
          );

        const start = new Date(
          oldestDate.getFullYear(),
          oldestDate.getMonth(),
          oldestDate.getDate()
        );

        const end = new Date(
          now
        );

        const buckets: {
          date: string;
          label: string;
          Success: number;
          Failed: number;
          Warning: number;
        }[] = [];

        const current =
          new Date(start);

        while (
          current <= end
        ) {
          const key =
            `${current.getFullYear()}-${String(
              current.getMonth() + 1
            ).padStart(2, "0")}-${String(
              current.getDate()
            ).padStart(2, "0")}`;

          buckets.push({
            date: key,

            label:
              current.toLocaleDateString(
                "en-US",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }
              ),

            Success: 0,
            Failed: 0,
            Warning: 0,
          });

          current.setDate(
            current.getDate() + 1
          );
        }

        logs.forEach(
          (log) => {
            const d =
              new Date(
                log.timestamp
              );

            const key =
              `${d.getFullYear()}-${String(
                d.getMonth() + 1
              ).padStart(2, "0")}-${String(
                d.getDate()
              ).padStart(2, "0")}`;

            const bucket =
              buckets.find(
                (b) =>
                  b.date === key
              );

            if (bucket) {
              bucket[
                log.status
              ] += 1;
            }
          }
        );

        return buckets;
      }

      /* ================================================
         LAST 30 DAYS / LAST 7 DAYS
         ================================================ */

      const numberOfDays =
        range === "30d"
          ? 30
          : 7;

      const buckets: {
        date: string;
        label: string;
        Success: number;
        Failed: number;
        Warning: number;
      }[] = [];

      for (
        let i =
          numberOfDays - 1;
        i >= 0;
        i--
      ) {
        const d = new Date(
          now -
            i *
              24 *
              60 *
              60 *
              1000
        );

        const key =
          d.toISOString().slice(
            0,
            10
          );

        buckets.push({
          date: key,

          label:
            d.toLocaleDateString(
              "en-US",
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

      logs.forEach(
        (log) => {
          const key =
            new Date(
              log.timestamp
            )
              .toISOString()
              .slice(
                0,
                10
              );

          const bucket =
            buckets.find(
              (b) =>
                b.date === key
            );

          if (bucket) {
            bucket[
              log.status
            ] += 1;
          }
        }
      );

      return buckets;
    },
    [
      logs,
      range,
      now,
    ]
  );

  /* =========================================================
     MODULE DATA
     ========================================================= */

  const moduleData =
    useMemo(
      () => {
        const m: Record<
          string,
          number
        > = {};

        logs.forEach(
          (l) => {
            m[l.module] =
              (m[l.module] ??
                0) + 1;
          }
        );

        return (
          Object.keys(
            MODULE_META
          ) as AuditModule[]
        )
          .map(
            (mod) => ({
              name: mod,
              value:
                m[mod] ??
                0,

              color:
                MODULE_META[
                  mod
                ].color,
            })
          )
          .filter(
            (x) =>
              x.value > 0
          );
      },
      [logs]
    );

  /* =========================================================
     STATUS DATA
     ========================================================= */

  const statusData =
    useMemo(
      () => {
        const s: Record<
          string,
          number
        > = {};

        logs.forEach(
          (l) => {
            s[l.status] =
              (s[l.status] ??
                0) + 1;
          }
        );

        return (
          Object.keys(
            STATUS_META
          ) as AuditStatus[]
        )
          .map(
            (st) => ({
              name: st,
              value:
                s[st] ??
                0,

              color:
                STATUS_META[
                  st
                ].color,
            })
          )
          .filter(
            (x) =>
              x.value > 0
          );
      },
      [logs]
    );

  /* =========================================================
     OPERATOR DATA
     ========================================================= */

  const performerData =
    useMemo(
      () => {
        const p: Record<
          string,
          number
        > = {};

        logs.forEach(
          (l) => {
            p[
              l.performedBy
            ] =
              (p[
                l.performedBy
              ] ?? 0) + 1;
          }
        );

        return Object.entries(
          p
        )
          .map(
            ([
              name,
              value,
            ]) => ({
              name,
              value,
            })
          )
          .sort(
            (a, b) =>
              b.value -
              a.value
          );
      },
      [logs]
    );

  /* =========================================================
     SYSTEM DATA
     ========================================================= */

  const systemData =
    useMemo(
      () => {
        const s: Record<
          string,
          number
        > = {};

        logs.forEach(
          (l) => {
            if (
              l.system !==
              "—"
            ) {
              s[
                l.system
              ] =
                (s[
                  l.system
                ] ?? 0) + 1;
            }
          }
        );

        return Object.entries(
          s
        )
          .map(
            ([
              name,
              value,
            ]) => ({
              name,
              value,
            })
          )
          .sort(
            (a, b) =>
              b.value -
              a.value
          );
      },
      [logs]
    );

  /* =========================================================
     KPI
     ========================================================= */

  const total =
    logs.length;

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

  /* =========================================================
     SUMMARY CARDS
     ========================================================= */

  const summary = [
    {
      label:
        "Total Operations",

      value:
        total,

      icon:
        Activity,

      color:
        F.primary,

      bg:
        "#e8f2ff",

      nav:
        "audit-logs" as DashNav,
    },

    {
      label:
        "Success Rate",

      value:
        `${successRate}%`,

      icon:
        TrendingUp,

      color:
        F.success,

      bg:
        "#f1fdf6",

      nav:
        "audit-logs" as DashNav,
    },

    {
      label:
        "Avg Duration",

      value:
        `${avgDuration}ms`,

      icon:
        Calendar,

      color:
        F.purple,

      bg:
        "#f3e5f5",

      nav:
        "audit-logs" as DashNav,
    },

    {
      label:
        "Active Systems",

      value:
        activeSystems,

      icon:
        Server,

      color:
        F.warning,

      bg:
        "#fff8f0",

      nav:
        "data-management" as DashNav,
    },
  ];

  const maxPerformer =
    Math.max(
      1,
      ...performerData.map(
        (p) =>
          p.value
      )
    );

  /* =========================================================
     RETURN
     ========================================================= */

  return (
    <div
      className="
        flex
        flex-col
        gap-5
      "
    >
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
        "
      >
        <div>
          <h1
            style={{
              color:
                F.text,
              fontWeight:
                550,
            }}
          >
            Analytics
          </h1>

          <p
            className="
              text-sm
              mt-0.5
            "
            style={{
              color:
                F.muted,
            }}
          >
            Provisioning
            activity
            insights ·{" "}
            {
              selectedRange
                .label
            }
          </p>
        </div>

        <button
          onClick={() =>
            onNavigate(
              "audit-logs"
            )
          }
          className="
            flex
            items-center
            gap-2
            px-4
            py-2
            rounded
            text-sm
          "
          style={{
            background:
              F.primary,
            color:
              "#fff",
          }}
        >
          Open Audit Logs

          <ArrowUpRight
            size={14}
          />
        </button>
      </div>

      {/* =====================================================
          FILTERS
          ===================================================== */}

      <div
        className="
          rounded-lg
          overflow-visible
          relative
          z-20
        "
        style={{
          background:
            F.white,
          border:
            `1px solid ${F.border}`,
        }}
      >
        {/* FILTER HEADER */}

        <button
          type="button"
          onClick={() =>
            setShowFilters(
              (s) => !s
            )
          }
          className="
            w-full
            flex
            items-center
            gap-2
            px-5
            py-3
            text-left
          "
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
              color:
                F.text,
              fontWeight:
                500,
            }}
          >
            Filters
          </span>

          {filtersActive && (
            <span
              className="
                px-2
                py-0.5
                rounded-full
                text-xs
                text-white
              "
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

        {/* FILTER BODY */}

        {showFilters && (
          <div
            className="
              px-5
              py-4
              flex
              flex-wrap
              items-end
              gap-5
            "
            style={{
              borderTop:
                `1px solid ${F.border}`,
            }}
          >
            {/* =============================================
                TIME RANGE
                ============================================= */}

            <div
              className="
                flex
                flex-col
                gap-1.5
              "
            >
              <label
                className="text-xs"
                style={{
                  color:
                    F.muted,
                  fontWeight:
                    600,
                }}
              >
                Time Range
              </label>

              <div
                className="
                  flex
                  flex-wrap
                  gap-1
                "
              >
                {TIME_RANGES.map(
                  (r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() =>
                        setRange(
                          r.id
                        )
                      }
                      className="
                        px-3
                        py-1.5
                        rounded
                        text-xs
                      "
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

                        border:
                          `1px solid ${
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
                      {r.label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* =============================================
                SYSTEM
                ============================================= */}

            <div
              className="
                min-w-[150px]
              "
            >
              <SearchableFilterDropdown
                label="System"
                value={
                  systemFilter ===
                  "All"
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
                    s ===
                    "All"
                      ? ""
                      : s
                )}
                allLabel="All Systems"
                placeholder="Search system…"
              />
            </div>

            {/* =============================================
                STATUS
                ============================================= */}

            <div
              className="
                min-w-[150px]
              "
            >
              <SearchableFilterDropdown
                label="Status"
                value={
                  statusFilter ===
                  "All"
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
                  "Warning",
                  "Failed",
                ]}
                allLabel="All Statuses"
                placeholder="Search status…"
              />
            </div>

            {/* =============================================
                CLEAR
                ============================================= */}

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="
                flex
                items-center
                gap-1.5
                px-3
                py-1.5
                rounded
                text-xs
              "
              style={{
                border:
                  `1px solid ${
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
              }}
            >
              <X size={12} />

              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* =====================================================
          KPI CARDS
          ===================================================== */}

      <div
        className="
          grid
          grid-cols-2
          lg:grid-cols-4
          gap-4
        "
      >
        {summary.map(
          (s) => (
            <button
              key={s.label}
              onClick={() =>
                onNavigate(
                  s.nav
                )
              }
              className="
                rounded-lg
                p-4
                text-left
                flex
                items-center
                gap-3
                transition-all
              "
              style={{
                background:
                  F.white,

                border:
                  `1px solid ${F.border}`,
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
                className="
                  w-11
                  h-11
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
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
                <p
                  style={{
                    fontSize:
                      "24px",

                    fontWeight:
                      700,

                    color:
                      F.text,

                    lineHeight:
                      1.2,

                    margin: 0,
                  }}
                >
                  {s.value}
                </p>

                <p
                  className="text-xs"
                  style={{
                    color:
                      F.muted,

                    fontWeight:
                      700,

                    lineHeight:
                      1.4,

                    marginTop:
                      "4px",

                    marginBottom:
                      0,
                  }}
                >
                  {s.label}
                </p>
              </div>
            </button>
          )
        )}
      </div>

      {/* =====================================================
          OPERATIONS OVER TIME
          ===================================================== */}

      <Panel
        title="Operations Over Time"
        subtitle={
          range === "24h"
            ? "Hourly activity · Last 24 hours"
            : range === "30d"
              ? "Daily activity · Last 30 days"
              : range === "7d"
                ? "Daily activity · Last 7 days"
                : "Daily activity · All Time"
        }
        icon={
          <TrendingUp
            size={14}
          />
        }
      >
        {trendData.length ===
        0 ? (
          <p
            className="
              text-sm
              text-center
              py-16
            "
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
            height={320}
          >
            <AreaChart
              data={
                trendData
              }
              margin={{
                top: 8,
                right: 20,
                left: -16,
                bottom: range === "all"
                  ? 55
                  : 35,
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
                tick={{
                  fontSize:
                    range ===
                    "30d"
                      ? 9
                      : range ===
                          "all"
                        ? 8
                        : 11,

                  fill:
                    F.muted,
                }}
                axisLine={{
                  stroke:
                    F.border,
                }}
                tickLine={false}
                interval={
                  range === "all"
                    ? "preserveStartEnd"
                    : 0
                }
                angle={
                  range ===
                    "30d" ||
                  range ===
                    "all"
                    ? -45
                    : 0
                }
                textAnchor={
                  range ===
                    "30d" ||
                  range ===
                    "all"
                    ? "end"
                    : "middle"
                }
                height={
                  range ===
                    "30d" ||
                  range ===
                    "all"
                    ? 65
                    : 30
                }
              />

              <YAxis
                tick={{
                  fontSize: 11,
                  fill:
                    F.muted,
                }}
                axisLine={false}
                tickLine={false}
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
                strokeWidth={2}
              />

              <Area
                type="monotone"
                dataKey="Warning"
                stackId="1"
                stroke={
                  F.warning
                }
                fill={`url(#${uid}gWarning)`}
                strokeWidth={2}
              />

              <Area
                type="monotone"
                dataKey="Failed"
                stackId="1"
                stroke={
                  F.error
                }
                fill={`url(#${uid}gFailed)`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* =====================================================
          MODULE + STATUS
          ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-5
          gap-5
        "
      >
        {/* MODULE */}

        <div
          className="
            lg:col-span-3
          "
        >
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
                className="
                  text-sm
                  text-center
                  py-16
                "
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
                    vertical={false}
                    opacity={0.45}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 10,
                      fill:
                        F.muted,
                    }}
                    axisLine={{
                      stroke:
                        F.border,
                    }}
                    tickLine={false}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={50}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill:
                        F.muted,
                    }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={
                      false
                    }
                  />

                  <Tooltip
                    content={
                      <ChartTooltip />
                    }
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

        <div
          className="
            lg:col-span-2
          "
        >
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
                className="
                  text-sm
                  text-center
                  py-16
                "
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
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
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

                <div
                  className="
                    flex
                    flex-col
                    gap-2
                    mt-3
                  "
                >
                  {statusData.map(
                    (d) => (
                      <div
                        key={d.name}
                        className="
                          flex
                          items-center
                          justify-between
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >
                          <span
                            className="
                              w-2.5
                              h-2.5
                              rounded-full
                            "
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
                            {d.name}
                          </span>
                        </div>

                        <span
                          className="text-xs"
                          style={{
                            color:
                              F.muted,
                          }}
                        >
                          {d.value}
                          {" · "}
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

      {/* =====================================================
          OPERATOR + SYSTEM
          ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-2
          gap-5
        "
      >
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
              className="
                text-sm
                text-center
                py-8
              "
              style={{
                color:
                  F.muted,
              }}
            >
              No data.
            </p>
          ) : (
            <div
              className="
                flex
                flex-col
                gap-3.5
              "
            >
              {performerData.map(
                (p) => (
                  <div
                    key={p.name}
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <div
                      className="
                        w-8
                        h-8
                        rounded-full
                        flex
                        items-center
                        justify-center
                        text-white
                        text-xs
                        flex-shrink-0
                      "
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

                    <div
                      className="
                        flex-1
                        min-w-0
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          mb-1
                        "
                      >
                        <span
                          className="text-xs"
                          style={{
                            color:
                              F.text,
                          }}
                        >
                          {p.name}
                        </span>

                        <span
                          className="text-xs"
                          style={{
                            color:
                              F.muted,
                          }}
                        >
                          {p.value}
                        </span>
                      </div>

                      <div
                        className="
                          h-2
                          rounded-full
                          overflow-hidden
                        "
                        style={{
                          background:
                            F.bg,
                        }}
                      >
                        <div
                          className="
                            h-full
                            rounded-full
                          "
                          style={{
                            width:
                              `${
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
              className="
                text-sm
                text-center
                py-8
              "
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
                  horizontal={false}
                  opacity={0.45}
                />

                <XAxis
                  type="number"
                  tick={{
                    fontSize: 11,
                    fill:
                      F.muted,
                  }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={
                    false
                  }
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{
                    fontSize: 11,
                    fill:
                      F.text,
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />

                <Tooltip
                  content={
                    <ChartTooltip />
                  }
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