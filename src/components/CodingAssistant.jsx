import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Code, Trash2, Settings, Play, Copy, Download, Zap, Brain, Terminal, Volume2, Wifi, WifiOff } from 'lucide-react';

const CodeMateAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Click the orb to start talking');
  const [conversation, setConversation] = useState([]);
  const [codeBlocks, setCodeBlocks] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentCodeBlock, setCurrentCodeBlock] = useState(0);
  const conversationRef = useRef(null);
  const sessionId = 'default';
  const API_BASE = 'https://dzai.onrender.com';

  useEffect(() => {
    checkAPIConnection();
    
    // Add keyboard listener for space
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isListening && isConnected) {
        e.preventDefault();
        startVoiceChat();
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
      setStatus('Server Connection Failed');
    }
  };

  const extractCodeBlocks = (text) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2].trim(),
        id: Date.now() + Math.random()
      });
    }
    
    return blocks;
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
      }
    }
  };

  const startVoiceChat = async () => {
    if (isListening || !isConnected) return;
    
    setIsListening(true);
    setStatus('Listening... Speak now!');

    try {
      // Speech recognition
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

      // Get AI response
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

      // Text to speech
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

      if (!ttsResponse.ok) throw new Error('Text to speech failed');

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
      await fetch(`${API_BASE}/session/${sessionId}`, {
        method: 'DELETE'
      });
      setConversation([]);
      setCodeBlocks([]);
      setCurrentCodeBlock(0);
      setStatus('Conversation cleared. Ready for a fresh start!');
    } catch (error) {
      console.error('Clear error:', error);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    // Add visual feedback
    const button = event.target.closest('button');
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="text-green-400">Copied!</span>';
    setTimeout(() => {
      button.innerHTML = originalText;
    }, 1000);
  };

  const downloadCode = (code, language) => {
    const extension = language === 'python' ? '.py' : language === 'javascript' ? '.js' : language === 'typescript' ? '.ts' : '.txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DZAi-${Date.now()}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background with Multiple Layers */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-purple-900"></div>
        
        {/* Moving orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-400 rounded-full mix-blend-screen filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '3s' }}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent bg-[size:100px_100px] opacity-30"></div>
      </div>

      {/* Header with premium glassmorphism
      <header className="relative z-50 bg-black/30 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl transform group-hover:scale-105 transition-transform">
                  <Brain className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="opacity-0 animate-[fadeInUp_1s_ease-out_forwards]">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  CodeMate
                </h1>
                <p className="text-gray-400 font-light">Your AI Voice Coding Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 opacity-0 animate-[fadeInUp_1s_ease-out_0.3s_forwards]">
              <div className={`flex items-center space-x-3 px-4 py-2 rounded-2xl backdrop-blur-xl border transition-all ${
                isConnected 
                  ? 'bg-green-500/20 border-green-400/30 text-green-400' 
                  : 'bg-red-500/20 border-red-400/30 text-red-400'
              }`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
              </div>
              <button className="p-3 hover:bg-white/10 rounded-2xl transition-all hover:scale-105 backdrop-blur-xl border border-white/10">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header> */}

      {/* Main Content with Grid Layout */}
      <div className="relative z-10 container mx-auto px-8 py-12 grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-200px)]">
        
        {/* Voice Interface - Ultra Modern */}
        <div className="xl:col-span-4 flex flex-col items-center justify-center space-y-12 opacity-0 animate-[fadeInUp_1s_ease-out_0.6s_forwards]">
          
          {/* Main Voice Orb with Advanced Animations */}
          <div className="relative group">
            {/* Outer ripple rings */}
            <div className={`absolute inset-0 rounded-full ${isListening ? 'animate-ping' : ''}`}>
              <div className="w-80 h-80 rounded-full border-2 border-blue-400/20"></div>
            </div>
            <div className={`absolute inset-4 rounded-full ${isListening ? 'animate-ping' : ''}`} style={{ animationDelay: '0.2s' }}>
              <div className="w-72 h-72 rounded-full border-2 border-purple-400/20"></div>
            </div>
            <div className={`absolute inset-8 rounded-full ${isListening ? 'animate-ping' : ''}`} style={{ animationDelay: '0.4s' }}>
              <div className="w-64 h-64 rounded-full border-2 border-pink-400/20"></div>
            </div>

            {/* Main orb */}
            <div 
              className={`relative w-80 h-80 rounded-full cursor-pointer transition-all duration-700 ${
                isListening 
                  ? 'animate-pulse scale-110 shadow-[0_0_120px_rgba(59,130,246,0.8)]' 
                  : isSpeaking
                    ? 'animate-bounce shadow-[0_0_120px_rgba(168,85,247,0.8)]'
                    : isProcessing
                      ? 'animate-spin shadow-[0_0_120px_rgba(236,72,153,0.8)]'
                      : 'hover:scale-105 shadow-[0_0_80px_rgba(59,130,246,0.4)] hover:shadow-[0_0_120px_rgba(59,130,246,0.6)]'
              }`}
              onClick={startVoiceChat}
            >
              {/* Gradient background */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1">
                <div className="w-full h-full bg-black/20 backdrop-blur-2xl rounded-full border border-white/20"></div>
              </div>

              {/* Inner glow effect */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-gradient-to-r from-white/30 via-blue-400/20 to-transparent opacity-70 animate-pulse"></div>

              {/* Icon */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                {isListening ? (
                  <MicOff className="w-20 h-20 text-white animate-bounce" />
                ) : isSpeaking ? (
                  <Volume2 className="w-20 h-20 text-white animate-pulse" />
                ) : isProcessing ? (
                  <Brain className="w-20 h-20 text-white animate-pulse" />
                ) : (
                  <Mic className="w-20 h-20 text-white group-hover:scale-110 transition-transform" />
                )}
              </div>

              {/* Voice waves animation */}
              {(isListening || isSpeaking) && (
                <div className="absolute inset-0 rounded-full">
                  <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping"></div>
                  <div className="absolute inset-4 rounded-full border-2 border-white/30 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute inset-8 rounded-full border-2 border-white/20 animate-ping" style={{ animationDelay: '1s' }}></div>
                </div>
              )}
            </div>
          </div>

          {/* Status and Controls */}
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isProcessing ? 'Processing...' : 'Ready to Chat'}
              </h2>
              <p className="text-lg text-gray-300 min-h-[2rem]">{status}</p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={startVoiceChat}
                disabled={!isConnected || isListening || isProcessing || isSpeaking}
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg hover:shadow-2xl hover:scale-105 border border-white/20"
              >
                <Zap className="w-5 h-5 group-hover:animate-pulse" />
                <span>Talk to DZAi</span>
              </button>
              
              <button
                onClick={clearConversation}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-semibold transition-all flex items-center space-x-3 backdrop-blur-xl border border-white/20 hover:scale-105"
              >
                <Trash2 className="w-5 h-5" />
                <span>Clear Chat</span>
              </button>
            </div>

            <p className="text-sm text-gray-500 flex items-center justify-center space-x-2">
              <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-xs">Space</kbd>
              <span>to talk quickly</span>
            </p>
          </div>
        </div>

        {/* Chat History - Modern Glass Card */}
        <div className="xl:col-span-4 opacity-0 animate-[fadeInUp_1s_ease-out_0.9s_forwards]">
          <div className="h-full bg-black/30 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center space-x-3">
                <Terminal className="w-6 h-6 text-blue-400" />
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Conversation</span>
              </h3>
              <div className="text-sm text-gray-400 bg-white/10 px-3 py-1 rounded-full">
                {conversation.length} messages
              </div>
            </div>
            
            <div
              ref={conversationRef}
              className="h-[calc(100%-80px)] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent"
            >
              {conversation.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center space-y-4 animate-pulse">
                    <Brain className="w-16 h-16 mx-auto opacity-30" />
                    <p className="text-lg">Start a conversation!</p>
                    <p className="text-sm">Click the voice orb or press space to begin</p>
                  </div>
                </div>
              ) : (
                conversation.map((message, index) => (
                  <div
                    key={message.id}
                    className={`transform transition-all duration-500 ${
                      message.isUser
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-0 opacity-100'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div
                      className={`p-6 rounded-2xl backdrop-blur-xl border transition-all hover:scale-[1.02] ${
                        message.isUser
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 ml-8 shadow-lg shadow-blue-500/20'
                          : 'bg-white/10 border-white/20 mr-8 shadow-lg shadow-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${message.isUser ? 'bg-blue-400' : 'bg-green-400'} animate-pulse`}></div>
                          <span className={`font-semibold ${message.isUser ? 'text-blue-400' : 'text-green-400'}`}>
                            {message.isUser ? 'You' : 'DZAi'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 bg-white/10 px-2 py-1 rounded-full">{message.timestamp}</span>
                      </div>
                      <p className="leading-relaxed text-gray-100">
                        {message.text.replace(/```[\s\S]*?```/g, '✨ Code generated - check the editor →')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Code Editor - Futuristic Design */}
        <div className="xl:col-span-4 opacity-0 animate-[fadeInUp_1s_ease-out_1.2s_forwards]">
          <div className="h-full bg-black/30 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center space-x-3">
                <Code className="w-6 h-6 text-green-400" />
                <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Code Editor</span>
              </h3>
              
              {codeBlocks.length > 1 && (
                <div className="flex space-x-2">
                  {codeBlocks.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCodeBlock(index)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all transform hover:scale-110 ${
                        currentCodeBlock === index
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-white/10 hover:bg-white/20 border border-white/20'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {codeBlocks.length === 0 ? (
              <div className="h-[calc(100%-80px)] flex items-center justify-center">
                <div className="text-center space-y-4 animate-pulse">
                  <div className="relative">
                    <Code className="w-20 h-20 mx-auto text-gray-600" />
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-500/20 rounded-full blur-xl"></div>
                  </div>
                  <p className="text-xl text-gray-400">Code blocks will appear here</p>
                  <p className="text-sm text-gray-500">Ask DZAi to write some code!</p>
                </div>
              </div>
            ) : (
              <div className="h-[calc(100%-80px)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-mono bg-gradient-to-r from-green-400 to-blue-500 text-black px-3 py-1 rounded-full font-bold">
                      {codeBlocks[currentCodeBlock]?.language || 'text'}
                    </span>
                    <div className="text-xs text-gray-400">
                      Block {currentCodeBlock + 1} of {codeBlocks.length}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyCode(codeBlocks[currentCodeBlock]?.code)}
                      className="p-3 hover:bg-white/20 rounded-xl transition-all hover:scale-110 border border-white/20 group"
                      title="Copy code"
                    >
                      <Copy className="w-4 h-4 group-hover:text-green-400 transition-colors" />
                    </button>
                    <button
                      onClick={() => downloadCode(codeBlocks[currentCodeBlock]?.code, codeBlocks[currentCodeBlock]?.language)}
                      className="p-3 hover:bg-white/20 rounded-xl transition-all hover:scale-110 border border-white/20 group"
                      title="Download code"
                    >
                      <Download className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
                    </button>
                  </div>
                </div>

                <div className="h-[calc(100%-60px)] bg-gray-900/80 rounded-2xl border border-gray-700/50 p-6 font-mono text-sm overflow-auto backdrop-blur-xl">
                  <pre className="text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {codeBlocks[currentCodeBlock]?.code}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Footer
      <footer className="relative z-50 bg-black/30 backdrop-blur-2xl border-t border-white/10 mt-auto">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <p className="text-gray-400 flex items-center space-x-2">
                <span>Powered by</span>
                <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">LangChain</span>
                <span>&</span>
                <span className="font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">Groq</span>
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-xs">Space</kbd>
                <span>Quick talk</span>
              </span>
              <div className="w-px h-4 bg-gray-600"></div>
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-semibold">
                v1.0.0
              </span>
            </div>
          </div>
        </div>
      </footer> */}

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 6px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
        
        /* Ensure content is visible */
        .xl\\:col-span-4 {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default CodeMateAssistant;