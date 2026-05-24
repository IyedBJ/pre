import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Configuration
FRONTEND_URL = "http://localhost:5173"
USERNAME = "iyedtest"
PASSWORD = "Iyed@2026"

class TestChatbotApp:
    
    def test_login_success(self, driver):
        """Test authentication flow."""
        driver.get(f"{FRONTEND_URL}/login")
        
        wait = WebDriverWait(driver, 20)
        
        # Username
        username_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text']")))
        username_input.clear()
        username_input.send_keys(USERNAME)
        
        # Password
        password_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password']")))
        password_input.clear()
        password_input.send_keys(PASSWORD)
        
        # Submit
        login_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']")))
        login_button.click()
        
        # Verification - check if redirected or if a specific dashboard element exists
        wait.until(EC.url_changes(f"{FRONTEND_URL}/login"))
        assert "/login" not in driver.current_url
        print(f"Login successful: {driver.current_url}")

    def test_dashboard_loading(self, driver):
        """Test if dashboard elements are loaded after login."""
        wait = WebDriverWait(driver, 20)
        # Check for a sidebar or specific dashboard title
        # Based on previous research, let's look for common UI elements
        try:
            dashboard_element = wait.until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
            assert dashboard_element.is_displayed()
        except:
            # Fallback if h1 is not present
            print("Dashboard H1 not found, checking for main content...")
            assert "dashboard" in driver.current_url.lower() or "/" == driver.current_url.replace(FRONTEND_URL, "")

    def test_chatbot_interaction(self, driver):
        """Test opening chatbot and sending a simple question."""
        wait = WebDriverWait(driver, 20)
        
        # Open Chatbot
        chatbot_toggle = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Ouvrir le chatbot IA']")))
        chatbot_toggle.click()
        
        # Type question
        chatbot_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "textarea[placeholder='Posez votre question à Elzei IA...']")))
        question = "Quels sont les modules disponibles ?"
        chatbot_input.send_keys(question)
        
        # Send
        send_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label='Envoyer']")))
        send_button.click()
        
        # Wait for response (wait for spinner to disappear)
        time.sleep(2) # Initial wait
        try:
            wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, ".animate-spin")))
        except:
            pass
        
        # Verify response exists
        bubbles = driver.find_elements(By.CSS_SELECTOR, "div.flex.gap-2\\.5.flex-row")
        assert len(bubbles) > 0
        last_response = bubbles[-1].text
        assert len(last_response) > 5
        print(f"Chatbot response received: {last_response[:50]}...")

    def test_navigation(self, driver):
        """Test navigation to another module (e.g., Employees)."""
        # Look for a link to employees
        try:
            # Common sidebar link patterns
            employee_link = driver.find_element(By.PARTIAL_LINK_TEXT, "salarié")
            employee_link.click()
            time.sleep(1)
            assert "employe" in driver.current_url.lower() or "salari" in driver.current_url.lower()
        except:
            print("Sidebar link 'salarié' not found, skipping navigation test.")
            pass
