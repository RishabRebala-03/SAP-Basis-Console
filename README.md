# SAP Basis Console

SAP Basis Console is a React/TypeScript web console backed by a Flask API for SAP user administration. It provides authenticated operators with SAP system selection, user search and lifecycle operations, bulk Excel workflows, dashboard metrics, and audit history.

## Current architecture

```text
Browser (React + Vite)
        │ /api/*
        ▼
Flask application (backend/run.py)
        ├── MongoDB: users, sessions, SAP systems, audit logs
        └── SAP Gateway OData: ZBSUSERODATA_SRV
```

The frontend is served by Vite during development. The backend is a separate Flask service; a reverse proxy or equivalent configuration should route `/api` requests from the frontend to the backend.

## Features implemented

- JWT login, refresh, logout, forgot-password, and reset-password flows.
- Role-aware access for `Super Admin`, `Basis Admin`, and `Viewer`.
- SAP system listing for `SHD`, `EMP`, `EMQ`, and `EMD`.
- SAP user search, creation, password reset, lock/unlock, role assignment, profile assignment, validity extension, and deletion.
- Bulk user creation and deletion using Excel upload, validation previews, processing, and downloadable reports.
- Dashboard statistics and seven-day chart data.
- Filterable audit logs, activity history, and CSV export.
- SAP OData requests with SAP client headers, CSRF handling, retries, timeout control, and an explicit mock mode for tests.

## Technology

| Area | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 6 |
| UI | Tailwind CSS 4, Radix UI, MUI, Lucide, Recharts |
| Backend | Python, Flask 3 |
| Authentication | Flask-JWT-Extended |
| Database | MongoDB via PyMongo |
| SAP integration | HTTP/OData via `requests` against `ZBSUSERODATA_SRV` |
| Bulk processing | `openpyxl`, `pandas` |
| Tests | pytest, mongomock |

## Repository layout

```text
.
├── backend/
│   ├── app/
│   │   ├── auth/          # Login, token, and password recovery routes
│   │   ├── routes/        # SAP, dashboard, and audit blueprints
│   │   ├── sap/           # OData client and SAP service layer
│   │   ├── excel/         # Excel templates, parsing, validation, reports
│   │   ├── models/        # User, SAP system, and audit models
│   │   ├── repositories/  # MongoDB access
│   │   ├── schemas/       # Request validation schemas
│   │   └── config/        # Environment-backed configuration
│   ├── run.py             # Flask entry point
│   ├── seed.py            # MongoDB indexes and development seed data
│   ├── requirements.txt
│   └── tests/
├── frontend/
│   ├── src/api/           # Auth, SAP, and audit API clients
│   └── src/app/           # Pages, components, context, and UI
└── README.md
```

## Prerequisites

- Node.js 18 or later and npm.
- Python 3.11+ recommended.
- MongoDB available at the configured URI.
- Access to the SAP Gateway service when live integration is enabled.

## Configuration

Create a `.env` file in the project root or backend working directory. The backend loads it with `python-dotenv`.

```dotenv
SECRET_KEY=replace-with-a-secret
JWT_SECRET_KEY=replace-with-a-different-secret
MONGO_URI=mongodb://localhost:27017/sap_basis_console
MONGO_DB=sap_basis_console
SAP_MOCK=false
SAP_CLIENT=100

SAP_SHD_URL=http://<host>:<port>/sap/opu/odata/SAP/ZBSUSERODATA_SRV
SAP_SHD_USER=<service-user>
SAP_SHD_PASS=<service-password>
SAP_EMP_URL=http://<host>:<port>/sap/opu/odata/SAP/ZBSUSERODATA_SRV
SAP_EMP_USER=<service-user>
SAP_EMP_PASS=<service-password>
SAP_EMQ_URL=http://<host>:<port>/sap/opu/odata/SAP/ZBSUSERODATA_SRV
SAP_EMQ_USER=<service-user>
SAP_EMQ_PASS=<service-password>
SAP_EMD_URL=http://<host>:<port>/sap/opu/odata/SAP/ZBSUSERODATA_SRV
SAP_EMD_USER=<service-user>
SAP_EMD_PASS=<service-password>
```

