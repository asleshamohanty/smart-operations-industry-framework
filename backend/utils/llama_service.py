import os
import json
from typing import Dict, List, Any
import requests

class LlamaService:
    def __init__(self):
        # Configure local Llama API endpoint
        self.api_url = os.getenv('LLAMA_API_URL', 'http://localhost:11434/api/generate')
        self.model_name = os.getenv('LLAMA_MODEL', 'llama3.2')
    
    async def generateSimulationRecommendations(self, simulation_context: Dict[str, Any]) -> List[str]:
        """Generate AI-powered recommendations for simulation results using local Llama"""
        
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

        Format your response as a JSON array of recommendation strings.
        Example: ["Implement lean construction methods to reduce waste", "Use prefabricated components to accelerate timeline"]
        """

        try:
            # Call local Llama API (assuming Ollama format)
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 1000
                }
            }
            
            response = requests.post(self.api_url, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            text = result.get('response', '').strip()
            
            # Clean the response text to extract JSON
            json_text = text.strip()
            
            # Remove any markdown code blocks if present
            if '```json' in json_text:
                json_text = json_text.split('```json')[1].split('```')[0].strip()
            elif '```' in json_text:
                json_text = json_text.split('```')[1].split('```')[0].strip()
            
            # Parse the JSON response from Llama
            try:
                recommendations = json.loads(json_text)
                
                # Ensure we have a list of strings
                if isinstance(recommendations, list):
                    return recommendations[:7]  # Limit to 7 recommendations
                else:
                    raise ValueError("Response is not a list")
                    
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract recommendations from text
                lines = text.split('\n')
                recommendations = []
                for line in lines:
                    line = line.strip()
                    if line and (line.startswith('-') or line.startswith('•') or line.startswith('1.') or line.startswith('2.')):
                        # Clean up the line
                        clean_line = line.lstrip('-•123456789. ').strip()
                        if clean_line and len(clean_line) > 10:  # Only add substantial recommendations
                            recommendations.append(clean_line)
                
                return recommendations[:7] if recommendations else self._get_fallback_recommendations()
                
        except Exception as e:
            print(f"Error generating Llama recommendations: {e}")
            return self._get_fallback_recommendations()
    
    def _get_fallback_recommendations(self) -> List[str]:
        """Return fallback recommendations if Llama API fails"""
        return [
            "Implement lean construction methods to reduce waste and improve efficiency",
            "Use prefabricated components to accelerate construction timeline",
            "Optimize resource allocation based on weather patterns",
            "Consider sustainable materials for better ESG performance",
            "Implement digital monitoring systems for real-time project tracking"
        ]

# Keep the old GeminiService class for backward compatibility, but alias it to LlamaService
class GeminiService(LlamaService):
    """Backward compatibility alias - now uses Llama instead of Gemini"""
    pass
