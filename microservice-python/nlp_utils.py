import re

def clean_text(text):
    text = text.replace("\n", " ").strip()
    text = re.sub(r"\s+", " ", text)        # Remplace les espaces multiples par un seul espace
    return text
