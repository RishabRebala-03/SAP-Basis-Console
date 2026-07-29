import json
import io

def test_list_sap_systems(client, admin_headers):
    response = client.get("/api/sap/systems", headers=admin_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["system_id"] == "EMP"

def test_user_search(client, admin_headers):
    response = client.get("/api/sap/user-search?system_id=EMP&username=AITEST1", headers=admin_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["UserName"] == "AITEST1"


def test_create_sap_user_success(client, admin_headers):
    user_payload = {
        "system_id": "EMP",
        "username": "NEWUSER",
        "last_name": "User",
        "init_password": "NewUserPassword@123",
        "valid_from": "2026-07-21",
        "valid_to": "2027-07-21",
        "roles": ["Z_READ_ONLY"],
        "profiles": ["S_A.USER"]
    }
    response = client.post("/api/sap/create-user", json=user_payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data["UserName"] == "NEWUSER"
    assert "Z_READ_ONLY" in data["Roles"]

def test_create_sap_user_validation_error(client, admin_headers):
    # Empty username triggers validation error 400
    user_payload = {
        "system_id": "EMP",
        "username": "",
        "first_name": "New",
        "last_name": "User",
        "init_password": "short"
    }
    response = client.post("/api/sap/create-user", json=user_payload, headers=admin_headers)
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "message" in data

def test_lock_unlock_user(client, admin_headers):
    # Lock JDOE
    lock_payload = {
        "system_id": "EMP",
        "username": "JDOE",
        "reason": "Security violation"
    }
    response = client.post("/api/sap/lock", json=lock_payload, headers=admin_headers)
    assert response.status_code == 200
    assert response.get_json()["LockStatus"] == "Locked"

    # Unlock JDOE
    unlock_payload = {
        "system_id": "EMP",
        "username": "JDOE"
    }
    response = client.post("/api/sap/unlock", json=unlock_payload, headers=admin_headers)
    assert response.status_code == 200
    assert response.get_json()["LockStatus"] == "Unlocked"

def test_assign_roles(client, admin_headers):
    payload = {
        "system_id": "EMP",
        "username": "JDOE",
        "roles": ["SAP_ALL", "Z_BASIS_ADMIN", "Z_DEVELOPER"]
    }
    response = client.post("/api/sap/assign-role", json=payload, headers=admin_headers)
    assert response.status_code == 200
    assert len(response.get_json()["Roles"]) == 3

def test_extend_validity(client, admin_headers):
    payload = {
        "system_id": "EMP",
        "username": "JDOE",
        "valid_to": "2030-12-31",
        "reason": "Contract renewal"
    }
    response = client.post("/api/sap/extend-validity", json=payload, headers=admin_headers)
    assert response.status_code == 200
    assert response.get_json()["ValidTo"] == "2030-12-31"

def test_dashboard_stats(client, admin_headers):
    response = client.get("/api/dashboard/stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert "total_users_managed" in data
    assert "today_requests" in data
    assert "success_requests" in data

def test_excel_template_download(client, admin_headers):
    response = client.get("/api/sap/template", headers=admin_headers)
    assert response.status_code == 200
    assert response.mimetype == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
