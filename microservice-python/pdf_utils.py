import pdfplumber
from PIL import Image
import pytesseract


# Vérifie si le PDF est scanné ou contient du vrai texte
def is_pdf_scanned(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        # On parcourt chaque page
        for page in pdf.pages:

            # On tente d’extraire le texte de la page
            if page.extract_text():
                return False

    # Aucun texte trouvé → PDF scanné
    return True


# Extraction normale du texte avec pdfplumber
def extract_text_pdf(pdf_path):
    text = ""

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:

                # Extraction du texte avec gestion des espaces/colonnes
                content = page.extract_text(
                    x_tolerance=3,
                    y_tolerance=3
                )

                if content:
                    text += content + "\n"

    except Exception as e:
        print(f"Erreur pdfplumber: {e}")

    return text


# Extraction OCR pour les PDF scannés
def extract_text_ocr(pdf_path):

    from pdf2image import convert_from_path

    text = ""

    try:
        # Convertir les pages PDF en images (DPI 200 pour économiser la RAM)
        pages = convert_from_path(pdf_path, dpi=200)

        for page in pages:

            # OCR sur chaque image
            text += pytesseract.image_to_string(
                page,
                lang='fra'
            ) + "\n"

    except Exception as e:
        print(f"Erreur OCR: {e}")

    return text