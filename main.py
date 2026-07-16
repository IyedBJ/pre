from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

service = Service(executable_path="chromedriver.exe")
driver = webdriver.Chrome(service=service)

wait = WebDriverWait(driver, 10)

driver.get("https://www.wikipedia.org")

# Recherche
search_box = wait.until(EC.presence_of_element_located((By.ID, "searchInput")))
search_box.send_keys("Python programming")
search_box.send_keys(Keys.RETURN)

# Cliquer sur le bon lien
link = wait.until(EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, "Python (programming language)")))
link.click()

# Récupérer tous les paragraphes
paragraphs = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "p")))

# Trouver le premier paragraphe NON VIDE
for p in paragraphs:
    if p.text.strip() != "":
        print("\n📄 Premier vrai paragraphe :\n")
        print(p.text)
        break

driver.quit()