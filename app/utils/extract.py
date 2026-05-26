import re

from app.utils.regex_patterns import (
    INVOICE_NUMBER_PATTERNS,
    GST_PATTERNS,
    VENDOR_PATTERNS,
    SUBTOTAL_PATTERNS,
    TAX_PATTERNS,
    EMAIL_PATTERNS,
    PHONE_PATTERNS,
    PAYMENT_PATTERNS,
    PO_PATTERNS,
    QUANTITY_PATTERNS,
    ADDRESS_PATTERNS
)

# ----------------------------------
# COMMON PATTERN FINDER
# ----------------------------------

def find_pattern(patterns, text):

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            if match.groups():
                return match.group(1).strip()

            return match.group(0).strip()

    return None


# ----------------------------------
# DATE EXTRACTOR
# ----------------------------------

def extract_best_date(text):

    patterns = [

        r'\d{2}[/-]\d{2}[/-]\d{4}',
        r'\d{4}[/-]\d{2}[/-]\d{2}',
        r'\d{2}\.\d{2}\.\d{4}',
        r'\d{2}\s+[A-Za-z]{3,9}\s+\d{4}',
        r'[A-Za-z]{3,9}\s+\d{2},\s+\d{4}'
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:
            return match.group(0)

    return None

def extract_best_tax(text):
    
    patterns = TAX_PATTERNS

    for pattern in patterns:

        match = re.search(pattern, text, re.IGNORECASE)

        if match:

            print("TAX MATCHED =", pattern)
            print("TAX VALUE =", match.group(1))

            return match.group(1).replace(",", "")

    return "0.00"

def extract_best_quantity(text):
    
    # 1. Normal label matching
    result = find_pattern(QUANTITY_PATTERNS, text)

    if result:
        print("QUANTITY FOUND =", result)
        return result

    # 2. Table fallback logic
    table_pattern = r'([A-Za-z0-9\s]+)\s+(\d+)\s+([\d,.]+)\s+([\d,.]+)'

    rows = re.findall(table_pattern, text)

    if rows:

        print("TABLE ROWS =", rows)

        try:
            qty = rows[0][1]

            print("TABLE QUANTITY =", qty)

            return qty

        except:
            pass

    return None

# ----------------------------------
# TOTAL EXTRACTOR
# ----------------------------------

def extract_best_total(text):

    priority_patterns = [

        r"Total\s*Payable[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)",

        r"Gross\s*Amount[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)",

        r"Gross\s*Advice\s*Value[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)",

        r"Grand\s*Total[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)",

        r"Invoice\s*Total[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)",

        r"Net\s*Amount[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)",

        r"Net\s*Value[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)",

        r"Total\s*Amount[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)",

        r"Amount\s*Due[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)",

        r"\bTOTAL\b[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)"
    ]

    for pattern in priority_patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            print("TOTAL MATCHED =", pattern)
            print("VALUE =", match.group(1))

            try:

                val = float(
                    match.group(1).replace(",", "")
                )

                if val > 0:
                    return val

            except Exception as e:

                print("TOTAL ERROR =", e)

    # SUBTOTAL + TAX LOGIC

    subtotal = None
    tax = 0

    subtotal_match = re.search(
        r"SUBTOTAL\s*[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)",
        text,
        re.IGNORECASE
    )

    tax_match = re.search(
        r"(GST|TAX|VAT|IGST|CGST|SGST)\s*[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)",
        text,
        re.IGNORECASE
    )

    if subtotal_match:

        try:

            subtotal = float(
                subtotal_match.group(1).replace(",", "")
            )

        except:
            subtotal = None

    if tax_match:

        try:

            tax = float(
                tax_match.group(2).replace(",", "")
            )

        except:
            tax = 0

    if subtotal is not None:

        final_total = round(
            subtotal + tax,
            2
        )

        return final_total

    # FALLBACK

    money_pattern = r"(?:₹|\$)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)"

    candidates = re.findall(
        money_pattern,
        text
    )

    values = []

    for c in candidates:

        try:

            val = float(
                c.replace(",", "")
            )

            if 100 <= val <= 10000000:
                values.append(val)

        except:
            pass

    print("ALL MONEY VALUES =", values)

    if not values:
        return None

    return max(values)


# ----------------------------------
# MAIN EXTRACTOR
# ----------------------------------

def extract_invoice_data(text):

    data = {

        "invoice_number":
            find_pattern(INVOICE_NUMBER_PATTERNS, text),

        "date":
            extract_best_date(text),

        "subtotal":
            find_pattern(SUBTOTAL_PATTERNS, text),

        "tax":
             extract_best_tax(text),
        "total":
            extract_best_total(text),

        "gstin":
            find_pattern(GST_PATTERNS, text),

        "vendor_name":
            find_pattern(VENDOR_PATTERNS, text),

        "email":
            find_pattern(EMAIL_PATTERNS, text),

        "phone":
            find_pattern(PHONE_PATTERNS, text),

        "payment_mode":
            find_pattern(PAYMENT_PATTERNS, text),

        "po_number":
            find_pattern(PO_PATTERNS, text),

        "quantity":
             extract_best_quantity(text),

        "address":
            find_pattern(ADDRESS_PATTERNS, text)
    }

    print("FINAL EXTRACTED DATA =", data)

    return data