import { GoogleGenerativeAI } from '@google/generative-ai';

export interface WorkflowOptimizationRequest {
  projectId: number;
  projectName: string;
  projectType: string;
  location: string;
  budget: number;
  duration: number;
  materials: {
    steel?: number;
    wood?: number;
    concrete?: number;
    glass?: number;
    plastic?: number;
  };
  teamSize: number;
  emissionPriority: number; // 0-100 scale
  costPriority: number; // 0-100 scale
  currentEmissions?: number;
  currentCost?: number;
}

export interface WorkflowOptimizationResult {
  currentWorkflow: {
    emissions: number;
    cost: number;
    duration: number;
    description: string;
  };
  optimizedWorkflow: {
    emissions: number;
    cost: number;
    duration: number;
    description: string;
    improvements: string[];
  };
  tradeOffAnalysis: {
    emissionReduction: number; // percentage
    costIncrease: number; // percentage
    durationChange: number; // percentage
    roi: number; // return on investment
  };
  recommendations: {
    materialSubstitutions: string[];
    processOptimizations: string[];
    resourceAdjustments: string[];
    riskMitigations: string[];
  };
  implementationPlan: {
    phase1: string[];
    phase2: string[];
    phase3: string[];
    timeline: string;
  };
}

class GeminiService {
  async optimizeWorkflow(request: WorkflowOptimizationRequest): Promise<WorkflowOptimizationResult> {
    try {
      // Check if API key is configured
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBFQNwODcrprcWyKG850ZP554bZrT2fwUo';
      console.log('Gemini API Key check:', {
        hasKey: !!apiKey,
        keyLength: apiKey?.length || 0,
        keyPrefix: apiKey?.substring(0, 10) || 'none',
        envVar: import.meta.env.VITE_GEMINI_API_KEY,
        fallbackUsed: !import.meta.env.VITE_GEMINI_API_KEY
      });
      
      if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
      }

      // Initialize Gemini AI with the API key
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = this.buildOptimizationPrompt(request);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini API Response:', text.substring(0, 500) + '...');
      
      // Clean the response text to extract JSON
      let jsonText = text.trim();
      
      // Remove any markdown code blocks if present
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }
      
