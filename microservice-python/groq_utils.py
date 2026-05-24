import os
import re
import json
import time
import requests
from groq import Groq
from dotenv import load_dotenv
import mysql.connector

# Load .env for fallback and database credentials
# Look for .env in current dir or up one level (backend)
load_dotenv()
if not os.getenv("DB_HOST"):
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

def get_groq_config():
    """
    Tries to fetch GROQ_API_KEY and GROQ_MODEL from the database.
    Falls back to environment variables if database access fails.
    """
    config = {
        "api_key": os.getenv("GROQ_API_KEY"),
        "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    }

    host = os.getenv("DB_HOST")
    user = os.getenv("DB_USER")
    
    if not host or not user:
        # Try to load from backend .env if not loaded yet
        backend_env = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
        if os.path.exists(backend_env):
            load_dotenv(backend_env)
            host = os.getenv("DB_HOST")
            user = os.getenv("DB_USER")
            if host: config["api_key"] = os.getenv("GROQ_API_KEY")

    try:
        if host and user:
            # We use a short timeout for DB connection to avoid hanging
            conn = mysql.connector.connect(
                host=host,
                port=int(os.getenv("DB_PORT", 3306)),
                user=user,
                password=os.getenv("DB_PASS"),
                database=os.getenv("DB_NAME"),
                ssl_disabled=False if os.getenv("DB_SSL") == "true" else True,
                connect_timeout=5
            )
            cursor = conn.cursor(dictionary=True)
            
            # Fetch GROQ_API_KEY
            cursor.execute("SELECT value FROM configurations WHERE `key` = 'GROQ_API_KEY'")
            row = cursor.fetchone()
            if row and row['value']:
                config["api_key"] = row['value']
            
            # Fetch GROQ_MODEL
            cursor.execute("SELECT value FROM configurations WHERE `key` = 'GROQ_MODEL'")
            row = cursor.fetchone()
            if row and row['value']:
                config["model"] = row['value']
                
            cursor.close()
            conn.close()
    except Exception as e:
        import sys
        sys.stderr.write(f"[Groq Utils] Info: Database config fetch skipped/failed ({str(e)}). Using env/defaults.\n")
    
    if not config["api_key"]:
         sys.stderr.write("[Groq Utils] Warning: GROQ_API_KEY is missing in both DB and .env\n")

    return config

def extract_fallback(text):
    """Fallback extraction using regex if Groq is unavailable."""
    result = {
        "salaire_brut": 0.0,
        "total_cotisations_salariales": 0.0,
        "total_charges_patronales": 0.0,
        "repas_restaurant": 0.0,
        "net_avant_impot": 0.0,
        "net_paye": 0.0
    }
    
    def find_amount(keywords, content):
        for kw in keywords:
            pattern = rf"{kw}.*?(\d[\d\s\.]*[,\.]\d{{2}})"
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                val = match.group(1).replace(' ', '').replace(',', '.')
                try:
                    return round(float(val), 2)
                except:
                    continue
        return 0.0

    result["salaire_brut"] = find_amount(["SALAIRE BRUT", "TOTAL BRUT"], text)
    result["net_paye"] = find_amount(["NET A PAYER", "NET VERSE", "NET A VERSER"], text)
    result["net_avant_impot"] = find_amount(["NET AVANT IMPOT", "NET FISCAL"], text)
    
    def find_all_repas_sum(keywords, content):
        total = 0.0
        found_lines = set()
        lines = content.split('\n')
        for i, line in enumerate(lines):
            for kw in keywords:
                if kw.upper() in line.upper() and i not in found_lines:
                    amounts = re.findall(r"(\d[\d\s\.]*[,\.]\d{2})", line)
                    if amounts:
                        val = amounts[-1].replace(' ', '').replace(',', '.')
                        try:
                            total += round(float(val), 2)
                            found_lines.add(i)
                            break
                        except:
                            continue
        return total

    result["repas_restaurant"] = find_all_repas_sum(["TITRES RESTAURANT", "PANIER", "REPAS"], text)
    return result

def extract_employee_fallback(text):
    result = {"nom": "", "adresse": "", "numSécu": ""}
    ssn_match = re.search(r"(?:N°\s*SS|Sécurité\s*Sociale)\s*[:\.]?\s*((?:\d[\s]*){13,15})", text, re.IGNORECASE)
    if ssn_match:
        result["numSécu"] = re.sub(r'\s', '', ssn_match.group(1))
    
    name_patterns = [
        r"(Monsieur|M\.|Madame|Mme|Mlle|MLLE)\s+([A-ZÀ-Ÿ][a-zà-ÿA-ZÀ-Ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿA-ZÀ-Ÿ]+){0,2})",
        r"(Monsieur|M\.|Madame|Mme|Mlle|MLLE)\s+([^\d\n:]{3,50})",
    ]
    for pattern in name_patterns:
        name_match = re.search(pattern, text, re.IGNORECASE)
        if name_match:
            name_raw = name_match.group(2).strip()
            name_clean = re.split(r"(?i)\b(Matricule|Emploi|N°|Date|Niv|Coef|Qualif|Entr[eé]e|Naissance|Service|Position|Statut|Convention)\b", name_raw)[0].strip()
            name_words = name_clean.split()
            if len(name_words) > 3: name_words = name_words[:3]
            result["nom"] = ' '.join(name_words)
            break
            
    street_keywords = r"\b(?:RUE|AVENUE|AVE|BOULEVARD|ALLÉE|ALLEE|IMPASSE|CHEMIN|PLACE|SQUARE|VOIE|BD|AV|CHE|ALL)\b"
    all_lines = text.split('\n')
    street_line = ""
    street_line_idx = -1
    for i, line in enumerate(all_lines):
        if re.search(street_keywords, line, re.IGNORECASE):
            street_line = line.strip()
            street_line_idx = i
            
    if street_line:
        labels_to_clean = r'^(?:Emploi|Matricule|N[\s\xB0]+SS|Convention|Qualif|Entr\w+|Consultant[^\s]*|Poste|Niveau|Coef|Position|Statut|Service|Affectation|Etabl\w+)\s*[:\.\-]?\s*'
        street_line = re.sub(labels_to_clean, '', street_line, flags=re.IGNORECASE).strip()
        zip_city_pattern = r"\b(\d{5}\s+[A-ZÀ-Ÿ]{2,}[A-ZÀ-Ÿa-zà-ÿ\s\-]*)"
        zip_inline = re.search(zip_city_pattern, street_line)
        if zip_inline:
            city_zip = zip_inline.group(1).strip()
            street_line = street_line[:zip_inline.start()].strip()
            result["adresse"] = f"{street_line}, {city_zip}"
        else:
            for offset in [1, 2, 3, -1, -2]:
                idx = street_line_idx + offset
                if 0 <= idx < len(all_lines):
                    zip_match = re.search(zip_city_pattern, all_lines[idx])
                    if zip_match:
                        result["adresse"] = f"{street_line}, {zip_match.group(1).strip()}"
                        break
            if not result["adresse"]: result["adresse"] = street_line
            
    return result

def extract_employee_groq(text):
    text_snippet = text[:12000] if len(text) > 12000 else text # Groq handles larger context
    config = get_groq_config()
    
    if not config["api_key"]:
        fallback = extract_employee_fallback(text)
        fallback["_source"] = "fallback_no_api_key"
        return fallback

    client = Groq(api_key=config["api_key"])
    prompt = f"""
      Tu es un expert en extraction de données de bulletins de paie français.
      Extrais UNIQUEMENT les informations du SALARIÉ.
      
      ### TEXTE DU PDF :
      {text_snippet}
      
      ### RÈGLES :
      1. IDENTIFIE LE SALARIÉ : Cherche le nom de la personne concernée. Pas l'Employeur.
      2. NOM : Retourne "Prénom NOM".
      3. ADRESSE : Adresse postale complète.
      4. NUM_SECU : Numéro de sécurité sociale (13 ou 15 chiffres).
      5. Retourne UNIQUEMENT un JSON format: {{"nom": "", "adresse": "", "numSécu": ""}}
    """
    
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=config["model"],
            temperature=0,
            response_format={"type": "json_object"}
        )
        res = json.loads(completion.choices[0].message.content)
        res["_source"] = "groq_profile"
        return res
    except Exception as e:
        fallback = extract_employee_fallback(text)
        fallback["_source"] = "fallback_error"
        fallback["_error"] = str(e)
        return fallback

