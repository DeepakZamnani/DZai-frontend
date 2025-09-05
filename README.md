# CodeMate Voice Assistant 🎤🤖

A modern AI-powered voice coding assistant built with FastAPI, featuring real-time speech recognition, natural language processing, and text-to-speech synthesis. Perfect for hands-free coding and development workflow.

![CodeMate Demo](https://via.placeholder.com/800x400/0a0a0a/00d2ff?text=CodeMate+Voice+Assistant)

## ✨ Features

- 🎤 **Real-time Speech Recognition** - Convert speech to text using Google Speech Recognition
- 🤖 **AI-Powered Coding Assistant** - Powered by Groq's Llama models for intelligent code help
- 🔊 **Text-to-Speech Synthesis** - Natural voice responses with customizable voices
- 💬 **Session Management** - Persistent conversations with memory
- 🌐 **Modern Web Interface** - Beautiful, responsive frontend with animated voice orb
- ⚡ **WebSocket Support** - Real-time communication for seamless interactions
- 📁 **File Upload Support** - Process audio files for speech recognition
- 🔧 **Configurable** - Extensive configuration options via environment variables

## 🏗️ Architecture

```
CodeMate Voice Assistant
├── FastAPI Backend (main.py)
├── Voice Components (voice_components.py)
│   ├── STTService (Speech-to-Text)
│   ├── TTSService (Text-to-Speech) 
│   ├── LLMService (Language Model)
│   └── VoiceAssistant (Orchestrator)
├── Configuration (config.py)
├── Web Frontend (index.html)
└── CLI Runner (run.py)
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Groq API key (get one at [groq.com](https://groq.com))
- Microphone and speakers/headphones
- PyAudio dependencies (varies by OS)

### Installation

1. **Clone or create the project files**
2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install PyAudio (OS-specific):**
   
   **Windows:**
   ```bash
   pip install pyaudio
   ```
   
   **macOS:**
   ```bash
   brew install portaudio
   pip install pyaudio
   ```
   
   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt-get install python3-pyaudio
   # or
   sudo apt-get install portaudio19-dev python3-dev
   pip install pyaudio
   ```

4. **Configure environment:**
   ```bash
   cp .env.template .env
   # Edit .env and add your GROQ_API_KEY
   ```

5. **Run diagnostics (optional):**
   ```bash
   python run.py --diagnose
   ```

6. **Start the server:**
   ```bash
   python run.py
   ```

7. **Open your browser:**
   ```
   http://localhost:8000
   ```

## 🔧 Configuration

Edit your `.env` file to customize the assistant:

```bash
# Required
GROQ_API_KEY=your_groq_api_key_here

# LLM Settings
LLM_MODEL=llama-3.1-8b-instant
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=1024

# Audio Settings
MAX_RECORD_SECONDS=10
ENERGY_THRESHOLD=300
PAUSE_THRESHOLD=0.8
TTS_RATE=180
TTS_VOLUME=0.9

# Server Settings
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=INFO
```

## 📚 API Endpoints

### Core Endpoints

- `GET /` - Web interface
- `GET /health` - Health check
- `GET /docs` - API documentation

### Chat Endpoints

- `POST /chat/text` - Text-based chat
- `POST /voice/interact` - Complete voice interaction

### Speech Endpoints

- `POST /speech/recognize` - Speech-to-text
- `POST /speech/synthesize` - Text-to-speech
- `POST /speech/upload` - Upload audio file for recognition

### Session Management

- `GET /sessions` - List active sessions
- `GET /session/{session_id}` - Get session details
- `DELETE /session/{session_id}` - Clear session

### WebSocket

- `WS /ws/{session_id}` - Real-time communication

## 🎯 Usage Examples

### Text Chat
```python
import requests

response = requests.post("http://localhost:8000/chat/text", json={
    "text": "How do I create a Python class?",
    "session_id": "my-session"
})

print(response.json())
```

### Voice Interaction
```python
response = requests.post("http://localhost:8000/voice/interact", json={
    "session_id": "voice-session",
    "timeout": 10.0
})

print(response.json())
```

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/my-session');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Assistant:', data.text);
};

ws.send(JSON.stringify({
    type: 'chat',
    text: 'Explain Python decorators'
}));
```

## 🎨 Web Interface

The included web interface features:

- **Animated Voice Orb** - Visual feedback for different states
- **Real-time Status Updates** - Shows listening, processing, speaking states
- **Conversation History** - Persistent chat display
- **Modern Design** - Dark theme with gradient effects
- **Responsive Layout** - Works on desktop and mobile

### Interface States

- **Idle** - Ready to receive input
- **Listening** - Microphone active, recording speech
- **Processing** - AI generating response
- **Speaking** - Text-to-speech active

## 🔊 Audio Configuration

### Microphone Setup

1. **Test your microphone:**
   ```bash
   python run.py --diagnose
   ```

2. **Adjust sensitivity in `.env`:**
   ```bash
   ENERGY_THRESHOLD=300  # Lower = more sensitive
   PAUSE_THRESHOLD=0.8   # Seconds of silence before processing
   ```

### Voice Selection

1. **List available voices:**
   ```bash
   curl http://localhost:8000/voices
   ```

2. **Set preferred voice in `.env`:**
   ```bash
   TTS_VOICE=voice_id_here
   ```

## 🛠️ Development

### Project Structure

```
codemate-voice-assistant/
├── main.py              # FastAPI application
├── voice_components.py  # Core voice services
├── config.py           # Configuration management
├── run.py              # CLI runner with diagnostics
├── requirements.txt    # Python dependencies
├── .env.template       # Environment template
├── index.html          # Web frontend
└── README.md          # This file
```

### Running in Development Mode

```bash
python run.py --reload --log-level DEBUG
```

### Adding New Features

1. **Extend VoiceAssistant class** in `voice_components.py`
2. **Add API endpoints** in `main.py`
3. **Update configuration** in `config.py`
4. **Test with diagnostics** using `python run.py --diagnose`

## 🐛 Troubleshooting

### Common Issues

**"Could not understand audio"**
- Check microphone permissions
- Adjust `ENERGY_THRESHOLD` in `.env`
- Test microphone with `python run.py --diagnose`

**"GROQ_API_KEY is required"**
- Sign up at [groq.com](https://groq.com)
- Add API key to `.env` file
- Restart the server

**PyAudio installation fails**
- Install OS-specific audio dependencies
- See installation section for OS-specific commands

**TTS not working**
- Check system audio output
- Try different TTS voices with `/voices` endpoint
- Verify `pyttsx3` installation

### Debug Mode

Enable detailed logging:
```bash
LOG_LEVEL=DEBUG python run.py
```

### Reset Everything

```bash
# Clear all sessions
curl -X DELETE http://localhost:8000/sessions/all

# Or restart the server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `python run.py --diagnose`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [Groq](https://groq.com) for fast LLM inference
- [FastAPI](https://fastapi.tiangolo.com) for the web framework
- [LangChain](https://langchain.com) for LLM integration
- [SpeechRecognition](https://pypi.org/project/SpeechRecognition/) for STT
- [pyttsx3](https://pypi.org/project/pyttsx3/) for TTS

## 🔗 Links

- [Groq API Documentation](https://console.groq.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [LangChain Documentation](https://python.langchain.com)

---

**Happy Coding with CodeMate! 🎤🤖**