from transformers import LayoutLMTokenizerFast
import pytesseract
from PIL import Image
import re

tokenizer = LayoutLMTokenizerFast.from_pretrained(
    "microsoft/layoutlm-base-uncased"
)

def extract_layout_data(image_path):

    image = Image.open(image_path)

    ocr_data = pytesseract.image_to_data(
        image,
        output_type=pytesseract.Output.DICT
    )

    words = []
    boxes = []

    n = len(ocr_data["text"])

    for i in range(n):

        word = ocr_data["text"][i].strip()

        if word:

            x = ocr_data["left"][i]
            y = ocr_data["top"][i]
            w = ocr_data["width"][i]
            h = ocr_data["height"][i]

            words.append(word)

            boxes.append([
                x,
                y,
                x+w,
                y+h
            ])

    return words, boxes


def ml_extract(image_path):

    words, boxes = extract_layout_data(image_path)

    encoding = tokenizer(
        words,
        boxes=boxes,
        is_split_into_words=True,
        return_tensors="pt",
        truncation=True,
        padding="max_length",
        max_length=512
    )

    return {
        "word_count": len(words),
        "box_count": len(boxes),
        "layout_aware": True
    }

def predict_fields(text):
    
    prediction = {}

    date_match = re.search(
        r'\d{2}/\d{2}/\d{2,4}',
        text
    )

    money_values = re.findall(
        r'\$?\d+\.\d{2}',
        text
    )

    prediction["predicted_date"] = (
        date_match.group()
        if date_match else None
    )

    prediction["predicted_total"] = (
        max(money_values)
        if money_values else None
    )

    return prediction