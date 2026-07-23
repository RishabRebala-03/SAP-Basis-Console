# SAP Basis Provisioning Console

An enterprise-grade, production-ready portal that allows authorized SAP Basis administrators to execute SAP user administration tasks (logins, creates, locks, password resets, role allocations, validity extensions) via a secure backend intermediary layer integrating with SAP Gateway OData APIs.

## 🚀 Key Features

1. **Enterprise Authentication & RBAC**: Secure JWT login with token refreshes and role authorizations (`Super Admin`, `Basis Admin`, and `Viewer`).
2. **Interactive Dashboard**: Aggregated stats on user provisioning, successes, failures, and daily activity logs graphs.
3. **Landscape Target Selector**: Target switchboards for configured SAP environments (`SHD`, `EMP`, `EMQ`, `EMD`).
4. **Single and Batch Operations**: Create users individually, or bulk-import via styled Excel templates with inline validations, real-time progress bars, and execution reports.
5. **Auditing Ledger**: Complete historical tracking recording operator usernames, target clients, execution timings, payloads, and raw responses.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, Vite, Material UI (MUI) v6, Redux Toolkit, TanStack Query, React Hook Form, Zod.
* **Backend**: Python 3.11, Flask Blueprints, Flask-JWT-Extended, PyMongo, Marshmallow validation schemas, Pandas/OpenPyXL.
* **Database**: MongoDB.

---

## 💻 Getting Started (Local Development)

### Prerequisites

* Python 3.11+
* Node.js v20+
* MongoDB running locally (`mongodb://127.0.0.1:27017/`)

---

### Step 1: Backend Configuration & Start

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and configure your environment variables:
   ```bash
   cp ../.env.example .env
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Seed the database (creates admin accounts, registers default SAP environments, sets up MongoDB indexes, and populates simulated SAP accounts):
   ```bash
   python seed.py
   ```
5. Start the development server:
   ```bash
   python run.py
   ```
   *The Flask API will run on `http://127.0.0.1:5000/`*

---

### Step 2: Frontend Setup & Run

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm modules:
   ```bash
   npm install
   ```
3. Launch React:
   ```bash
   npm run dev
   ```
   *The web portal will open on `http://localhost:3000/`*

---

## 🔑 Default Credentials (Seeded)

Log in using any of the following accounts:

| Username | Password | Role | Access Level |
| :--- | :--- | :--- | :--- |
| **admin** | `Admin@123456` | **Super Admin** | Full access to portal, audits, and configuration settings. |
| **basis_admin** | `Admin@123456` | **Basis Admin** | Full access to user creations, resets, and locks. |
| **viewer** | `Viewer@123456` | **Viewer** | Restricted view-only access to dashboard and user search. |

---

## 🧪 Testing Backend Code

Execute the pytest suite (covers OData client calls, auth tokens, locking status changes, and Excel processing):
```bash
python -m pytest backend/tests/
```

---

## 🐳 Docker Deployment

To spin up the entire stack (MongoDB, Flask API, Nginx Static React server) inside Docker container networks:
```bash
docker-compose up --build -d
```
* Access Nginx client: `http://localhost:80/`
* Access API endpoint: `http://localhost:5000/`
