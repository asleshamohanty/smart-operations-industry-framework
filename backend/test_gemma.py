#!/usr/bin/env python3
"""Test Gemma 3:4B model for JSON generation"""

import requests
import json

def test_gemma():
    payload = {
        "model": "gemma3:4b",
        "prompt": "Return only this JSON array: [\"test1\", \"test2\", \"test3\"]",
        "stream": False,
        "options": {
            "temperature": 0.2,
            "max_tokens": 100
        }
    }
    
    try:
        response = requests.post('http://localhost:11434/api/generate', json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        print("Gemma response:")
        print(result.get('response', 'No response'))
        print("\nRaw response length:", len(result.get('response', '')))
        
        # Test JSON parsing
        text = result.get('response', '').strip()
        if '[' in text and ']' in text:
            start_idx = text.find('[')
            end_idx = text.rfind(']') + 1
            json_text = text[start_idx:end_idx]
            try:
                parsed = json.loads(json_text)
                print("JSON parsing successful:", parsed)
            except json.JSONDecodeError as e:
                print("JSON parsing failed:", e)
                print("JSON text:", json_text)
        
    except Exception as e:
        print(f"Error testing Gemma: {e}")

if __name__ == "__main__":
    test_gemma()
