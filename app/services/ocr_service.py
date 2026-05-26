import cv2
import pytesseract

from app.utils.preprocess import preprocess_image


pytesseract.pytesseract.tesseract_cmd = \
    r"C:\Users\DTG104\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"


def extract_text_from_image(file_path):

    processed_image = preprocess_image(file_path)

    temp_path = "temp.png"

    cv2.imwrite(temp_path, processed_image)

    custom_config = (
        r'--tessdata-dir '
        r'C:\Users\DTG104\AppData\Local\Programs\Tesseract-OCR\tessdata'
    )

    text = pytesseract.image_to_string(
        temp_path,
        lang="eng",
        config=custom_config
    )

    return text