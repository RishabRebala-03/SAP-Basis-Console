# SAP Basis Console

An enterprise-grade web application for SAP Basis Administration and User Lifecycle Management. Built with React 18, TypeScript, Vite, Tailwind CSS, and Radix UI components, this application provides Basis administrators with a consolidated dashboard for monitoring SAP systems, provisioning users, resetting passwords, executing bulk onboarding operations, and maintaining complete audit trails.

---

## Executive Summary

SAP Basis Console streamlines administrative workflows across SAP system landscapes. It replaces fragmented GUI transactions with a consolidated, modern web interface that ensures policy enforcement, audit readiness, and operational efficiency across Development, Quality Assurance, Production, and Sandbox environments.

---

## Core Capabilities

### Landscape Overview and Analytics
* **Centralized System Metrics**: Real-time monitoring of active SAP systems, registered user accounts, lock states, and environment health.
* **Telemetry and Reporting**: Visualizations covering user creation trends, lock/unlock frequency, module activity breakdown, and environment allocation.
* **Performance Monitoring**: System response latency metrics and operation success/failure rates.

### User Lifecycle Management
* **Single User Provisioning**: Standardized SAP user creation supporting personal address data, logon parameters, user groups, role/profile assignments, and custom parameter values (with F4 Value Help support).
* **Bulk User Onboarding**: Multi-user onboarding via CSV import or interactive grid editor with inline validation, duplicate checking, and execution logs.
* **Password Administration**: Secure password reset tool equipped with configurable strength rules, automated password generation, and forced password change toggles.
* **Account Lock Management**: Single and batch account locking/unlocking with audit reason logging (e.g., Security Violation, Inactivity, System Maintenance, User Request).

### Governance and Auditability
* **System Registry**: Inventory management for SAP SID instances across Development (`DEV`), Quality Assurance (`QAS`), Production (`PRD`), and Sandbox (`SBX`) environments. Includes connection testing and status control.
* **Audit Trail Management**: Comprehensive logging of administrative actions for compliance (e.g., SOX and internal audit standards). Supports multi-criteria filtering by date range, module, target system, status, and originator IP address.
* **Detailed Audit Drill-Down**: Full forensic audit view containing session identifiers, execution duration, RFC error codes, and structured Before/After state comparisons.

### System Configuration and User Experience
* **Enterprise UI Architecture**: Design palette aligned with SAP Fiori guidelines, featuring high-contrast modes, responsive layout drawer navigation, and accessible UI controls.
* **Notification Engine**: In-app alert system for critical system events, bulk job completion notifications, security warnings, and scheduled maintenance schedules.
* **Administrator Preferences**: Configurable RFC timeout limits, target SAP client defaults, security policies, and session controls.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18, TypeScript |
| **Build System & Server** | Vite 6 |
| **Styling & Design System** | Tailwind CSS v4, Custom SAP Fiori CSS Tokens |
| **UI Components & Icons** | Radix UI, Lucide Icons |
| **Data Visualization** | Recharts |
| **Animation Engine** | Framer Motion |
| **State & Form Management** | React Context API, Custom Hooks, React Hook Form |

---

## Project Structure

```
SAP-Basis-Console/
├── README.md                 # Project documentation
└── frontend/                 # Frontend React Application
    ├── public/               # Static assets & HTML template
    ├── src/
    │   ├── app/
    │   │   ├── components/   # Application modules & view pages
    │   │   │   ├── pages/    # View pages (Audit detail, System detail, Settings, Profile, Sign-in)
    │   │   │   ├── ui/       # Shared UI primitives (Buttons, Modals, Inputs, Cards)
    │   │   │   ├── Analytics.tsx
    │   │   │   ├── AuditLogs.tsx
    │   │   │   ├── BulkUserCreation.tsx
    │   │   │   ├── Dashboard.tsx
    │   │   │   ├── DataManagement.tsx
    │   │   │   ├── LockUnlockUser.tsx
    │   │   │   ├── PasswordReset.tsx
    │   │   │   └── SingleUserCreation.tsx
    │   │   ├── contexts/     # Application state & SAP mock data context
    │   │   └── App.tsx       # Root layout & view router
    │   ├── imports/          # Design tokens & exported component utilities
    │   ├── styles/           # CSS stylesheets
    │   ├── index.css         # Global Tailwind styles & custom utility classes
    │   └── main.tsx          # Application entry point
    ├── index.html            # Vite HTML template
    ├── package.json          # Dependencies & scripts
    ├── postcss.config.mjs    # PostCSS configuration
    └── vite.config.ts        # Vite configuration
```

---

## Getting Started

### Prerequisites

* **Node.js**: Version 18.0.0 or higher
* **Package Manager**: npm (included with Node.js), pnpm, or yarn

### Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/RishabRebala-03/SAP-Basis-Console.git
   cd SAP-Basis-Console
   ```

2. Navigate to the frontend workspace:
   ```bash
   cd frontend
   ```

3. Install project dependencies:
   ```bash
   npm install
   ```

4. Launch the local development server:
   ```bash
   npm run dev
   ```

5. Access the application in your web browser at `http://localhost:5173`.

### Production Build

To assemble a production bundle:

```bash
npm run build
```

The compiled assets will be placed in the `frontend/dist/` directory.

---

## Architecture Roadmap

The application currently operates with a client-side state provider (`AppContext`) managing simulated SAP landscape data. Planned architectural extensions include:

* **Backend Service Gateway**: Implementation of a dedicated Node.js or Python FastAPI API service layer.
* **SAP RFC / BAPI Connectivity**: Direct integration with SAP NetWeaver and S/4HANA systems using RFC connectors (`node-rfc` / `PyRFC`) to invoke standard SAP BAPIs (`BAPI_USER_CREATE1`, `BAPI_USER_LOCK`, `BAPI_USER_UNLOCK`, `BAPI_USER_CHANGE_PASSWORD`).
* **Enterprise Authentication**: SSO and SAML 2.0 / OAuth2 integration with enterprise identity providers (Azure Active Directory, Okta, SAP IAS).
* **Role-Based Access Control (RBAC)**: Fine-grained administrative permission tiers (e.g., Read-Only Auditor, Junior Basis Administrator, Lead Administrator).
* **Automated System Health Checks**: Scheduled polling of SAP application servers (`RFC_PING`).

---

## License

This project is distributed under the MIT License.
