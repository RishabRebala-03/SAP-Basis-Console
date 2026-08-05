import io
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

# Simplified template header columns matching required operations
TEMPLATE_COLUMNS = [
    "Username",
    "Last Name",
    "First Name",
    "Email",
    "Init Password",
    "Valid From",
    "Valid To",
    "Profiles",
    "Roles"
]

def generate_template():
    """Generates a styled standard Excel template for bulk creation."""
    wb = Workbook()
    ws = wb.active
    ws.title = "User Provisioning Template"

    # Style definitions
    header_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    align = Alignment(horizontal="center", vertical="center", wrap_text=True)

    # Write headers
    for col_num, header in enumerate(TEMPLATE_COLUMNS, 1):
        cell = ws.cell(row=1, column=col_num)
        cell.value = header
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = align

    # Set column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        ws.column_dimensions[col[0].column_letter].width = max(max_len + 4, 15)

    # Add a sample row
    sample_row = [
        "JDOE", "Doe", "John", "john.doe@company.com", "InitPass123!", "2026-07-20", "2027-12-31",
    "SAP_ALL,SAP_NEW", "Z_BASIS_ADMIN,Z_DEVELOPER_FULL"
    ]
    
    for col_num, val in enumerate(sample_row, 1):
        cell = ws.cell(row=2, column=col_num)
        cell.value = val

    # Save to BytesIO stream
    out = io.BytesIO()
    wb.save(out)
    out.seek(0)
    return out

def generate_delete_template():
    """Generates a simple Excel template for bulk user deletion."""
    wb = Workbook()
    ws = wb.active
    ws.title = "User Deletion Template"

    header_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    align = Alignment(horizontal="center", vertical="center", wrap_text=True)

    headers = ["Username"]
    for col_num, header in enumerate(headers, 1):
      cell = ws.cell(row=1, column=col_num)
      cell.value = header
      cell.font = header_font
      cell.fill = header_fill
      cell.alignment = align

    ws.cell(row=2, column=1).value = "JDOE"
    ws.column_dimensions["A"].width = 20

    out = io.BytesIO()
    wb.save(out)
    out.seek(0)
    return out

def parse_and_validate_excel(file_stream):
    """Parses user-uploaded Excel workbook and runs validation checks."""
    try:
        df = pd.read_excel(file_stream)
    except Exception as e:
        raise Exception(f"Failed to read Excel workbook structure: {str(e)}")

    # Standardize column casing and trim spaces
    df.columns = [str(c).strip() for c in df.columns]
    
    # Required columns only – First Name, Email are optional
    required_cols = ["Username", "Last Name", "Init Password", "Valid From", "Valid To"]
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        raise Exception(f"Invalid template format. Missing required columns: {', '.join(missing_cols)}")

    records = []
    for idx, row in df.iterrows():
        row_num = idx + 2  # 1-based index plus header row
        username = str(row.get("Username", "")).strip().upper()
        last_name = str(row.get("Last Name", "")).strip()
        first_name = str(row.get("First Name", "")).strip()
        email = str(row.get("Email", "")).strip()
        init_pass = str(row.get("Init Password", "")).strip()
        valid_from = str(row.get("Valid From", "")).strip()
        valid_to = str(row.get("Valid To", "")).strip()

        errors = []

        if not username or username.upper() == "NAN":
            errors.append("Username is mandatory")
        if not last_name or last_name.upper() == "NAN":
            errors.append("Last Name is mandatory")
        if not init_pass or init_pass.upper() == "NAN":
            errors.append("Initial Password is mandatory")
        elif len(init_pass) < 8:
            errors.append("Password must be at least 8 characters long")
            
        # Parse profiles and roles (comma-separated lists)
        profiles_str = str(row.get("Profiles", "")).strip()
        roles_str = str(row.get("Roles", "")).strip()
        
        profiles = [p.strip() for p in profiles_str.split(",") if p.strip() and p.strip().lower() != "nan"]
        roles = [r.strip() for r in roles_str.split(",") if r.strip() and r.strip().lower() != "nan"]

        # Normalise NAN values from pandas
        def _clean(v):
            return "" if not v or v.upper() == "NAN" else v

        records.append({
            "row_num": row_num,
            "username": _clean(username),
            "last_name": _clean(last_name),
            "first_name": _clean(first_name),
            "email": _clean(email),
            "init_password": _clean(init_pass),
            "valid_from": _clean(valid_from) or None,
            "valid_to": _clean(valid_to) or None,
            "profiles": profiles,
            "roles": roles,
            "errors": errors,
            "is_valid": len(errors) == 0
        })

    return records

def parse_and_validate_delete_excel(file_stream):
    """Parses user-uploaded deletion workbook and validates usernames."""
    try:
        df = pd.read_excel(file_stream)
    except Exception as e:
        raise Exception(f"Failed to read Excel workbook structure: {str(e)}")

    df.columns = [str(c).strip() for c in df.columns]
    required_cols = ["Username"]
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        raise Exception(f"Invalid template format. Missing required columns: {', '.join(missing_cols)}")

    records = []
    for idx, row in df.iterrows():
        row_num = idx + 2
        username = str(row.get("Username", "")).strip().upper()
        errors = []
        if not username or username.upper() == "NAN":
            errors.append("Username is mandatory")
        records.append({
            "row_num": row_num,
            "username": username,
            "errors": errors,
            "is_valid": len(errors) == 0
        })
    return records

def generate_processing_report(records, results):
    """Generates an Excel workbook compiling the execution feedback for each uploaded user."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Provisioning Execution Report"

    # Style definitions
    header_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    success_fill = PatternFill(start_color="C6EFCE", end_color="C6EFCE", fill_type="solid") # soft green
    failed_fill = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid") # soft red
    success_font = Font(name="Arial", size=10, color="006100", bold=True)
    failed_font = Font(name="Arial", size=10, color="9C0006", bold=True)

    # Prepare DataFrame columns
    columns = TEMPLATE_COLUMNS + ["Execution Status", "SAP Gateway Response"]
    for col_num, header in enumerate(columns, 1):
        cell = ws.cell(row=1, column=col_num)
        cell.value = header
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")

    # Populate rows
    for r_idx, (rec, res) in enumerate(zip(records, results), 2):
        profiles_str = ",".join(rec.get("profiles", []))
        roles_str = ",".join(rec.get("roles", []))
        
        row_vals = [
            rec.get("username"),
            rec.get("last_name"),
            "********",  # mask passwords
            rec.get("valid_from"),
            rec.get("valid_to"),
            profiles_str,
            roles_str,
            res.get("status"),
            res.get("message")
        ]

        for col_idx, val in enumerate(row_vals, 1):
            cell = ws.cell(row=r_idx, column=col_idx)
            cell.value = val
            
            # Format status columns
            if col_idx == len(columns) - 1:  # Status column
                if val == "Success":
                    cell.fill = success_fill
                    cell.font = success_font
                else:
                    cell.fill = failed_fill
                    cell.font = failed_font

    # Set column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        ws.column_dimensions[col[0].column_letter].width = max(max_len + 4, 15)

    out = io.BytesIO()
    wb.save(out)
    out.seek(0)
    return out
