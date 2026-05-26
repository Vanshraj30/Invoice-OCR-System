import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            ".."
        )
    )
)

from app.services.ocr_service import extract_text_from_image
from app.services.extraction_service import process_invoice_data

BASE_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        ".."
    )
)

DATASET_FOLDER = os.path.join(
    BASE_DIR,
    "datasets",
    "invoices"
)


def run_benchmark():
    
    files = os.listdir(DATASET_FOLDER)

    total_files = len(files)

    successful = 0

    for file_name in files:

        file_path = os.path.join(
            DATASET_FOLDER,
            file_name
        )

        print("\n======================")
        print("Testing:", file_name)

        text = extract_text_from_image(
            file_path
        )

        result = process_invoice_data(
            text,
            file_name,
            file_path
        )

        print(result)

        if (
            result.get("ml_prediction", {})
            .get("predicted_total")
        ):
            successful += 1

    print("\n======================")
    print("BENCHMARK SUMMARY")
    print(
        f"Success Rate: "
        f"{successful}/{total_files}"
    )

run_benchmark()