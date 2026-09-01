# SAP Basis Provisioning Console - API Documentation

The console communicates via standardized JSON REST endpoints. State-changing requests are audited, logging payload details, operator identities, and client IP addresses.

---

## 🔐 1. Authentication Endpoints (`/api/auth`)

### Login
* **URL**: `/api/auth/login`
* **Method**: `POST`
* **Payload**:
  ```json
  {
    "username": "basis_admin",
    "password": "Admin@123456"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "user": {
      "username": "basis_admin",
      "email": "basisadmin@example.com",
      "role": "Basis Admin"
    }
  }
  ```

### Refresh Token
* **URL**: `/api/auth/refresh`
* **Method**: `POST`
* **Headers**: `Authorization: Bearer <refresh_token>`
* **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOi..."
  }
  ```

### Forgot Password
* **URL**: `/api/auth/forgot-password`
* **Method**: `POST`
* **Payload**:
  ```json
  {
    "email": "basisadmin@example.com"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "message": "Reset link generated successfully.",
    "dev_reset_token": "c71e2efd-..."
  }
  ```

---

## 🛠️ 2. SAP OData Action Endpoints (`/api/sap`)
*All endpoints below require header `Authorization: Bearer <access_token>` and will target the system specified in header `X-SAP-System` (e.g. `EMP`).*

### Search Users
* **URL**: `/api/sap/user-search`
* **Method**: `GET`
* **Query Parameters**:
  * `system_id`: `EMP` (Required)
  * `username`: `JDOE` (Optional)
  * `email`: `@corporate.com` (Optional)
* **Response (200 OK)**:
  ```json
  [
    {
      "UserName": "JDOE",
      "FirstName": "John",
      "LastName": "Doe",
      "Email": "john.doe@corporate.com",
      "Department": "IT Operations",
      "LockStatus": "Unlocked",
      "ValidTo": "9999-12-31",
      "Roles": ["SAP_ALL", "Z_BASIS_ADMIN"],
      "Profiles": ["SAP_ALL"]
    }
  ]
  ```

### Create Single User
* **URL**: `/api/sap/create-user`
* **Method**: `POST`
* **Payload**:
  ```json
  {
    "system_id": "EMP",
    "username": "NEWUSER",
    "first_name": "New",
    "last_name": "User",
    "email": "new.user@example.com",
    "init_password": "NewUserPassword@123",
    "valid_from": "2026-07-21",
    "valid_to": "2027-12-31",
    "user_type": "A",
    "language": "EN",
    "roles": ["Z_READ_ONLY"],
    "profiles": ["S_A.USER"]
  }
  ```
* **Response (210 Created)**: Returns the created user object as confirmation.

### Reset User Password
* **URL**: `/api/sap/reset-password`
* **Method**: `POST`
* **Payload**:
  ```json
  {
    "system_id": "EMP",
    "username": "JDOE",
    "password": "NewSecurePassword@123"
  }
  ```
* **Response (200 OK)**: Returns the updated OData confirmation envelope.

### Lock Account
* **URL**: `/api/sap/lock`
* **Method**: `POST`
* **Payload**:
  ```json
  {
    "system_id": "EMP",
    "username": "JDOE",
    "reason": "Contract terminated"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "UserName": "JDOE",
    "LockStatus": "Locked",
    "LockReason": "Contract terminated"
  }
  ```

### Extend validity
* **URL**: `/api/sap/extend-validity`
* **Method**: `POST`
* **Payload**:
  ```json
  {
    "system_id": "EMP",
    "username": "JDOE",
    "valid_to": "2030-12-31",
    "reason": "Contract renewed"
  }
  ```

---

## 📈 3. Metrics & Audit Endpoints

### Dashboard Stats
* **URL**: `/api/dashboard/stats`
* **Method**: `GET`
* **Response (200 OK)**: returns counters (Today's count, total managed) and recent activities lists.

### Export Activity Log spreadsheet (CSV)
* **URL**: `/api/activity`
* **Method**: `GET`
* **Query Parameters**: `format=csv`, `status`, `username`, `sap_system`
* **Response (200 OK)**: Streams CSV file download `SAP_Basis_Activity_Log.csv`.
