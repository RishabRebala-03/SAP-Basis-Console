import requests
import urllib3
urllib3.disable_warnings()

BASE = "http://183.82.103.80:8011/sap/opu/odata/SAP/ZBSUSERODATA_SRV"
AUTH = ('AITEST1', 'Naxrita@2026')
PARAMS = {'sap-client': '100'}
HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'sap-client': '100',
    'X-Requested-With': 'XMLHttpRequest'
}

# Test Unlock with Action field
print("--- Unlock with Action='UNLOCK' ---")
r = requests.post(BASE + "/UserLockSet", auth=AUTH, headers=HEADERS, params=PARAMS,
    json={"Username": "RISHAB", "Action": "UNLOCK"}, timeout=30, verify=False)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:2000]}")

print("\n--- Unlock with Action='U' ---")
r2 = requests.post(BASE + "/UserLockSet", auth=AUTH, headers=HEADERS, params=PARAMS,
    json={"Username": "RISHAB", "Action": "U"}, timeout=30, verify=False)
print(f"Status: {r2.status_code}")
print(f"Response: {r2.text[:2000]}")

print("\n--- Lock with Action='LOCK' ---")
r3 = requests.post(BASE + "/UserLockSet", auth=AUTH, headers=HEADERS, params=PARAMS,
    json={"Username": "RISHAB", "Action": "LOCK"}, timeout=30, verify=False)
print(f"Status: {r3.status_code}")
print(f"Response: {r3.text[:2000]}")
