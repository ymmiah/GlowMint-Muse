import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, Sender } from '../types';
import { Button } from './Button';
import { sendChatMessage } from '../services/geminiService';

interface ChatInterfaceProps {
  onGeneratePrompt: (prompt: string) => void;
}

const SUGGESTION_CHIPS = [
  "Cyberpunk street food stall at night 🍜",
  "Oil painting of a cozy cottage 🏡",
  "Futuristic eco-friendly city 🌿",
  "Portrait of a robot philosopher 🤖",
  "Abstract geometric wallpaper 🎨"
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onGeneratePrompt }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: Sender.Gemini,
      text: "Welcome to **GlowMint Muse**. I am your creative partner. Describe your vision, or use the microphone to speak your mind.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Small timeout ensures DOM is fully painted before scrolling
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // --- Voice Input ---
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  // --- Actions ---
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: Sender.User,
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const history = messages.map(m => ({
      role: m.sender === Sender.User ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const responseText = await sendChatMessage(userMsg.text, history);

    const geminiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: Sender.Gemini,
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, geminiMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Clear conversation history?")) {
      setMessages([{
        id: 'welcome',
        sender: Sender.Gemini,
        text: "Conversation cleared. What shall we create next?",
        timestamp: new Date()
      }]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // --- Helpers ---
  const formatText = (text: string) => {
    // Basic Markdown parser for Bold and Italic
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
    return formatted;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm border-r border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
            ✨ GlowMint Muse
          </h2>
          <p className="text-xs text-slate-400">AI Ideation Partner</p>
        </div>
        <button 
          onClick={handleClearChat} 
          className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-slate-800"
          title="Clear Chat"
        >
          🗑️
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar relative">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === Sender.User ? 'items-end' : 'items-start'} group`}
          >
            <div className={`flex items-end gap-2 max-w-[90%]`}>
                {msg.sender === Sender.Gemini && (
                   <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-[10px] shrink-0 shadow-lg shadow-teal-500/20">
                     ✨
                   </div>
                )}
                
                <div
                  className={`rounded-2xl p-3 text-sm leading-relaxed shadow-md ${
                    msg.sender === Sender.User
                      ? 'bg-teal-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                  }`}
                >
                  <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                  
                  {/* Actions Bar inside Bubble */}
                  {msg.sender === Sender.Gemini && (
                    <div className="mt-3 pt-2 border-t border-slate-700/50 flex flex-wrap gap-2 justify-between items-center opacity-90">
                      <button 
                        onClick={() => onGeneratePrompt(msg.text)}
                        className="text-xs flex items-center gap-1 text-teal-300 hover:text-teal-200 font-medium transition-colors bg-teal-500/10 px-2 py-1 rounded"
                      >
                        🎨 Use Prompt
                      </button>
                      <button 
                         onClick={() => copyToClipboard(msg.text)}
                         className="text-xs text-slate-400 hover:text-white transition-colors"
                         title="Copy text"
                      >
                         📋
                      </button>
                    </div>
                  )}
                </div>
            </div>
          </div>
        ))}
        
        {/* Suggestion Chips (Only show if few messages) */}
        {messages.length < 3 && !isTyping && (
           <div className="grid grid-cols-1 gap-2 mt-4 px-2">
              <p className="text-xs text-slate-500 text-center mb-2">Try a starter:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTION_CHIPS.map((chip, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setInput(chip)}
                        className="text-xs bg-slate-800 border border-slate-700 hover:border-teal-500/50 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-all"
                    >
                        {chip}
                    </button>
                ))}
              </div>
           </div>
        )}

        {isTyping && (
          <div className="flex justify-start gap-2 items-end">
             <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] shrink-0">✨</div>
             <div className="bg-slate-800 rounded-2xl rounded-tl-none p-3 border border-slate-700">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-800">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Describe your idea..."}
                rows={1}
                className={`w-full bg-slate-950 border ${isListening ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-800'} rounded-xl pl-4 pr-10 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none placeholder-slate-600 resize-none custom-scrollbar`}
                disabled={isTyping}
                style={{ minHeight: '46px', maxHeight: '120px' }}
            />
            {/* Mic Button inside Input */}
            <button
                onClick={handleVoiceInput}
                className={`absolute right-2 bottom-2 p-1.5 rounded-lg transition-all ${isListening ? 'text-red-400 animate-pulse bg-red-500/10' : 'text-slate-400 hover:text-teal-400 hover:bg-slate-800'}`}
                title="Voice Input"
            >
                {isListening ? '⏹️' : '🎙️'}
            </button>
          </div>
          
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isTyping} 
            className="h-[46px] w-[46px] p-0 flex items-center justify-center rounded-xl"
          >
            ➤
          </Button>
        </div>
      </div>
    </div>
  );
};