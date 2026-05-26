from email.mime import text

from app.utils.extract import extract_invoice_data
from app.models.invoice_model import Invoice
from app.db.database import SessionLocal
from app.ml.layoutlm_service import (ml_extract,predict_fields)
from app.ml.bilstm_service import bilstm_extract



def process_invoice_data(text, filename, file_path):
    
    structured_data = extract_invoice_data(text)

    # FIXED ML OUTPUT
    if file_path:
        ml_output = ml_extract(file_path)
    else:
        ml_output = {}

    ml_prediction = predict_fields(text)
    bilstm_output = bilstm_extract(text)

    structured_data["ml_analysis"] = ml_output
    structured_data["ml_prediction"] = ml_prediction
    structured_data["aiesi_analysis"] = bilstm_output

    # -----------------------------
    # NORMALIZATION LAYER
    # -----------------------------

    try:
        if structured_data.get("total"):

            structured_data["total"] = float(
                str(structured_data["total"])
                .replace(",", "")
                .replace("$", "")
                .replace("₹", "")
            )

        else:
            structured_data["total"] = 0.0

    except:
        structured_data["total"] = 0.0

    if not structured_data.get("date"):
        structured_data["date"] = None

    if not structured_data.get("invoice_number"):
        structured_data["invoice_number"] = None

    if not structured_data.get("vendor_name"):
        structured_data["vendor_name"] = None

    return structured_data