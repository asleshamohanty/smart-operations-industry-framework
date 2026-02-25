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
  };
  confidence: number;
  timestamp: string;
}

class HybridAIService {
  private geminiModel: any = null;
  private llamaApiUrl: string;

  constructor() {
    this.llamaApiUrl = 'http://localhost:11434/api/generate';
    this.initializeGemini();
  }

  private initializeGemini() {
    // Hardcoded API key for testing (updated)
    const apiKey = 'AIzaSyCc4cwD-U0-Ua07Ij-BNFen2pJ2QSzrBew';
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      console.log('✅ Gemini initialized successfully with hardcoded key');
    } catch (error) {
      console.warn('⚠️ Failed to initialize Gemini:', error);
      this.geminiModel = null;
    }
  }

  async optimizeWorkflow(request: WorkflowOptimizationRequest): Promise<WorkflowOptimizationResult> {
    console.log('🤖 Starting workflow optimization with hybrid AI...');
    
    // Try Llama first
    try {
      console.log('🦙 Attempting to use Llama for workflow optimization...');
      const llamaResult = await this.tryLlamaOptimization(request);
      if (llamaResult) {
        console.log('✅ Llama optimization completed successfully');
        return llamaResult;
      }
    } catch (error) {
      console.warn('❌ Llama failed:', error);
    }

    // Fallback to Gemini
    try {
      console.log('🔮 Falling back to Gemini for workflow optimization...');
      const geminiResult = await this.tryGeminiOptimization(request);
      if (geminiResult) {
        console.log('✅ Gemini optimization completed successfully');
        return geminiResult;
      }
    } catch (error) {
      console.warn('❌ Gemini failed:', error);
    }

    // Final fallback to static result
    console.log('📋 Using static fallback optimization');
    return this.getFallbackOptimization(request);
  }

  private async tryLlamaOptimization(request: WorkflowOptimizationRequest): Promise<WorkflowOptimizationResult | null> {
    const prompt = this.buildOptimizationPrompt(request);

    try {
      const response = await fetch(this.llamaApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,  // Lower temperature for more consistent JSON
            top_p: 0.8,       // More focused responses
            max_tokens: 2000,  // More tokens for complete response
            repeat_penalty: 1.1, // Avoid repetition
            stop: ['```', '---'] // Stop at code blocks
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Llama API error: ${response.status}`);
      }

      const responseData = await response.json();
      const text = responseData.response?.trim();

      if (!text) {
        throw new Error('Empty response from Llama');
      }

      console.log('🦙 Llama raw response:', text);

      // Clean and parse JSON response
      let jsonText = text;
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }

      console.log('🦙 Llama cleaned JSON:', jsonText);

      const result = JSON.parse(jsonText);
      console.log('🦙 Llama parsed result:', result);
      
      // Check if the result has good quality data
      if (this.isLowQualityResult(result)) {
        console.warn('⚠️ Llama returned low quality data, falling back to Gemini');
        throw new Error('Low quality Llama response');
      }
      
      return this.validateOptimizationResult(result);
    } catch (error) {
      throw new Error(`Llama optimization failed: ${error}`);
    }
  }

  private async tryGeminiOptimization(request: WorkflowOptimizationRequest): Promise<WorkflowOptimizationResult | null> {
    if (!this.geminiModel) {
      throw new Error('Gemini not initialized');
    }

    const prompt = this.buildOptimizationPrompt(request);

    try {
      const result = await this.geminiModel.generateContent(prompt);
      const text = result.response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      console.log('🔮 Gemini raw response:', text);

      // Clean and parse JSON response
      let jsonText = text.trim();
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }

      console.log('🔮 Gemini cleaned JSON:', jsonText);

      const parsedResult = JSON.parse(jsonText);
      console.log('🔮 Gemini parsed result:', parsedResult);
      
      return this.validateOptimizationResult(parsedResult);
    } catch (error) {
      throw new Error(`Gemini optimization failed: ${error}`);
    }
  }

  private buildOptimizationPrompt(request: WorkflowOptimizationRequest): string {
    return `You are a construction expert. Analyze this project and return ONLY valid JSON.

Project: ${request.projectName} (${request.projectType})
Location: ${request.location}
Budget: ₹${request.budget.toLocaleString()}
Duration: ${request.duration} days
Team: ${request.teamSize} people
Emission Priority: ${request.emissionPriority}%
Cost Priority: ${request.costPriority}%

Return this exact JSON structure:

{
  "currentWorkflow": {
    "emissions": ${request.currentEmissions || 15000},
    "cost": ${request.currentCost || request.budget},
    "duration": ${request.duration},
    "description": "Current ${request.projectType} workflow"
  },
  "optimizedWorkflow": {
    "emissions": ${Math.round((request.currentEmissions || 15000) * (1 - request.emissionPriority / 200))},
    "cost": ${Math.round((request.currentCost || request.budget) * (1 + (100 - request.costPriority) / 200))},
    "duration": ${Math.round(request.duration * (1 - request.costPriority / 200))},
    "description": "Optimized ${request.projectType} workflow with ${request.emissionPriority}% emission priority and ${request.costPriority}% cost priority",
    "improvements": [
      "Reduce waste by ${Math.round(request.emissionPriority / 6)}% through lean construction",
      "Use prefabricated components for ${Math.round(request.costPriority / 8)}% faster completion",
      "Optimize resource allocation for better efficiency",
      "Implement digital project management tools"
    ]
  },
  "tradeOffAnalysis": {
    "emissionReduction": ${Math.round(request.emissionPriority / 6)},
    "costIncrease": ${Math.round((100 - request.costPriority) / 10)},
    "durationChange": -${Math.round(request.costPriority / 8)},
    "roi": ${Math.round((request.emissionPriority + request.costPriority) / 8)}
  },
  "recommendations": {
    "materialSubstitutions": [
      "Use recycled steel for ${Math.round(request.costPriority / 5)}% cost savings",
      "Replace concrete with sustainable alternatives",
      "Implement low-carbon material options"
    ],
    "processOptimizations": [
      "Adopt prefabricated construction methods",
      "Implement just-in-time material delivery",
      "Use BIM for better coordination"
    ],
    "resourceAdjustments": [
      "Optimize crew scheduling for efficiency",
      "Implement equipment sharing programs",
      "Use local suppliers to reduce transport"
    ],
    "riskMitigations": [
      "Develop weather contingency plans",
      "Establish backup supplier relationships",
      "Implement quality control checkpoints"
    ]
  },
  "implementationPlan": {
    "phase1": [
      "Analyze current workflow and identify bottlenecks",
      "Assess material usage and waste generation",
      "Develop optimization roadmap"
    ],
    "phase2": [
      "Begin material substitution program",
      "Implement process optimizations",
      "Train team on new procedures"
    ],
    "phase3": [
      "Monitor performance metrics",
      "Scale successful optimizations",
      "Document lessons learned"
    ]
  },
  "confidence": 85,
  "timestamp": "${new Date().toISOString()}"
}

IMPORTANT: Return ONLY the JSON above. No other text.`;
  }

  private isLowQualityResult(result: any): boolean {
    // Check if the result has the basic structure
    if (!result || typeof result !== 'object') {
      return true;
    }
    
    // Check if required fields exist and have reasonable values
    const hasCurrentWorkflow = result.currentWorkflow && 
      typeof result.currentWorkflow.emissions === 'number' &&
      typeof result.currentWorkflow.cost === 'number' &&
      typeof result.currentWorkflow.duration === 'number';
    
    const hasOptimizedWorkflow = result.optimizedWorkflow && 
      typeof result.optimizedWorkflow.emissions === 'number' &&
      typeof result.optimizedWorkflow.cost === 'number' &&
      typeof result.optimizedWorkflow.duration === 'number' &&
      Array.isArray(result.optimizedWorkflow.improvements);
    
    const hasRecommendations = result.recommendations &&
      Array.isArray(result.recommendations.materialSubstitutions) &&
      Array.isArray(result.recommendations.processOptimizations);
    
    // Check for reasonable values (not all zeros or unrealistic numbers)
    const hasReasonableValues = result.currentWorkflow?.emissions > 0 &&
      result.currentWorkflow?.cost > 0 &&
      result.currentWorkflow?.duration > 0 &&
      result.optimizedWorkflow?.emissions > 0 &&
      result.optimizedWorkflow?.cost > 0 &&
      result.optimizedWorkflow?.duration > 0;
    
    // Check for generic placeholder content
    const hasGenericContent = this.containsGenericPlaceholders(result);
    
    const isLowQuality = !hasCurrentWorkflow || !hasOptimizedWorkflow || !hasRecommendations || !hasReasonableValues || hasGenericContent;
    
    if (isLowQuality) {
      console.log('🔍 Quality check failed:', {
        hasCurrentWorkflow,
        hasOptimizedWorkflow,
        hasRecommendations,
        hasReasonableValues,
        hasGenericContent,
        result
      });
    }
    
    return isLowQuality;
  }

  private containsGenericPlaceholders(result: any): boolean {
    // Check for generic placeholder text
    const genericPatterns = [
      'Substitution 1', 'Substitution 2',
      'Optimization 1', 'Optimization 2',
      'Adjustment 1', 'Adjustment 2',
      'Mitigation 1', 'Mitigation 2',
      'Phase 1 task 1', 'Phase 1 task 2',
      'Phase 2 task 1', 'Phase 2 task 2',
      'Phase 3 task 1', 'Phase 3 task 2',
      'Improvement 1', 'Improvement 2', 'Improvement 3',
      'Current workflow description',
      'Optimized workflow description'
    ];
    
    const resultString = JSON.stringify(result).toLowerCase();
    
    for (const pattern of genericPatterns) {
      if (resultString.includes(pattern.toLowerCase())) {
        console.log(`🚨 Found generic placeholder: "${pattern}"`);
        return true;
      }
    }
    
    return false;
  }

  private validateOptimizationResult(result: any): WorkflowOptimizationResult {
    console.log('🔍 Validating optimization result:', result);
    
    // Ensure all required fields exist with fallbacks
    const validated = {
      currentWorkflow: {
        emissions: result.currentWorkflow?.emissions || 15000,
        cost: result.currentWorkflow?.cost || 2500000,
        duration: result.currentWorkflow?.duration || 120,
        description: result.currentWorkflow?.description || 'Current workflow analysis'
      },
      optimizedWorkflow: {
        emissions: result.optimizedWorkflow?.emissions || 12000,
        cost: result.optimizedWorkflow?.cost || 2600000,
        duration: result.optimizedWorkflow?.duration || 110,
        description: result.optimizedWorkflow?.description || 'Optimized workflow analysis',
        improvements: Array.isArray(result.optimizedWorkflow?.improvements) 
          ? result.optimizedWorkflow.improvements 
          : ['Improved efficiency', 'Reduced waste', 'Better resource utilization']
      },
      tradeOffAnalysis: {
        emissionReduction: result.tradeOffAnalysis?.emissionReduction || 20,
        costIncrease: result.tradeOffAnalysis?.costIncrease || 4,
        durationChange: result.tradeOffAnalysis?.durationChange || -8,
        roi: result.tradeOffAnalysis?.roi || 15
      },
      recommendations: {
        materialSubstitutions: Array.isArray(result.recommendations?.materialSubstitutions)
          ? result.recommendations.materialSubstitutions
          : ['Use recycled steel', 'Consider bamboo alternatives'],
        processOptimizations: Array.isArray(result.recommendations?.processOptimizations)
          ? result.recommendations.processOptimizations
          : ['Implement lean construction', 'Use prefabricated components'],
        resourceAdjustments: Array.isArray(result.recommendations?.resourceAdjustments)
          ? result.recommendations.resourceAdjustments
          : ['Optimize crew scheduling', 'Improve equipment utilization'],
        riskMitigations: Array.isArray(result.recommendations?.riskMitigations)
          ? result.recommendations.riskMitigations
          : ['Weather contingency plans', 'Supply chain backups']
      },
      implementationPlan: {
        phase1: Array.isArray(result.implementationPlan?.phase1)
          ? result.implementationPlan.phase1
          : ['Assess current processes', 'Identify optimization opportunities'],
        phase2: Array.isArray(result.implementationPlan?.phase2)
          ? result.implementationPlan.phase2
          : ['Implement material substitutions', 'Optimize resource allocation'],
        phase3: Array.isArray(result.implementationPlan?.phase3)
          ? result.implementationPlan.phase3
          : ['Monitor performance', 'Fine-tune processes']
      },
      confidence: result.confidence || 75,
      timestamp: result.timestamp || new Date().toISOString()
    };
    
    console.log('✅ Validated result:', validated);
    return validated;
  }

  private getFallbackOptimization(request: WorkflowOptimizationRequest): WorkflowOptimizationResult {
    return {
      currentWorkflow: {
        emissions: request.currentEmissions || 15000,
        cost: request.currentCost || request.budget,
        duration: request.duration,
        description: `Current ${request.projectType} workflow for ${request.projectName} in ${request.location}`
      },
      optimizedWorkflow: {
        emissions: Math.round((request.currentEmissions || 15000) * 0.85),
        cost: Math.round((request.currentCost || request.budget) * 1.05),
        duration: Math.round(request.duration * 0.95),
        description: `Optimized ${request.projectType} workflow with improved efficiency and sustainability`,
        improvements: [
          `Implement lean construction methodologies to reduce waste by 15% for ${request.projectName}`,
          `Use prefabricated components to accelerate ${request.projectType} timeline by 10%`,
          `Optimize resource allocation based on ${request.location} weather patterns`,
          `Implement digital project management for better team coordination`
        ]
      },
      tradeOffAnalysis: {
        emissionReduction: 15,
        costIncrease: 5,
        durationChange: -5,
        roi: 12
      },
      recommendations: {
        materialSubstitutions: [
          `Replace traditional steel with recycled steel for ${request.projectType} (20% cost reduction)`,
          `Use bamboo or engineered wood for non-structural elements in ${request.location}`,
          `Implement low-carbon concrete mixes with fly ash for sustainability`
        ],
        processOptimizations: [
          `Adopt prefabricated construction methods for faster ${request.projectType} assembly`,
          `Implement just-in-time material delivery to reduce storage costs`,
          `Use Building Information Modeling (BIM) for better ${request.projectName} coordination`
        ],
        resourceAdjustments: [
          `Optimize crew scheduling to reduce overtime costs for ${request.teamSize} person team`,
          `Implement equipment sharing programs with other projects in ${request.location}`,
          `Use local suppliers to reduce transportation emissions`
        ],
        riskMitigations: [
          `Develop weather contingency plans for outdoor work in ${request.location}`,
          `Establish backup supplier relationships for critical ${request.projectType} materials`,
          `Implement quality control checkpoints to prevent rework`
        ]
      },
      implementationPlan: {
        phase1: [
          `Conduct detailed workflow analysis for ${request.projectName}`,
          `Assess current material usage and waste generation`,
          `Develop optimization roadmap with specific targets`
        ],
        phase2: [
          `Begin material substitution program with pilot testing`,
          `Implement process optimizations in high-impact areas`,
          `Train ${request.teamSize} person team on new procedures`
        ],
        phase3: [
          `Monitor performance metrics and adjust strategies`,
          `Scale successful optimizations across entire ${request.projectType} project`,
          `Document lessons learned for future projects`
        ]
      },
      confidence: 70,
      timestamp: new Date().toISOString()
    };
  }
}

export const hybridAIService = new HybridAIService();
