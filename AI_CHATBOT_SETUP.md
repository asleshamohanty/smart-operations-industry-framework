# AI Chat Service Configuration

## Local Ollama Setup (Recommended)

The chatbot is now configured to use your local Llama 3.2 model via Ollama, which is much more reliable and doesn't require external API keys.

### Prerequisites:

1. **Ollama installed** and running locally
2. **Llama 3.2 model** installed (`llama3.2:latest`)

### Setup Steps:

1. **Install Ollama** (if not already installed):

   ```bash
   # Download from https://ollama.ai/
   # Or use package manager:
   # Windows: winget install Ollama.Ollama
   # macOS: brew install ollama
   # Linux: curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Install Llama 3.2 model**:

   ```bash
   # Install Llama 3.2 (latest version):
   ollama pull llama3.2:latest

   # Check installed models:
   ollama list
   ```

3. **Start Ollama service**:

   ```bash
   ollama serve
   ```

4. **Verify it's working**:
   ```bash
   # Test the model
   ollama run llama3.2:latest "Hello, how are you?"
   ```

### Fallback Configuration (Optional):

If you want Gemini as a fallback, you can configure it:

1. **Get Gemini API Key**:
   - Go to https://makersuite.google.com/app/apikey
   - Create a new API key
   - Replace the Gemini API key in `ai-chat-service.ts`

### How It Works:

- **Primary**: Local Llama 3.2 via Ollama (http://localhost:11434)
- **Fallback**: Gemini API (if configured)
- **No API Keys Required**: For local Llama (free!)
- **Better Performance**: No network latency, no rate limits
- **Privacy**: All data stays on your local machine

### Troubleshooting:

1. **Ollama not running**: Make sure `ollama serve` is running
2. **Model not found**: Check `ollama list` and verify `llama3.2:latest` is installed
3. **Port issues**: Default is 11434, change `ollamaBaseUrl` if different
4. **Memory issues**: Llama 3.2 requires ~2GB RAM, make sure you have enough
5. **CORS issues**: Ollama should allow localhost requests by default

### Features:

- Project context-aware responses
- Quick prompt suggestions
- Material and cost analysis
- Weather impact insights
- Automatic fallback between AI models
- Local processing (no internet required for Llama)

### Current Status:

✅ Ollama is running on localhost:11434
✅ Llama 3.2:latest model is installed and working
✅ Chatbot configured to use local Llama 3.2
✅ Gemini fallback available (if API key configured)
