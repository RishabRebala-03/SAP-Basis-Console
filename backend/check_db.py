from pymongo import MongoClient
db = MongoClient('mongodb://127.0.0.1:27017/sap_basis_console')['sap_basis_console']
for d in db.sap_systems.find():
    sid = d.get('system_id', 'N/A')
    url = d.get('url', 'N/A')
    user = d.get('user', 'N/A')
    pwd = d.get('password', 'N/A')
    client = d.get('client', 'N/A')
    print(f"{sid}: url={url}")
    print(f"     user={user}  pass={pwd}  client={client}")
    print()
