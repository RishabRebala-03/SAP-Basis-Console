from backend.app.sap.sap_service import SAPService


def test_password_reset_lock_and_bulk_payloads(app, monkeypatch):
    service = SAPService()
    calls = []

    def capture(_client, operation, payload):
        calls.append((operation, payload))
        if operation == "bulk_create":
            return {"d": {"Status": "S", "Message": "OK", "UserCreateBulk": {"results": []}}}
        if operation == "reset_password":
            return {"d": {"Status": "S", "Message": "OK", "Password": "SapGenerated@123"}}
        return {"d": {"Status": "S", "Message": "OK"}}

    monkeypatch.setattr(service, "_request_operation", capture)

    with app.app_context():
        reset_result = service.reset_password("EMP", "rishab")
        service.unlock_user("EMP", "rishab")
        service.create_users_bulk("EMP", [{
            "username": "adithya",
            "first_name": "ADITHYA",
            "last_name": "ADDAGARLA",
            "init_password": "Adithya@123",
            "valid_from": "2026-01-01",
            "valid_to": "2027-01-01",
            "user_type": "A",
            "email": "adithya@example.com",
            "phone": "9876543210",
        }])

    assert calls[0] == ("reset_password", {
        "Username": "RISHAB", "Password": "", "Status": "", "Message": ""
    })
    assert reset_result["NewPassword"] == "SapGenerated@123"
    assert calls[1] == ("unlock_user", {"Username": "RISHAB", "Action": "UnLock"})

    operation, payload = calls[2]
    assert operation == "bulk_create"
    assert payload["SNO"] == "1000000123"
    assert payload["UserCreateBulk"][0] == {
        "SNO": "1000000123",
        "Username": "ADITHYA",
        "Password": "Adithya@123",
        "FirstName": "ADITHYA",
        "LastName": "ADDAGARLA",
        "ValidFrom": "20260101",
        "ValidTo": "20270101",
        "UserType": "A",
        "Email": "adithya@example.com",
        "MobileNo": "9876543210",
        "Status": "",
        "Message": "",
    }
