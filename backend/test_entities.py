import requests
import urllib3
urllib3.disable_warnings()

# Test UserLockSet with key Username='RISHAB'
url = "http://183.82.103.80:8011/sap/opu/odata/SAP/ZBSUSERODATA_SRV/UserLockSet(Username='RISHAB')"
r = requests.get(
    url,
    auth=('AITEST1', 'Naxrita@2026'),
    headers={'Accept': 'application/json', 'sap-client': '100'},
    params={'sap-client': '100', '$format': 'json'},
    timeout=30,
    verify=False
)
print(f"Status: {r.status_code}")
print(r.text[:2000])

print("\n--- Testing UserPasswordResetSet ---")
url2 = "http://183.82.103.80:8011/sap/opu/odata/SAP/ZBSUSERODATA_SRV/UserPasswordResetSet(Username='RISHAB')"
r2 = requests.get(
    url2,
    auth=('AITEST1', 'Naxrita@2026'),
    headers={'Accept': 'application/json', 'sap-client': '100'},
    params={'sap-client': '100', '$format': 'json'},
    timeout=30,
    verify=False
)
print(f"Status: {r2.status_code}")
print(r2.text[:2000])

print("\n--- Testing UserCreationSet ---")
url3 = "http://183.82.103.80:8011/sap/opu/odata/SAP/ZBSUSERODATA_SRV/UserCreationSet(Username='RISHAB')"
r3 = requests.get(
    url3,
    auth=('AITEST1', 'Naxrita@2026'),
    headers={'Accept': 'application/json', 'sap-client': '100'},
    params={'sap-client': '100', '$format': 'json'},
    timeout=30,
    verify=False
)
print(f"Status: {r3.status_code}")
print(r3.text[:2000])
