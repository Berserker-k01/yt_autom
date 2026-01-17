import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load env vars
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

api_key = os.getenv("GEMINI_API_KEY")
print(f"🔑 Testing API Key: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

if not api_key:
    print("❌ No API Key found!")
    exit(1)

genai.configure(api_key=api_key)

try:
    print("🤖 Listing models...")
    models = list(genai.list_models())
    flash_model = next((m for m in models if 'gemini-1.5-flash' in m.name), None)
    
    if flash_model:
        print(f"✅ Found model: {flash_model.name}")
    else:
        print("⚠️ Gemini 1.5 Flash model not found in list!")
        
    print("📝 Testing generation...")
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello")
    print(f"✅ Generation successful: {response.text}")

except Exception as e:
    print(f"❌ Error: {e}")
