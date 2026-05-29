# app/utils/regex_patterns.py

# -----------------------
# INVOICE NUMBER
# -----------------------

INVOICE_NUMBER_PATTERNS = [

    r'Invoice\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)',
    r'Invoice\s*Number\s*[:\-]?\s*([A-Za-z0-9\/\-]+)',
    r'Bill\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)',
    r'Document\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)',

]

# -----------------------
# DATE
# -----------------------

DATE_PATTERNS = [

    r'\d{2}/\d{2}/\d{4}',
    r'\d{2}-\d{2}-\d{4}',
    r'\d{4}-\d{2}-\d{2}',
    r'\d{2}\.\d{2}\.\d{4}'

]

# -----------------------
# GST
# -----------------------

GST_PATTERNS = [

    r'GSTIN[:\-]?\s*([0-9A-Z]{15})',
    r'GST\s*No\.?\s*[:\-]?\s*([0-9A-Z]{15})'

]

# -----------------------
# VENDOR
# -----------------------

VENDOR_PATTERNS = [

    r'Sold\s*By[:\-]?\s*(.+)',
    r'Vendor[:\-]?\s*(.+)',
    r'Supplier[:\-]?\s*(.+)',
    r'From[:\-]?\s*(.+)',
    r'M/s\.?\s*(.+)',
    r'Company\s*Name[:\-]?\s*(.+)'

]

# -----------------------
# SUBTOTAL
# -----------------------

SUBTOTAL_PATTERNS = [

    r'Sub\s*Total[:\-]?\s*₹?\s*([\d,]+\.\d{2})',
    r'SUBTOTAL[:\-]?\s*₹?\s*([\d,]+\.\d{2})'

]

# -----------------------
# TAX (FIXED)
# -----------------------
TAX_PATTERNS = [

    r'IGST[:\-]?\s*₹?\s*([\d,]+\.\d{2})',

    r'CGST[:\-]?\s*₹?\s*([\d,]+\.\d{2})',

    r'SGST[:\-]?\s*₹?\s*([\d,]+\.\d{2})',

    r'GST[:\-]?\s*₹?\s*([\d,]+\.\d{2})',

    r'GST\s*Amount[:\-]?\s*₹?\s*([\d,]+\.\d{2})',

    r'Tax\s*Amount[:\-]?\s*₹?\s*([\d,]+\.\d{2})',

    r'Total\s*Tax[:\-]?\s*₹?\s*([\d,]+\.\d{2})',

    r'Tax[:\-]?\s*₹?\s*([\d,]+\.\d{2})'
]

# -----------------------
# EMAIL
# -----------------------

EMAIL_PATTERNS = [

    r'([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'

]

# -----------------------
# PHONE
# -----------------------

PHONE_PATTERNS = [

    r'(\+91[- ]?\d{10})',

    r'(\d{10})',

    r'Tel[:\-]?\s*([0-9+\-\s]+)',

    r'Mobile[:\-]?\s*([0-9+\-\s]+)'

]

# -----------------------
# PAYMENT MODE (FIXED)
# -----------------------

PAYMENT_PATTERNS = [

    r'Payment\s*Mode[:\-]?\s*(.+)',

    r'Mode\s*Of\s*Payment[:\-]?\s*(.+)',

    r'Paid\s*Via[:\-]?\s*(.+)',

    r'Payment\s*Method[:\-]?\s*(.+)',

    r'Bank\s*Transfer',

    r'UPI',

    r'Credit\s*Card',

    r'Debit\s*Card',

    r'Cash'

]

# -----------------------
# PO NUMBER
# -----------------------

PO_PATTERNS = [

    r'PO\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)',

    r'PO\s*Number[:\-]?\s*([A-Za-z0-9\/\-]+)',

    r'Purchase\s*Order[:\-]?\s*([A-Za-z0-9\/\-]+)'

]

# -----------------------
# QUANTITY (FIXED)
# -----------------------

QUANTITY_PATTERNS = [

    r'Quantity[:\-]?\s*(\d+(?:\.\d+)?)',

    r'Qty[:\-]?\s*(\d+(?:\.\d+)?)',

    r'QTY[:\-]?\s*(\d+(?:\.\d+)?)',

    r'Total\s*Qty[:\-]?\s*(\d+(?:\.\d+)?)',

    r'Units?[:\-]?\s*(\d+(?:\.\d+)?)',

    r'Pieces?[:\-]?\s*(\d+(?:\.\d+)?)',

    r'Nos?[:\-]?\s*(\d+(?:\.\d+)?)'
]
# -----------------------
# ADDRESS (FIXED)
# -----------------------

ADDRESS_PATTERNS = [

    r'Billing\s*Address[:\-]?\s*(.+)',

    r'Shipping\s*Address[:\-]?\s*(.+)',

    r'Address[:\-]?\s*(.+)',

    r'Registered\s*Office[:\-]?\s*(.+)'

]