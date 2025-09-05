import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Code, Trash2, Play, Copy, Download, Zap, Brain, Terminal, Volume2, Wifi, WifiOff, Eye, EyeOff, Monitor, Maximize2 } from 'lucide-react';

const CodeMateAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Click the orb to start talking');
  const [conversation, setConversation] = useState([]);
  const [codeBlocks, setCodeBlocks] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentCodeBlock, setCurrentCodeBlock] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState('split');
  const conversationRef = useRef(null);
  const iframeRef = useRef(null);
  const sessionId = 'default';
  const API_BASE = 'http://localhost:8000';

  useEffect(() => {
    checkAPIConnection();
    
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isListening && isConnected && !e.target.tagName.match(/INPUT|TEXTAREA/)) {
        e.preventDefault();
        startVoiceChat();
      }
      if (e.code === 'KeyP' && e.ctrlKey) {
        e.preventDefault();
        togglePreview();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isListening, isConnected]);

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

  useEffect(() => {
    if (showPreview && codeBlocks.length > 0) {
      updatePreview();
    }
  }, [currentCodeBlock, showPreview, codeBlocks]);

  const checkAPIConnection = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        setIsConnected(true);
        setStatus('Ready to chat! Click the orb or press space.');
      } else {
        setIsConnected(false);
        setStatus('API connection failed. Please check if the server is running.');
      }
    } catch (error) {
      setIsConnected(false);
      setStatus('Server Connection Failed - Running in demo mode');
      // Add some demo content for testing
      setTimeout(() => {
        addMessage("Create a simple HTML page with a blue background", true);
        addMessage("Here's a simple HTML page with a blue background:\n\n```html\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Blue Background Page</title>\n    <style>\n        body {\n            background-color: #4A90E2;\n            font-family: Arial, sans-serif;\n            margin: 0;\n            padding: 20px;\n            color: white;\n            min-height: 100vh;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n        }\n        .container {\n            text-align: center;\n            background-color: rgba(255, 255, 255, 0.1);\n            padding: 40px;\n            border-radius: 15px;\n            backdrop-filter: blur(10px);\n        }\n        h1 {\n            font-size: 2.5em;\n            margin-bottom: 20px;\n        }\n        p {\n            font-size: 1.2em;\n            line-height: 1.6;\n        }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        <h1>Welcome to My Blue Page</h1>\n        <p>This is a beautiful HTML page with a blue background and some styling.</p>\n        <p>The page uses modern CSS with backdrop filters and responsive design.</p>\n    </div>\n</body>\n</html>\n```\n\nThis HTML page features:\n- A beautiful blue gradient background\n- Centered content with glassmorphism effects\n- Responsive design\n- Modern CSS styling", false);
      }, 1000);
    }
  };

  const extractCodeBlocks = (text) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();
      blocks.push({
        language: language.toLowerCase(),
        code,
        id: Date.now() + Math.random(),
        isHTML: language.toLowerCase() === 'html' || code.includes('<html') || code.includes('<!DOCTYPE')
      });
    }
    
    return blocks;
  };

  const updatePreview = () => {
    const currentBlock = codeBlocks[currentCodeBlock];
    if (currentBlock && currentBlock.isHTML && iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      doc.open();
      doc.write(currentBlock.code);
      doc.close();
    }
  };

  const togglePreview = () => {
    const currentBlock = codeBlocks[currentCodeBlock];
    if (currentBlock && currentBlock.isHTML) {
      setShowPreview(!showPreview);
    }
  };

  const addMessage = (text, isUser = false) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      text,
      isUser,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setConversation(prev => [...prev, newMessage]);
    
    if (!isUser) {
      const blocks = extractCodeBlocks(text);
      if (blocks.length > 0) {
        setCodeBlocks(prev => [...prev, ...blocks]);
        if (blocks.some(block => block.isHTML)) {
          setShowPreview(true);
        }
      }
    }
  };

  const startVoiceChat = async () => {
    if (isListening || !isConnected) return;
    
    setIsListening(true);
    setStatus('Listening... Speak now!');

    try {
      const sttResponse = await fetch(`${API_BASE}/speech/recognize`, {
        method: 'POST'
      });
      
      if (!sttResponse.ok) throw new Error('Speech recognition failed');
      
      const sttData = await sttResponse.json();
      
      if (!sttData.success || !sttData.text) {
        throw new Error('Could not understand audio');
      }

      const userText = sttData.text;
      addMessage(userText, true);
      setIsListening(false);
      setIsProcessing(true);
      setStatus('Processing your request...');

      const chatResponse = await fetch(`${API_BASE}/chat/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: userText,
          session_id: sessionId
        })
      });

      if (!chatResponse.ok) throw new Error('Chat response failed');
      
      const chatData = await chatResponse.json();
      addMessage(chatData.response, false);
      setIsProcessing(false);
      setIsSpeaking(true);

      setStatus('Speaking response...');

      const ttsResponse = await fetch(`${API_BASE}/speech/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: chatData.response
        })
      });

      if (chatData.is_exit) {
        setStatus('Session ended. Refresh to start again.');
        return;
      }

      setStatus('Ready for your next question!');

    } catch (error) {
      console.error('Voice chat error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsListening(false);
      setIsProcessing(false);
      setIsSpeaking(false);
    }
  };

  const clearConversation = async () => {
    try {
      if (isConnected) {
        await fetch(`${API_BASE}/session/${sessionId}`, {
          method: 'DELETE'
        });
      }
      setConversation([]);
      setCodeBlocks([]);
      setCurrentCodeBlock(0);
      setShowPreview(false);
      setStatus('Conversation cleared. Ready for a fresh start!');
    } catch (error) {
      console.error('Clear error:', error);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
  };

  const downloadCode = (code, language) => {
    const extension = language === 'python' ? '.py' : 
                     language === 'javascript' ? '.js' : 
                     language === 'typescript' ? '.ts' : 
                     language === 'html' ? '.html' :
                     language === 'css' ? '.css' : '.txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CodeMate-${Date.now()}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentBlock = codeBlocks[currentCodeBlock];
  const isCurrentHTML = currentBlock && currentBlock.isHTML;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-purple-900"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  CodeMate
                </h1>
                <p className="text-gray-400 text-sm">Voice Coding Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl backdrop-blur-sm border transition-all ${
                isConnected 
                  ? 'bg-green-500/20 border-green-400/30 text-green-400' 
                  : 'bg-red-500/20 border-red-400/30 text-red-400'
              }`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Demo Mode'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`relative z-10 container mx-auto px-6 py-8 ${
        showPreview && previewMode === 'fullscreen' ? 'max-w-full' : ''
      }`}>
        
        {previewMode === 'fullscreen' && showPreview && isCurrentHTML ? (
          // Fullscreen Preview Mode
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold flex items-center space-x-3">
                <Monitor className="w-6 h-6 text-orange-400" />
                <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Fullscreen Preview</span>
              </h3>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setPreviewMode('split')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center space-x-2 border border-white/20"
                >
                  <Code className="w-4 h-4" />
                  <span>Split View</span>
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center space-x-2 border border-white/20"
                >
                  <EyeOff className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            <div className="h-[calc(100vh-200px)] bg-white rounded-2xl shadow-2xl overflow-hidden">
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                title="HTML Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        ) : (
          // Normal Layout
          <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-3'}`}>
            
            {/* Voice Interface Column */}
            <div className="space-y-8">
              {/* Voice Orb */}
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div 
                    className={`relative w-48 h-48 rounded-full cursor-pointer transition-all duration-500 ${
                      isListening 
                        ? 'animate-pulse scale-110 shadow-[0_0_80px_rgba(59,130,246,0.8)]' 
                        : isSpeaking
                          ? 'animate-bounce shadow-[0_0_80px_rgba(168,85,247,0.8)]'
                          : isProcessing
                            ? 'animate-spin shadow-[0_0_80px_rgba(236,72,153,0.8)]'
                            : 'hover:scale-105 shadow-[0_0_60px_rgba(59,130,246,0.4)]'
                    }`}
                    onClick={startVoiceChat}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1">
                      <div className="w-full h-full bg-black/20 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center">
                        {isListening ? (
                          <MicOff className="w-12 h-12 text-white animate-bounce" />
                        ) : isSpeaking ? (
                          <Volume2 className="w-12 h-12 text-white animate-pulse" />
                        ) : isProcessing ? (
                          <Brain className="w-12 h-12 text-white animate-pulse" />
                        ) : (
                          <Mic className="w-12 h-12 text-white" />
                        )}
                      </div>
                    </div>

                    {(isListening || isSpeaking) && (
                      <div className="absolute inset-0 rounded-full">
                        <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping"></div>
                        <div className="absolute inset-4 rounded-full border-2 border-white/30 animate-ping delay-500"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isProcessing ? 'Processing...' : 'Ready to Chat'}
                  </h2>
                  <p className="text-gray-300 text-sm">{status}</p>
                  
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={startVoiceChat}
                      disabled={!isConnected || isListening || isProcessing || isSpeaking}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center space-x-2 shadow-lg border border-white/20"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Talk</span>
                    </button>
                    
                    <button
                      onClick={clearConversation}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all flex items-center space-x-2 border border-white/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear</span>
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center justify-center space-x-2">
                      <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">Space</kbd>
                      <span>to talk</span>
                    </div>
                    {isCurrentHTML && (
                      <div className="flex items-center justify-center space-x-2">
                        <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">Ctrl+P</kbd>
                        <span>to preview</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat History Column */}
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-blue-400" />
                  <span>Chat History</span>
                </h3>
                <div className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
                  {conversation.length}
                </div>
              </div>
              
              <div
                ref={conversationRef}
                className="h-96 overflow-y-auto space-y-3 pr-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(168, 85, 247, 0.5) transparent'
                }}
              >
                {conversation.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center space-y-3">
                      <Brain className="w-12 h-12 mx-auto opacity-30" />
                      <p>Start a conversation!</p>
                    </div>
                  </div>
                ) : (
                  conversation.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-xl backdrop-blur-sm border ${
                        message.isUser
                          ? 'bg-blue-500/20 border-blue-500/30 ml-4'
                          : 'bg-white/10 border-white/20 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold text-sm ${message.isUser ? 'text-blue-400' : 'text-green-400'}`}>
                          {message.isUser ? 'You' : 'CodeMate'}
                        </span>
                        <span className="text-xs text-gray-500">{message.timestamp}</span>
                      </div>
                      <p className="text-gray-100 text-sm leading-relaxed">
                        {message.text.replace(/```[\s\S]*?```/g, '[Code generated - check editor]')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Code Editor / Preview Column */}
            <div className="space-y-6">
              {/* Code Editor */}
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center space-x-2">
                    <Code className="w-5 h-5 text-green-400" />
                    <span>Code Editor</span>
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    {isCurrentHTML && (
                      <button
                        onClick={togglePreview}
                        className={`p-2 rounded-lg transition-all border ${
                          showPreview 
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' 
                            : 'bg-white/10 hover:bg-white/20 border-white/20'
                        }`}
                        title={showPreview ? "Hide Preview" : "Show Preview"}
                      >
                        {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                    
                    {codeBlocks.length > 1 && (
                      <div className="flex space-x-1">
                        {codeBlocks.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentCodeBlock(index)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                              currentCodeBlock === index
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/10 hover:bg-white/20 border border-white/20'
                            }`}
                          >
                            {index + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {codeBlocks.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <Code className="w-12 h-12 mx-auto text-gray-600" />
                      <p className="text-gray-400">Code will appear here</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          isCurrentHTML 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-green-500 text-black'
                        }`}>
                          {currentBlock?.language || 'text'}
                        </span>
                        {isCurrentHTML && (
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full border border-orange-500/30">
                            Preview Available
                          </span>
                        )}
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => copyCode(currentBlock?.code)}
                          className="p-2 hover:bg-white/20 rounded-lg transition-all border border-white/20"
                          title="Copy code"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => downloadCode(currentBlock?.code, currentBlock?.language)}
                          className="p-2 hover:bg-white/20 rounded-lg transition-all border border-white/20"
                          title="Download code"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="h-64 bg-gray-900/80 rounded-xl border border-gray-700/50 p-4 font-mono text-xs overflow-auto">
                      <pre className="text-gray-100 whitespace-pre-wrap leading-relaxed">
                        {currentBlock?.code}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Panel */}
              {showPreview && isCurrentHTML && previewMode === 'split' && (
                <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center space-x-2">
                      <Monitor className="w-5 h-5 text-orange-400" />
                      <span>Preview</span>
                    </h3>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPreviewMode('fullscreen')}
                        className="p-2 hover:bg-white/20 rounded-lg transition-all border border-white/20"
                        title="Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowPreview(false)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-all border border-white/20"
                        title="Close"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="h-64 bg-white rounded-xl overflow-hidden shadow-lg">
                    <iframe
                      ref={iframeRef}
                      className="w-full h-full border-0"
                      title="HTML Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeMateAssistant;