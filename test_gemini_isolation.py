
import os
import sys
import google.generativeai as genai

print("--- Gemini Isolation Test ---")
key = os.getenv('GEMINI_API_KEY')
if not key:
    print("FATAL: GEMINI_API_KEY is NOT set in environment.")
    sys.exit(1)

print(f"Key found: {key[:5]}...{key[-5:]}")

try:
    genai.configure(api_key=key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("Attempting generation...")
    response = model.generate_content("Reply with 'SUCCESS' if you read this.")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"ERROR: {e}")
