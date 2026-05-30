import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import os
# C’est un décorateur qui transforme la fonction driver en une ressource réutilisable dans les tests / scope="module" signifie que le même driver sera utilisé pour tous les tests du module, et sera fermé à la fin du module.
@pytest.fixture(scope="module")
def driver():
    # Path to chromedriver.exe relative to root
    service = Service(executable_path="chromedriver.exe")
    
    # Options for better stability
    chrome_options = Options()
    # chrome_options.add_argument("--headless") # Uncomment to run without browser window
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.implicitly_wait(10)
    driver.maximize_window()
    
    yield driver
    
    driver.quit()
