"""
Quick test script to verify SAP OData connectivity.
Tests all 4 systems: SHD, EMQ, EMP, EMD
Uses the UserLockSet endpoint with basic auth.
"""
import requests
import urllib3
import os
from dotenv import load_dotenv

# Suppress SSL warnings for self-signed certs
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

load_dotenv()

SYSTEMS = {
    "SHD": {
        "url": os.getenv("SAP_SHD_URL"),
        "user": os.getenv("SAP_SHD_USER"),
        "pass": os.getenv("SAP_SHD_PASS"),
        "client": os.getenv("SAP_SHD_CLIENT", "100"),
    },
    "EMQ": {
        "url": os.getenv("SAP_EMQ_URL"),
        "user": os.getenv("SAP_EMQ_USER"),
        "pass": os.getenv("SAP_EMQ_PASS"),
        "client": os.getenv("SAP_EMQ_CLIENT", "300"),
    },
    "EMP": {
        "url": os.getenv("SAP_EMP_URL"),
        "user": os.getenv("SAP_EMP_USER"),
        "pass": os.getenv("SAP_EMP_PASS"),
        "client": os.getenv("SAP_EMP_CLIENT", "200"),
    },
    "EMD": {
        "url": os.getenv("SAP_EMD_URL"),
        "user": os.getenv("SAP_EMD_USER"),
        "pass": os.getenv("SAP_EMD_PASS"),
        "client": os.getenv("SAP_EMD_CLIENT", "400"),
    },
}

def test_system(system_id, config):
    """Test connectivity to a single SAP system via UserLockSet."""
    base_url = config["url"]
    username = config["user"]
    password = config["pass"]
    client = config["client"]

    url = f"{base_url}/UserLockSet"
    params = {"sap-client": client, "$top": 1, "$format": "json"}
    headers = {"Accept": "application/json", "sap-client": client}

    print(f"\n{'='*60}")
    print(f"  Testing: {system_id}")
    print(f"  URL:     {url}")
    print(f"  User:    {username}")
    print(f"  Client:  {client}")
    print(f"{'='*60}")

    try:
        response = requests.get(
            url,
            auth=(username, password),
            headers=headers,
            params=params,
            timeout=30,
            verify=False,
        )
        print(f"  Status:  {response.status_code}")

        if response.status_code == 200:
            try:
                data = response.json()
                results = data.get("d", {}).get("results", [])
                print(f"  Result:  [OK] SUCCESS - Got {len(results)} record(s)")
                if results:
                    first = results[0]
                    print(f"  Sample:  UserName={first.get('Bname', first.get('UserName', 'N/A'))}")
            except Exception:
                print(f"  Result:  [OK] HTTP 200 but response is not JSON")
                print(f"  Body:    {response.text[:200]}")
        elif response.status_code == 401:
            print(f"  Result:  [FAIL] UNAUTHORIZED - Check username/password")
        elif response.status_code == 403:
            print(f"  Result:  [FAIL] FORBIDDEN - User lacks OData permissions")
        elif response.status_code == 404:
            print(f"  Result:  [FAIL] NOT FOUND - Check URL/entity set name")
        else:
            print(f"  Result:  ⚠️  HTTP {response.status_code}")
            print(f"  Body:    {response.text[:300]}")

    except requests.exceptions.ConnectTimeout:
        print(f"  Result:  [FAIL] TIMEOUT - Server not reachable")
    except requests.exceptions.ConnectionError as e:
        print(f"  Result:  [FAIL] CONNECTION ERROR - {str(e)[:150]}")
    except Exception as e:
        print(f"  Result:  [FAIL] ERROR - {str(e)[:200]}")


if __name__ == "__main__":
    print("\n[TEST] SAP OData Connectivity Test")
    print(f"   Testing UserLockSet endpoint on all 4 systems...\n")

    for sys_id, config in SYSTEMS.items():
        test_system(sys_id, config)

    print(f"\n{'='*60}")
    print("  Test complete!")
    print(f"{'='*60}\n")
