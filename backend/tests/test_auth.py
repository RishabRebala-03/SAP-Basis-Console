import json

def test_login_success(client):
    response = client.post("/api/auth/login", json={
        "username": "test_admin",
        "password": "TestPassword123!"
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["username"] == "test_admin"
    assert data["user"]["role"] == "Super Admin"

def test_login_invalid_credentials(client):
    response = client.post("/api/auth/login", json={
        "username": "test_admin",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
    assert "error" in response.get_json()

def test_refresh_token(client, app):
    # Log in to get tokens
    response = client.post("/api/auth/login", json={
        "username": "test_admin",
        "password": "TestPassword123!"
    })
    tokens = response.get_json()
    refresh_token = tokens["refresh_token"]

    # Request new access token
    headers = {
        "Authorization": f"Bearer {refresh_token}",
        "Content-Type": "application/json"
    }
    resp = client.post("/api/auth/refresh", headers=headers)
    assert resp.status_code == 200
    assert "access_token" in resp.get_json()

def test_forgot_reset_password(client):
    # Forgot password request
    response = client.post("/api/auth/forgot-password", json={
        "email": "test_admin@example.com"
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "dev_reset_token" in data
    reset_token = data["dev_reset_token"]

    # Reset password request
    reset_resp = client.post("/api/auth/reset-password", json={
        "token": reset_token,
        "new_password": "NewSecurePassword@123"
    })
    assert reset_resp.status_code == 200
    assert "message" in reset_resp.get_json()

    # Verify logging in with new password
    login_resp = client.post("/api/auth/login", json={
        "username": "test_admin",
        "password": "NewSecurePassword@123"
    })
    assert login_resp.status_code == 200
