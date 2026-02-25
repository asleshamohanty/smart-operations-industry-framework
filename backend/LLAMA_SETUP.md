# 🦙 Local Llama Setup Guide

This guide will help you set up a local Llama model to replace Gemini for AI-powered recommendations in the simulation system.

## Prerequisites

- Python 3.8+
- At least 8GB RAM (16GB+ recommended)
- GPU with CUDA support (optional but recommended)

## Option 1: Using Ollama (Recommended)

Ollama is the easiest way to run Llama models locally.

### Installation

**Windows:**

```bash
# Download and install from https://ollama.ai/download
# Or use winget
winget install Ollama.Ollama
```

**macOS:**

```bash
brew install ollama
```

**Linux:**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Running Llama

1. **Start Ollama service:**

   ```bash
   ollama serve
   ```

2. **Pull a Llama model:**

   ```bash
   # Llama 3.2 (recommended - good balance of performance and size)
   ollama pull llama3.2

   # Or Llama 3.1 (larger, more capable)
   ollama pull llama3.1

   # Or Llama 2 (smaller, faster)
   ollama pull llama2
   ```

3. **Test the model:**
   ```bash
   ollama run llama3.2 "Hello, how are you?"
   ```

## Option 2: Using LM Studio

LM Studio provides a GUI for running local models.

1. **Download LM Studio:** https://lmstudio.ai/
2. **Install and open LM Studio**
3. **Download a Llama model** (Llama 3.2 recommended)
4. **Start local server** on port 11434

## Option 3: Using llama.cpp

For advanced users who want more control.

```bash
# Clone llama.cpp
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp

# Build
make

# Download model (example)
wget https://huggingface.co/microsoft/DialoGPT-medium/resolve/main/pytorch_model.bin

# Run server
./server -m model.gguf --port 11434
```

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Llama Configuration
LLAMA_API_URL=http://localhost:11434/api/generate
LLAMA_MODEL=llama3.2

# Optional: Adjust model parameters
LLAMA_TEMPERATURE=0.7
LLAMA_TOP_P=0.9
LLAMA_MAX_TOKENS=1000
```

### Model Parameters

You can adjust the model behavior by modifying `backend/utils/llama_service.py`:

```python
"options": {
    "temperature": 0.7,    # Creativity (0.0-1.0)
    "top_p": 0.9,         # Diversity (0.0-1.0)
    "max_tokens": 1000     # Response length
}
```

## Testing the Setup

1. **Start your Llama service** (Ollama, LM Studio, etc.)
2. **Start the backend:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```
3. **Test the simulation endpoint:**
   ```bash
   curl -X POST "http://localhost:8000/projects/simulate" \
        -H "Content-Type: application/json" \
        -d '{
          "project_id": 18977588,
          "alternative_materials": ["Recycled Materials"],
          "alternative_resources": {"labor": 1.2},
          "weather_scenario": "severe"
        }'
   ```

## Troubleshooting

### Common Issues

1. **"Connection refused" error:**

   - Make sure Ollama/LM Studio is running
   - Check the port (default: 11434)
   - Verify the API URL in your environment variables

2. **"Model not found" error:**

   - Make sure you've pulled the model: `ollama pull llama3.2`
   - Check the model name in your environment variables

3. **Slow responses:**

   - Use a smaller model (llama3.2 instead of llama3.1)
   - Reduce max_tokens in the configuration
   - Consider using GPU acceleration

4. **Out of memory:**
   - Use a smaller model
   - Close other applications
   - Consider using CPU-only mode

### Performance Tips

- **GPU Acceleration:** Install CUDA for faster inference
- **Model Size:** Smaller models are faster but less capable
- **Batch Processing:** Process multiple requests together
- **Caching:** Cache common responses to reduce API calls

## Model Recommendations

| Model    | Size | Speed  | Quality | Use Case            |
| -------- | ---- | ------ | ------- | ------------------- |
| llama3.2 | ~2GB | Fast   | Good    | Development/Testing |
| llama3.1 | ~4GB | Medium | Better  | Production          |
| llama2   | ~3GB | Medium | Good    | Balanced            |

## Security Notes

- **Local Only:** All processing happens on your machine
- **No Data Sharing:** Your project data never leaves your system
- **Offline Capable:** Works without internet connection
- **Privacy:** Complete control over your data

## Next Steps

1. **Choose your setup method** (Ollama recommended)
2. **Install and configure** the Llama service
3. **Test the integration** with the simulation system
4. **Adjust parameters** for your specific needs
5. **Monitor performance** and optimize as needed

Your simulation system will now use local Llama instead of Gemini for AI-powered recommendations! 🦙✨