      // Parse the JSON response from Gemini
      try {
        const parsedResult = JSON.parse(jsonText);
        
        // Validate and provide fallbacks for missing fields
        const validatedResult: WorkflowOptimizationResult = {
          currentWorkflow: {
            emissions: parsedResult.currentWorkflow?.emissions || 2.5,
            cost: parsedResult.currentWorkflow?.cost || 4.5,
            duration: parsedResult.currentWorkflow?.duration || 30,
            description: parsedResult.currentWorkflow?.description || "Current baseline workflow"
          },
          optimizedWorkflow: {
            emissions: parsedResult.optimizedWorkflow?.emissions || 1.8,
            cost: parsedResult.optimizedWorkflow?.cost || 5.2,
            duration: parsedResult.optimizedWorkflow?.duration || 28,
            description: parsedResult.optimizedWorkflow?.description || "AI-optimized workflow",
            improvements: parsedResult.optimizedWorkflow?.improvements || [
              "Enhanced material efficiency",
              "Optimized resource allocation",
              "Improved process workflow"
            ]
          },
          tradeOffAnalysis: {
            emissionReduction: parsedResult.tradeOffAnalysis?.emissionReduction || 28.0,
            costIncrease: parsedResult.tradeOffAnalysis?.costIncrease || 15.6,
            durationChange: parsedResult.tradeOffAnalysis?.durationChange || -6.7,
            roi: parsedResult.tradeOffAnalysis?.roi || 12.5
          },
          recommendations: {
            materialSubstitutions: parsedResult.recommendations?.materialSubstitutions || [
              "Use recycled steel",
              "Sustainable concrete alternatives"
            ],
            processOptimizations: parsedResult.recommendations?.processOptimizations || [
              "Lean construction methods",
              "Just-in-time material delivery"
            ],
            resourceAdjustments: parsedResult.recommendations?.resourceAdjustments || [
              "Optimize team scheduling",
              "Equipment sharing protocols"
            ],
            riskMitigations: parsedResult.recommendations?.riskMitigations || [
              "Weather contingency plans",
              "Supply chain diversification"
            ]
          },
          implementationPlan: {
            phase1: parsedResult.implementationPlan?.phase1 || ["Initial assessment", "Team training"],
            phase2: parsedResult.implementationPlan?.phase2 || ["Process implementation", "Monitoring setup"],
            phase3: parsedResult.implementationPlan?.phase3 || ["Optimization", "Continuous improvement"],
            timeline: parsedResult.implementationPlan?.timeline || "3-month implementation plan"
          }
        };
        
        return validatedResult;
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw response:', text);
        console.error('Cleaned JSON:', jsonText);
        throw new Error('Failed to parse Gemini response as JSON. Response may not be in expected format.');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      if (error.message?.includes('404')) {
        throw new Error('Gemini model not found. Please check the model name.');
      } else if (error.message?.includes('403')) {
        throw new Error('Gemini API access denied. Please check your API key.');
      } else if (error.message?.includes('400')) {
        throw new Error('Invalid request to Gemini API. Please check the prompt format.');
      }
      throw new Error('Failed to optimize workflow with AI: ' + error.message);
    }
  }

  private buildOptimizationPrompt(request: WorkflowOptimizationRequest): string {
    return `
You are an expert AI consultant specializing in construction and infrastructure project optimization. 
Analyze the following project and provide a comprehensive workflow optimization with focus on emissions vs cost trade-offs.

Project Details:
- Name: ${request.projectName}
- Type: ${request.projectType}
- Location: ${request.location}
- Budget: ₹${request.budget.toLocaleString()}
- Duration: ${request.duration} days
- Team Size: ${request.teamSize} members
- Materials: Steel: ${request.materials.steel || 0}t, Wood: ${request.materials.wood || 0}m³, Concrete: ${request.materials.concrete || 0}m³, Glass: ${request.materials.glass || 0}m², Plastic: ${request.materials.plastic || 0}kg
- Emission Priority: ${request.emissionPriority}% (0 = cost priority, 100 = emission priority)
- Cost Priority: ${request.costPriority}% (0 = emission priority, 100 = cost priority)

IMPORTANT: You must respond with ONLY valid JSON. Do not include any explanatory text, markdown formatting, or code blocks. Just return the raw JSON object.

Please provide a detailed optimization analysis in the following JSON format:

{
  "currentWorkflow": {
    "emissions": <estimated_current_emissions_in_tons>,
    "cost": <estimated_current_cost_in_lakhs>,
    "duration": <current_duration_in_days>,
    "description": "<brief_description_of_current_approach>"
  },
  "optimizedWorkflow": {
    "emissions": <optimized_emissions_in_tons>,
    "cost": <optimized_cost_in_lakhs>,
    "duration": <optimized_duration_in_days>,
    "description": "<brief_description_of_optimized_approach>",
    "improvements": ["<improvement_1>", "<improvement_2>", "<improvement_3>"]
  },
  "tradeOffAnalysis": {
    "emissionReduction": <percentage_reduction_in_emissions>,
    "costIncrease": <percentage_increase_in_cost>,
    "durationChange": <percentage_change_in_duration>,
    "roi": <return_on_investment_percentage>
  },
  "recommendations": {
    "materialSubstitutions": ["<substitution_1>", "<substitution_2>"],
    "processOptimizations": ["<optimization_1>", "<optimization_2>"],
    "resourceAdjustments": ["<adjustment_1>", "<adjustment_2>"],
    "riskMitigations": ["<mitigation_1>", "<mitigation_2>"]
  },
  "implementationPlan": {
    "phase1": ["<phase1_task_1>", "<phase1_task_2>"],
    "phase2": ["<phase2_task_1>", "<phase2_task_2>"],
    "phase3": ["<phase3_task_1>", "<phase3_task_2>"],
    "timeline": "<overall_timeline_description>"
  }
}

Consider the following factors in your analysis:
1. Material efficiency and sustainable alternatives
2. Process optimization and automation opportunities
3. Resource allocation and team productivity
4. Weather conditions and location-specific challenges
5. Regulatory compliance and ESG requirements
6. Risk management and contingency planning
7. Technology integration opportunities
8. Supply chain optimization

Provide realistic, actionable recommendations that balance environmental impact with economic viability.
`;
  }

  async generateInsights(projectData: any): Promise<string> {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        return 'Unable to generate insights. Gemini API key not configured.';
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
Analyze this infrastructure project and provide key insights for optimization:

Project: ${projectData.project_name}
Location: ${projectData.location}
Budget: ₹${projectData.project_budget}
Type: ${projectData.project_type}

Provide 3-5 key insights for improving this project's efficiency, sustainability, and cost-effectiveness.
Format as a concise bullet-point list.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating insights:', error);
      return 'Unable to generate insights at this time.';
    }
  }
}

export const geminiService = new GeminiService();
