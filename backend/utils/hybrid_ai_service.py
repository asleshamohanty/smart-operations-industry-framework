"""
Hybrid AI Service
Tries Llama first, falls back to Gemini if Llama fails
"""

import os
import json
import requests
from typing import Dict, List, Any

# Try to import Google Generative AI, but don't fail if it's not available
try:
    import google.generativeai as genAI
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: Google Generative AI not available. Gemini fallback disabled.")

class HybridAIService:
    def __init__(self):
        # Llama configuration (using Gemma 3:4B for better JSON generation)
        self.llama_api_url = os.getenv('LLAMA_API_URL', 'http://localhost:11434/api/generate')
        self.llama_model = os.getenv('LLAMA_MODEL', 'gemma3:4b')  # Gemma 3:4B for better instruction following
        
        # Gemini configuration
        self.gemini_api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyCc4cwD-U0-Ua07Ij-BNFen2pJ2QSzrBew')  # Updated API key
        if self.gemini_api_key and GEMINI_AVAILABLE:
            genAI.configure(api_key=self.gemini_api_key)
            self.gemini_model = genAI.GenerativeModel('gemini-2.5-flash')
        else:
            self.gemini_model = None
            if not GEMINI_AVAILABLE:
                print("⚠️ Gemini not available - install google-generativeai package")

    async def generateSimulationRecommendations(self, simulation_context: Dict[str, Any]) -> List[str]:
        """Generate AI-powered recommendations, trying Llama first, then Gemini"""
        
        print(f"Starting simulation recommendations generation...")
        print(f"Project: {simulation_context.get('project_name', 'Unknown')}")
        print(f"Weather: {simulation_context.get('weather_scenario', 'current')}")
        
        # Try Llama first
        try:
            print("Attempting to use Llama for simulation recommendations...")
            llama_result = await self._try_llama_recommendations(simulation_context)
            if llama_result and len(llama_result) > 0:
                print(f"Llama recommendations generated successfully: {len(llama_result)} recommendations")
                print(f"First recommendation: {llama_result[0][:100]}...")
                return llama_result
            else:
                print("Llama returned empty or invalid result")
        except Exception as e:
            print(f"Llama failed with error: {e}")
        
        # Fallback to Gemini
        try:
            print("Falling back to Gemini for simulation recommendations...")
            gemini_result = await self._try_gemini_recommendations(simulation_context)
            if gemini_result and len(gemini_result) > 0:
                print(f"Gemini recommendations generated successfully: {len(gemini_result)} recommendations")
                print(f"First recommendation: {gemini_result[0][:100]}...")
                return gemini_result
            else:
                print("Gemini returned empty or invalid result")
        except Exception as e:
            print(f"Gemini failed with error: {e}")
        
        # Final fallback to static recommendations
        print("Using static fallback recommendations - AI services failed")
        fallback = self._get_fallback_recommendations()
        print(f"Fallback recommendations: {len(fallback)} items")
        return fallback

    async def _try_llama_recommendations(self, simulation_context: Dict[str, Any]) -> List[str]:
        """Try to generate recommendations using Llama"""
        
        # Extract detailed weather information
        weather_data = simulation_context.get('weather_data', {})
        weather_analysis = simulation_context.get('detailed_weather_analysis', {})
        weather_risks = weather_analysis.get('weather_risks', [])
        seasonal_advice = weather_analysis.get('seasonal_considerations', [])
        
        prompt = f"""
        You are an expert construction project manager and sustainability consultant specializing in weather-aware project management. 
        Analyze the following simulation results and provide 7-10 detailed, actionable recommendations.

        Project Details:
        - Name: {simulation_context.get('project_name', 'Construction Project')}
        - Type: {simulation_context.get('project_type', 'Infrastructure')}
        - Location: {simulation_context.get('location', 'Unknown')}

        Simulation Results:
        - Original Cost: ₹{simulation_context.get('original_cost', 0):,.2f}
        - Predicted Cost: ₹{simulation_context.get('predicted_cost', 0):,.2f}
        - Cost Change: {((simulation_context.get('predicted_cost', 0) - simulation_context.get('original_cost', 0)) / simulation_context.get('original_cost', 1) * 100):.1f}%
        - Original Duration: {simulation_context.get('original_duration', 0)} days
        - Predicted Duration: {simulation_context.get('predicted_duration', 0)} days
        - Duration Change: {((simulation_context.get('predicted_duration', 0) - simulation_context.get('original_duration', 0)) / simulation_context.get('original_duration', 1) * 100):.1f}%

        Simulation Parameters:
        - Alternative Materials: {', '.join(simulation_context.get('alternative_materials', []))}
        - Resource Adjustments: {simulation_context.get('alternative_resources', {})}
        - Weather Scenario: {simulation_context.get('weather_scenario', 'current')}

        Current Weather Conditions:
        - Temperature: {weather_data.get('temperature', 'N/A')}°C
        - Humidity: {weather_data.get('humidity', 'N/A')}%
        - Wind Speed: {weather_data.get('wind_speed', 'N/A')} m/s
        - Weather Condition: {weather_data.get('weather_condition', 'N/A')}
        - Description: {weather_data.get('weather_description', 'N/A')}
        - Location: {weather_data.get('location', 'N/A')}

        Weather Impact Analysis:
        - Cost Multiplier: {simulation_context.get('weather_impact', 1.0):.2f}x
        - Duration Impact: {weather_analysis.get('impact_on_construction', {}).get('duration_impact', 'N/A')}
        - Productivity Factor: {weather_analysis.get('impact_on_construction', {}).get('productivity_factor', 1.0):.2f}

        Weather-Related Risks:
        {chr(10).join(f"- {risk}" for risk in weather_risks) if weather_risks else "- No significant weather risks identified"}

        Seasonal Considerations:
        {chr(10).join(f"- {advice}" for advice in seasonal_advice) if seasonal_advice else "- Standard seasonal planning recommended"}

        ESG Impact:
        - Environmental Score: {simulation_context.get('esg_impact', {}).get('environment', 0.7):.2f}
        - Social Score: {simulation_context.get('esg_impact', {}).get('social', 0.8):.2f}
        - Governance Score: {simulation_context.get('esg_impact', {}).get('governance', 0.75):.2f}

        Please provide 7-10 specific, actionable recommendations that address:
        1. Weather-specific cost optimization strategies
        2. Timeline adjustments based on weather conditions
        3. Weather risk mitigation measures
        4. Sustainability enhancements considering weather impact
        5. Resource efficiency improvements for current conditions
        6. Safety measures for weather-related hazards
        7. Material and equipment considerations for weather

        Focus on practical, implementable solutions that consider the current weather conditions and forecast.
        
        IMPORTANT: Return ONLY a valid JSON array of recommendation strings. Do not include any introductory text, explanations, or markdown formatting. Start your response with [ and end with ].
        
        Example format:
        ["Implement weather-resistant material storage to prevent damage during high humidity", "Schedule concrete work during optimal temperature windows to ensure proper curing", "Use prefabricated components to reduce weather exposure"]
        """

        payload = {
            "model": self.llama_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,  # Lower temperature for more consistent JSON with Gemma
                "top_p": 0.7,        # Lower for better focus with Gemma
                "max_tokens": 1500,  # More tokens for detailed recommendations
                "repeat_penalty": 1.05,  # Lower penalty for Gemma
                "stop": ["```", "Here are", "Based on", "I'll provide"]  # Stop at common prefixes
            }
        }
        
        print(f"Sending request to Llama API: {self.llama_api_url}")
        print(f"Model: {self.llama_model}")
        
        response = requests.post(self.llama_api_url, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        text = result.get('response', '').strip()
        
        print(f"Llama raw response length: {len(text)} characters")
        print(f"Llama response preview: {text[:200]}...")
        
        # Clean the response text to extract JSON
        json_text = text.strip()
        
        # Remove any introductory text before JSON
        if '[' in json_text and ']' in json_text:
            start_idx = json_text.find('[')
            end_idx = json_text.rfind(']') + 1
            json_text = json_text[start_idx:end_idx]
        
        # Remove any markdown code blocks if present
        if '```json' in json_text:
            json_text = json_text.split('```json')[1].split('```')[0].strip()
        elif '```' in json_text:
            json_text = json_text.split('```')[1].split('```')[0].strip()
        
        # Parse the JSON response from Llama
        try:
            print(f"Attempting to parse JSON from Llama response...")
            recommendations = json.loads(json_text)
            
            # Ensure we have a list of strings
            if isinstance(recommendations, list):
                print(f"Successfully parsed {len(recommendations)} recommendations from Llama")
                return recommendations[:7]  # Limit to 7 recommendations
            else:
                print(f"Llama response is not a list: {type(recommendations)}")
                raise ValueError("Response is not a list")
                
        except json.JSONDecodeError as e:
            print(f"JSON parsing failed: {e}")
            print(f"Attempting to extract recommendations from text format...")
            print(f"Raw text for extraction: {text[:500]}...")
            
            # If JSON parsing fails, try to extract recommendations from text
            lines = text.split('\n')
            recommendations = []
            
            for line in lines:
                line = line.strip()
                # Look for lines that start with quotes (JSON array items)
                if line.startswith('"') and line.endswith('",'):
                    # Remove quotes and trailing comma
                    clean_line = line[1:-2].strip()
                    if clean_line and len(clean_line) > 10:
                        recommendations.append(clean_line)
                # Also look for numbered or bulleted lists
                elif line and (line.startswith('-') or line.startswith('•') or line.startswith('1.') or line.startswith('2.')):
                    clean_line = line.lstrip('-•123456789. ').strip()
                    if clean_line and len(clean_line) > 10:
                        recommendations.append(clean_line)
            
            if recommendations:
                print(f"Extracted {len(recommendations)} recommendations from text format")
                return recommendations[:7]
            else:
                print(f"No recommendations could be extracted from text")
                return None

    async def _try_gemini_recommendations(self, simulation_context: Dict[str, Any]) -> List[str]:
        """Try to generate recommendations using Gemini"""
        
        if not self.gemini_model:
            raise Exception("Gemini API key not configured")
        
        prompt = f"""
        You are an expert construction project manager and sustainability consultant. 
        Analyze the following simulation results and provide 5-7 actionable recommendations.

        Project Details:
        - Name: {simulation_context.get('project_name', 'Construction Project')}
        - Type: {simulation_context.get('project_type', 'Infrastructure')}
        - Location: {simulation_context.get('location', 'Unknown')}

        Simulation Results:
        - Original Cost: ₹{simulation_context.get('original_cost', 0):,.2f}
        - Predicted Cost: ₹{simulation_context.get('predicted_cost', 0):,.2f}
        - Cost Change: {((simulation_context.get('predicted_cost', 0) - simulation_context.get('original_cost', 0)) / simulation_context.get('original_cost', 1) * 100):.1f}%
        - Original Duration: {simulation_context.get('original_duration', 0)} days
        - Predicted Duration: {simulation_context.get('predicted_duration', 0)} days
        - Duration Change: {((simulation_context.get('predicted_duration', 0) - simulation_context.get('original_duration', 0)) / simulation_context.get('original_duration', 1) * 100):.1f}%

        Simulation Parameters:
        - Alternative Materials: {', '.join(simulation_context.get('alternative_materials', []))}
        - Resource Adjustments: {simulation_context.get('alternative_resources', {})}
        - Weather Scenario: {simulation_context.get('weather_scenario', 'current')}

        ESG Impact:
        - Environmental Score: {simulation_context.get('esg_impact', {}).get('environment', 0.7):.2f}
        - Social Score: {simulation_context.get('esg_impact', {}).get('social', 0.8):.2f}
        - Governance Score: {simulation_context.get('esg_impact', {}).get('governance', 0.75):.2f}

        Please provide 5-7 specific, actionable recommendations that address:
        1. Cost optimization opportunities
        2. Timeline improvements
        3. Sustainability enhancements
        4. Risk mitigation strategies
        5. Resource efficiency improvements

        IMPORTANT: Return ONLY a valid JSON array of recommendation strings. Do not include any other text, explanations, or markdown formatting.
        Example: ["Implement lean construction methods to reduce waste", "Use prefabricated components to accelerate timeline"]
        """

        try:
            response = self.gemini_model.generate_content(prompt)
            text = response.text.strip()
            
            # Clean the response to extract JSON
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            # Parse JSON response
            recommendations = json.loads(text)
            
            if isinstance(recommendations, list):
                return recommendations[:7]
            else:
                raise ValueError("Gemini response is not a list")
                
        except Exception as e:
            raise Exception(f"Gemini API error: {e}")

    def _get_fallback_recommendations(self) -> List[str]:
        """Return fallback recommendations if both AI services fail"""
        return [
            "Implement lean construction methods to reduce waste and improve efficiency",
            "Use prefabricated components to accelerate construction timeline",
            "Optimize resource allocation based on weather patterns",
            "Consider sustainable materials for better ESG performance",
            "Implement digital monitoring systems for real-time project tracking"
        ]

# Create a global instance
hybrid_ai_service = HybridAIService()
