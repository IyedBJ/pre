from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json
from datetime import datetime

# ── Configuration ──
FRONTEND_URL = "http://localhost:5173"
USERNAME = "iyedtest"
PASSWORD = "Iyed@2026"

TEST_QUESTIONS = [
    {
        "question": "Quels sont les modules disponibles dans l'application ?",
        "mots_cles": ["tableau de bord", "salarié", "projet", "client", "facturation", "historique", "prévision", "paramètre"],
        "categorie": "Connaissance fonctionnelle"
    },
    {
        "question": "Comment fonctionne le module de gestion des salariés ?",
        "mots_cles": ["salaire", "saisie", "mensuel", "frais", "prime", "kilométrique", "repas"],
        "categorie": "Détail module"
    },
    {
        "question": "Quelle est la stack technique utilisée dans ce projet ?",
        "mots_cles": ["react", "node", "express", "mysql", "sequelize", "dolibarr", "jwt"],
        "categorie": "Connaissance technique"
    },
    {
        "question": "Qu'est-ce que Dolibarr et comment est-il intégré dans l'application ?",
        "mots_cles": ["erp", "client", "projet", "import", "synchroni"],
        "categorie": "Intégration ERP"
    },
    {
        "question": "Comment fonctionne l'authentification dans l'application ?",
        "mots_cles": ["ldap", "active directory", "jwt", "token", "connexion"],
        "categorie": "Sécurité"
    },
    {
        "question": "Qu'est-ce que le module de prévision IA ?",
        "mots_cles": ["prédic", "prévision", "financ", "projection", "rentabilité", "marge"],
        "categorie": "Intelligence Artificielle"
    },
    {
        "question": "Comment est calculée la rentabilité d'un projet ?",
        "mots_cles": ["marge", "chiffre d'affaires", "coût", "salaire", "frais", "rentabilité"],
        "categorie": "Logique métier"
    },
    {
        "question": "Qui a développé cette application et dans quel cadre ?",
        "mots_cles": ["elzei", "pfe", "fin d'études", "rentabilité"],
        "categorie": "Contexte projet"
    },
    {
        "question": "Quels KPIs sont affichés sur le tableau de bord ?",
        "mots_cles": ["marge", "chiffre", "kpi", "indicateur", "performance"],
        "categorie": "Dashboard"
    },
    {
        "question": "Peux-tu me donner un résumé des projets en cours ?",
        "mots_cles": ["projet", "statut", "client", "marge"],
        "categorie": "Données en temps réel"
    },
]

# ── Initialisation du navigateur ──
service = Service(executable_path="chromedriver.exe")
driver = webdriver.Chrome(service=service)
wait = WebDriverWait(driver, 20)

# ── Stockage des résultats ──
results = []


def send_chatbot_message(question, question_num, total):
    """Envoie un message au chatbot et récupère la réponse avec synchronisation robuste."""
    print(f"\n{'─'*60}")
    print(f"  Question {question_num}/{total}")
    print(f"{'─'*60}")
    print(f"  {question}")

    # Compter les bulles existantes avant l'envoi
    previous_bubbles_count = len(driver.find_elements(By.CSS_SELECTOR, "div.flex.gap-2\\.5.flex-row"))

    # Saisir la question
    chatbot_input = wait.until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, "textarea[placeholder='Posez votre question à Elzei IA...']")
        )
    )
    chatbot_input.clear()
    chatbot_input.send_keys(question)
    time.sleep(0.5)

    # Envoyer
    send_button = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Envoyer']"))
    )
    send_button.click()

    # 1. Attendre qu'une NOUVELLE bulle apparaisse
    start_wait = time.time()
    while time.time() - start_wait < 30:  # Timeout 30s
        current_bubbles = driver.find_elements(By.CSS_SELECTOR, "div.flex.gap-2\\.5.flex-row")
        if len(current_bubbles) > previous_bubbles_count:
            break
        time.sleep(0.5)

    # 2. Attendre la fin de l'animation de chargement si elle existe
    try:
        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.CSS_SELECTOR, ".animate-bounce")))
        WebDriverWait(driver, 20).until(EC.invisibility_of_element_located((By.CSS_SELECTOR, ".animate-bounce")))
    except:
        # Si ça ne rebondit pas ou finit trop vite, on continue
        pass

    # Petite pause de sécurité pour le rendu final du texte
    time.sleep(1)

    # Récupérer la toute dernière bulle assistant
    all_bubbles = driver.find_elements(By.CSS_SELECTOR, "div.flex.gap-2\\.5.flex-row")
    if all_bubbles:
        last_bubble = all_bubbles[-1]
        response = last_bubble.text.strip()
        # Nettoyer si le texte contient le nom de l'assistant (ex: "Elzei IA")
        print(f" Réponse : {response[:200]}{'...' if len(response) > 200 else ''}")
        return response
    return ""


def evaluate_response(response, expected_keywords):
    """Évalue la fiabilité d'une réponse en cherchant les mots-clés attendus."""
    response_lower = response.lower()
    found = []
    missing = []

    for keyword in expected_keywords:
        if keyword.lower() in response_lower:
            found.append(keyword)
        else:
            missing.append(keyword)

    score = (len(found) / len(expected_keywords)) * 100 if expected_keywords else 0
    return score, found, missing


def get_score_emoji(score):
    if score >= 80:
        return "🌟"
    elif score >= 50:
        return "🟡"
    else:
        return "🔴"


