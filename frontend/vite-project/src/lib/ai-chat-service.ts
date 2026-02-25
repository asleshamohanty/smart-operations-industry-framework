interface AIResponse {
  content: string;
  model: 'llama3' | 'gemini';
  success: boolean;
  error?: string;
}

interface ProjectContext {
  project_id: number;
  project_name: string;
  location: string;
  project_budget: number;
  currency: string;
  project_type?: string;
  description?: string;
  materials: Array<{
    name: string;
    quantity: number;
    unit: string;
    import_location: string;
  }>;
  weather_data?: any;
  progress?: number;
}

class AIChatService {
  private geminiApiKey: string;
  private ollamaBaseUrl: string;

  constructor() {
    // Using environment variables or hardcoded keys for now
    this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQ';
    this.ollamaBaseUrl = 'http://localhost:11434'; // Local Ollama instance
  }

  async generateResponse(
    message: string,
    projectContext: ProjectContext | null,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(projectContext);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user' as const, content: message }
    ];

    // Try local Llama 3.2 first
    try {
      const llamaResponse = await this.callLocalLlama(messages);
      return {
        content: llamaResponse,
        model: 'llama3',
        success: true
      };
    } catch (error) {
      console.warn('Local Llama 3.2 failed, falling back to Gemini:', error);
      
      // Fallback to Gemini
      try {
        const geminiResponse = await this.callGemini(messages);
        return {
          content: geminiResponse,
          model: 'gemini',
          success: true
        };
      } catch (geminiError) {
        console.error('Both AI models failed:', geminiError);
        return {
          content: 'I apologize, but I\'m having trouble connecting to the AI services right now. Please try again later.',
          model: 'gemini',
          success: false,
          error: geminiError instanceof Error ? geminiError.message : 'Unknown error'
        };
      }
    }
  }

  private buildSystemPrompt(projectContext: ProjectContext | null): string {
    if (!projectContext) {
      console.log('No project context provided to AI');
      return `You are a helpful construction project assistant. You can help users with project management, material planning, cost analysis, and general construction advice. Be concise, professional, and helpful.`;
    }

    console.log('Building system prompt with project context:', projectContext);

    return `You are a specialized construction project assistant for "${projectContext.project_name}".

PROJECT CONTEXT:
- Project Name: ${projectContext.project_name}
- Location: ${projectContext.location}
- Budget: ${projectContext.currency} ${projectContext.project_budget?.toLocaleString() || 'Not specified'}
- Project Type: ${projectContext.project_type || 'Not specified'}
- Description: ${projectContext.description || 'Not specified'}
- Progress: ${projectContext.progress || 0}%

MATERIALS:
${projectContext.materials.map(m => `- **${m.name}**: ${m.quantity} ${m.unit} (from ${m.import_location})`).join('\n')}

WEATHER DATA:
${projectContext.weather_data ? JSON.stringify(projectContext.weather_data, null, 2) : 'No weather data available'}

INSTRUCTIONS:
- **Always reference specific project details** when answering questions
- **Use proper markdown formatting** (bold for emphasis, bullet points for lists)
- **Provide actionable advice** based on this project's materials and budget
- **Suggest optimizations** and cost savings specific to this project
- **Consider weather impacts** on materials and timeline
- **Be specific** about quantities, costs, and locations mentioned in the project

**Important:** Always format your responses with proper markdown. Use **bold** for emphasis, bullet points for lists, and clear headings. Reference the actual project materials and budget when relevant.`;
  }

  private async callLocalLlama(messages: Array<{ role: string; content: string }>): Promise<string> {
    // Convert OpenAI format to Ollama format
    const prompt = messages.map(msg => {
      if (msg.role === 'system') {
        return `System: ${msg.content}`;
      } else if (msg.role === 'user') {
        return `Human: ${msg.content}`;
      } else {
        return `Assistant: ${msg.content}`;
      }
    }).join('\n\n') + '\n\nAssistant:';

    const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:latest', // Using your installed Llama 3.2 model
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1000,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || 'No response generated';
  }

  private async callGemini(messages: Array<{ role: string; content: string }>): Promise<string> {
    // Check if we have a valid API key
    if (!this.geminiApiKey || this.geminiApiKey === 'AIzaSyBvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQ') {
      throw new Error('Gemini API key not configured');
    }

    // Convert OpenAI format to Gemini format
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';

    const prompt = `${systemMessage}\n\nUser: ${lastUserMessage}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
  }

  // Quick prompt suggestions based on project context
  getQuickPrompts(projectContext: ProjectContext | null): string[] {
    if (!projectContext) {
      return [
        'What are the key project management best practices?',
        'How can I optimize material costs?',
        'What should I consider for weather planning?',
        'How do I track project progress effectively?'
      ];
    }

    return [
      `Summarize the ${projectContext.project_name} project`,
      `List all materials for this project`,
      `What are the cost risks for this project?`,
      `How is weather affecting this project?`,
      `Suggest ways to optimize the budget`,
      `What materials are most expensive?`,
      `Are there any supply chain risks?`,
      `How can I improve project efficiency?`
    ];
  }
}

export const aiChatService = new AIChatService();
export type { AIResponse, ProjectContext };