`SAP_MOCK=true` is intended for tests and local development. Live mode uses the configured URLs and credentials, sends CSRF-protected mutating requests, retries selected transient HTTP errors, and uses a 30-second SAP request timeout. Do not commit credentials or use the development defaults in a real environment.

## Run locally

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python backend/seed.py
python backend/run.py
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server normally runs at `http://localhost:5173`; the Flask API defaults to `http://127.0.0.1:5000`. Set `HOST` and `PORT` to change the backend bind address.

For production-style serving, run the Flask app with Gunicorn, for example:

```bash
gunicorn -b 127.0.0.1:5000 backend.run:app
```

Build the frontend with `npm run build` from `frontend/`; output is written to `frontend/dist/`.

## API overview

All protected endpoints require `Authorization: Bearer <access-token>`. The API is rooted at `/api`.

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Issue access and refresh tokens |
| POST | `/api/auth/refresh` | Issue a new access token |
| POST | `/api/auth/logout` | Revoke a refresh-token session |
| POST | `/api/auth/forgot-password` | Generate a development reset token |
| POST | `/api/auth/reset-password` | Apply a password reset token |

### SAP operations

`GET /api/sap/systems` lists active systems. The SAP operation endpoints are:

```text
GET  /api/sap/user-search
POST /api/sap/create-user
POST /api/sap/reset-password
POST /api/sap/lock
POST /api/sap/unlock
POST /api/sap/assign-role
POST /api/sap/assign-profile
POST /api/sap/extend-validity
POST /api/sap/delete-user
POST /api/sap/bulk-delete
GET  /api/sap/template
GET  /api/sap/delete-template
POST /api/sap/bulk-create/preview
POST /api/sap/bulk-create/process
POST /api/sap/bulk-delete/preview
POST /api/sap/bulk-delete/process
GET  /api/sap/bulk-create/report/<report_id>
```

Most SAP requests identify the target with `system_id` (or `systemId`); `X-SAP-System` is also accepted by the backend. Mutating SAP and audit operations are role-protected and are recorded in MongoDB.

### Dashboard and audit

```text
GET  /api/dashboard/stats
GET  /api/dashboard/chart
POST /api/audit
GET  /api/audit
GET  /api/activity                 # add format=csv for CSV download
```

Audit filters include username, SAP system, action, status, and date range (`YYYY-MM-DD`).

## SAP integration details

The service targets the custom SAP Gateway service `ZBSUSERODATA_SRV` and uses these entity sets/actions:

| Operation | OData resource |
|---|---|
| Search/lock state | `UserLockSet` |
| Lock/unlock | `UserLockSet` actions `Lock` / `UnLock` |
| Password reset | `UserPasswordResetSet` |
| Single-user maintenance | `UserCreationSet` |
| Bulk creation | `UserCreateBulkHdrSet` and `UserCreateBulkItmSet` |

SAP dates are normalized to `YYYYMMDD`. The service expects SAP responses with a status/message convention (`Status: S` for success and `Status: E` for an SAP error), and returns the SAP response to the API caller after validation.

## Tests

Run the backend test suite from the repository root:

```bash
pytest backend/tests
```

The test configuration uses `mongomock` and sets `SAP_MOCK=true`, so tests do not require a live MongoDB or SAP system.

## Development notes

- Keep secrets in environment variables; never commit SAP credentials, JWT secrets, or production connection strings.
- The backend currently exposes system listing only for the SAP system registry. Frontend helpers for system create/update/delete and session listing exist, but matching backend routes are not currently implemented.
- `backend/sap_metadata.xml` and related metadata files document the SAP service used by the integration.

## License

This project is distributed under the MIT License.