try:
    # ═══════════════════════════════════════════════════════
    # ÉTAPE 1 : Authentification
    # ═══════════════════════════════════════════════════════
    print("=" * 60)
    print("  ÉTAPE 1 : AUTHENTIFICATION")
    print("=" * 60)
    driver.get(f"{FRONTEND_URL}/login")
    time.sleep(2)

    username_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text']"))
    )
    username_input.clear()
    username_input.send_keys(USERNAME)

    password_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
    )
    password_input.clear()
    password_input.send_keys(PASSWORD)

    login_button = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
    )
    login_button.click()

    wait.until(EC.url_changes(f"{FRONTEND_URL}/login"))
    print(f"  Connexion réussie → {driver.current_url}")
    time.sleep(2)

    # ═══════════════════════════════════════════════════════
    # ÉTAPE 2 : Ouvrir le chatbot
    # ═══════════════════════════════════════════════════════
    print("\n" + "=" * 60)
    print("  ÉTAPE 2 : OUVERTURE DU CHATBOT")
    print("=" * 60)
    chatbot_toggle = wait.until(
        EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button[aria-label='Ouvrir le chatbot IA']")
        )
    )
    chatbot_toggle.click()
    print("  Chatbot ouvert !")
    time.sleep(1)

    # ═══════════════════════════════════════════════════════
    # ÉTAPE 3 : Envoi des questions et évaluation
    # ═══════════════════════════════════════════════════════
    print("\n" + "=" * 60)
    print(f"  ÉTAPE 3 : TEST DE {len(TEST_QUESTIONS)} QUESTIONS")
    print("=" * 60)

    total_q = len(TEST_QUESTIONS)
    for idx, test in enumerate(TEST_QUESTIONS, 1):
        response = send_chatbot_message(test["question"], idx, total_q)
        score, found, missing = evaluate_response(response, test["mots_cles"])
        emoji = get_score_emoji(score)

        result = {
            "num": idx,
            "categorie": test["categorie"],
            "question": test["question"],
            "reponse": response,
            "score": round(score, 1),
            "mots_cles_trouves": found,
            "mots_cles_manquants": missing,
        }
        results.append(result)

        print(f"  {emoji} Score fiabilité : {score:.0f}%")
        if found:
            print(f"     Mots-clés trouvés : {', '.join(found)}")
        if missing:
            print(f"     Mots-clés manquants : {', '.join(missing)}")

        # Petite pause entre les questions pour ne pas surcharger l'API
        if idx < total_q:
            time.sleep(1)

    # ═══════════════════════════════════════════════════════
    # ÉTAPE 4 : Rapport de fiabilité
    # ═══════════════════════════════════════════════════════
    print("\n\n" + "═" * 60)
    print("  RAPPORT DE FIABILITÉ DU CHATBOT ELZEI IA")
    print("═" * 60)

    scores = [r["score"] for r in results]
    avg_score = sum(scores) / len(scores) if scores else 0
    max_score = max(scores) if scores else 0
    min_score = min(scores) if scores else 0
    passed = sum(1 for s in scores if s >= 50)
    excellent = sum(1 for s in scores if s >= 80)

    print(f"\n  Score moyen global    : {avg_score:.1f}%  {get_score_emoji(avg_score)}")
    print(f"  Meilleur score       : {max_score:.1f}%")
    print(f"  Plus bas score       : {min_score:.1f}%")
    print(f"  Questions réussies   : {passed}/{total_q} (≥50%)")
    print(f"  Réponses excellentes : {excellent}/{total_q} (≥80%)")

    print(f"\n  {'─'*56}")
    print(f"  {'N°':<4} {'Catégorie':<30} {'Score':<10} {'Verdict'}")
    print(f"  {'─'*56}")
    for r in results:
        emoji = get_score_emoji(r["score"])
        verdict = "Fiable" if r["score"] >= 50 else "Non fiable"
        print(f"  {r['num']:<4} {r['categorie']:<30} {r['score']:>5.1f}%    {emoji} {verdict}")
    print(f"  {'─'*56}")

    # Verdict global
    print(f"\n  {'═'*56}")
    if avg_score >= 80:
        print("  VERDICT : CHATBOT TRÈS FIABLE — Excellent !")
    elif avg_score >= 60:
        print("  VERDICT : CHATBOT FIABLE — Bonnes réponses globales")
    elif avg_score >= 40:
        print("  VERDICT : CHATBOT PARTIELLEMENT FIABLE — À améliorer")
    else:
        print("  VERDICT : CHATBOT NON FIABLE — Nécessite des corrections")
    print(f"  {'═'*56}")

    # ═══════════════════════════════════════════════════════
    # ÉTAPE 5 : Sauvegarder le rapport en JSON
    # ═══════════════════════════════════════════════════════
    rapport = {
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "score_moyen": round(avg_score, 1),
        "meilleur_score": max_score,
        "pire_score": min_score,
        "questions_reussies": f"{passed}/{total_q}",
        "reponses_excellentes": f"{excellent}/{total_q}",
        "details": results,
    }

    rapport_path = "rapport_fiabilite_chatbot.json"
    with open(rapport_path, "w", encoding="utf-8") as f:
        json.dump(rapport, f, ensure_ascii=False, indent=2)
    print(f"\n  Rapport sauvegardé : {rapport_path}")
    print("\n" + "=" * 60)
    print("  TEST COMPLET TERMINÉ !")
    print("=" * 60)

    input("\n  Appuyez sur Entrée pour fermer le navigateur...")

except Exception as e:
    print(f"\n  ERREUR : {e}")
    import traceback
    traceback.print_exc()
    input("\n  Appuyez sur Entrée pour fermer le navigateur...")

finally:
    driver.quit()
    print("  Navigateur fermé.")