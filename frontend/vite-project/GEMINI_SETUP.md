# Gemini AI Integration Setup

This project now includes AI-powered workflow optimization using Google's Gemini LLM. Follow these steps to set it up:

## 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## 2. Configure Environment Variables

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Gemini API key:

   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   VITE_API_BASE_URL=http://localhost:8000

   # Optional: Supabase Configuration
   # Only needed if you want to use authentication features
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

**Note**: Supabase is optional. The app will work without it, but authentication features will be disabled.

## 3. Features

The AI Workflow Optimizer now provides:

### Dynamic Analysis

- **Real-time optimization** based on your project data
- **Intelligent recommendations** for material substitutions
- **Process optimizations** tailored to your project type
- **Cost vs emission trade-off analysis**

### Interactive Controls

- **Emission Priority Slider**: Adjust from 0% (cost priority) to 100% (emission priority)
- **Live Updates**: Optimization recalculates as you change priorities
- **Detailed Breakdown**: See specific improvements and recommendations

### AI-Powered Insights

- **Material Substitutions**: Sustainable alternatives for your materials
- **Process Optimizations**: Workflow improvements for efficiency
- **Resource Adjustments**: Team and equipment optimization suggestions
- **Risk Mitigations**: Proactive risk management strategies

## 4. How It Works

1. **Project Analysis**: Gemini analyzes your project details (budget, materials, location, etc.)
2. **Optimization**: AI generates optimized workflow based on your emission priority setting
3. **Recommendations**: Provides specific, actionable improvements
4. **Trade-off Analysis**: Shows cost vs emission impact with percentages

## 5. Example Output

The AI will provide:

- Current vs optimized emissions and costs
- Percentage improvements in emissions and cost impact
- Specific material substitution recommendations
- Process optimization suggestions
- Implementation timeline and phases

## 6. Troubleshooting

If you see "Failed to optimize workflow" error:

1. Check your API key is correctly set in `.env`
2. Ensure your Gemini API key is valid and has quota remaining
3. Check browser console for detailed error messages

## 7. API Usage

The Gemini service is designed to be cost-effective:

- Uses `gemini-1.5-flash` model for fast responses
- Optimized prompts for construction/infrastructure projects
- Structured JSON responses for reliable parsing
- Error handling for API failures

Enjoy your AI-powered project optimization! 🚀
