# SAP Constants & Configuration Defaults

SAP_USER_TYPES = {
    "A": "Dialog (Regular User)",
    "B": "System (Background / RFC)",
    "C": "Communication (External calls)",
    "S": "Service (Multi-user dialog)",
    "L": "Reference (Non-login)"
}

SAP_LANGUAGES = {
    "EN": "English",
    "DE": "German",
    "FR": "French",
    "ES": "Spanish",
    "JA": "Japanese",
    "ZH": "Chinese"
}

# Pre-populated catalog for UI selection
AVAILABLE_ROLES = [
    "SAP_ALL",
    "SAP_NEW",
    "Z_BASIS_ADMIN",
    "Z_DEVELOPER_FULL",
    "Z_FINANCE_CLERK",
    "Z_HR_SPECIALIST",
    "Z_READ_ONLY",
    "Z_SALES_MANAGER",
    "Z_SECURITY_AUDITOR"
]

AVAILABLE_PROFILES = [
    "SAP_ALL",
    "SAP_NEW",
    "S_A.SYSTEM",
    "S_A.USER",
    "S_A.CUSTOM",
    "S_DEVELOP",
    "Z_FIN_ALL",
    "Z_HR_ALL"
]