def extract_groq(text):
    text_snippet = text[:12000] if len(text) > 12000 else text
    config = get_groq_config()
    
    if not config["api_key"]:
        fallback = extract_fallback(text)
        fallback["_source"] = "fallback_no_api_key"
        return fallback

    client = Groq(api_key=config["api_key"])
    prompt = f"""
      Tu es un expert en extraction OCR spécialisé dans les bulletins de paie français. 
      Extrais les montants financiers précis et retourne-les au format JSON plat.

      ### Données à extraire :
      - salaire_brut
      - total_cotisations_salariales
      - total_charges_patronales
      - repas_restaurant
      - net_avant_impot
      - net_paye

      ### Règles :
      1. Retourne EXCLUSIVEMENT un JSON valide.
      2. Utilise le point (.) pour les décimaux.
      3. Si manquant, mets 0.0.

      Texte du PDF:
      {text_snippet}
    """
    
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=config["model"],
            temperature=0,
            response_format={"type": "json_object"}
        )
        result = json.loads(completion.choices[0].message.content)
        
        final_result = {"_source": "groq"}
        for key in ["salaire_brut", "total_cotisations_salariales", "total_charges_patronales", "repas_restaurant", "net_avant_impot", "net_paye"]:
            val = result.get(key, 0.0)
            if isinstance(val, str):
                s = re.sub(r'[^\d,\.\-]', '', val).replace(',', '.')
                try: final_result[key] = round(float(s), 2)
                except: final_result[key] = 0.0
            else:
                final_result[key] = float(val) if isinstance(val, (int, float)) else 0.0
        return final_result
    except Exception as e:
        fallback = extract_fallback(text)
        fallback["_source"] = "fallback_error"
        fallback["_error"] = str(e)
        return fallback
