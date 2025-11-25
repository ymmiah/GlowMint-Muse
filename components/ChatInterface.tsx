import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, Sender } from '../types';
import { Button } from './Button';
import { sendChatMessage } from '../services/geminiService';

interface ChatInterfaceProps {
  onGeneratePrompt: (prompt: string) => void;
  onImportImage: (base64: string) => void;
  generatedCount: number;
}

const SUGGESTION_CHIPS = [
  "Cyberpunk street food stall at night 🍜",
  "Oil painting of a cozy cottage 🏡",
  "Futuristic eco-friendly city 🌿",
  "Portrait of a robot philosopher 🤖",
  "Abstract geometric wallpaper 🎨"
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onGeneratePrompt, 
  onImportImage,
  generatedCount 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: Sender.Gemini,
      text: "Welcome to **GlowMint Muse**. I am your creative partner. Describe your vision, upload an image for feedback, or use the microphone.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, attachment]);

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

  // --- File Upload ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Actions ---
  const handleSend = async () => {
    if ((!input.trim() && !attachment)) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: Sender.User,
      text: input,
      attachment: attachment || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setIsTyping(true);

    // Construct history properly for multimodal usage
    const history = messages.map(m => {
        const parts: any[] = [{ text: m.text || (m.attachment ? "Sent an image" : "") }];
        if (m.attachment) {
            const base64 = m.attachment.split(',')[1];
            const mime = m.attachment.split(';')[0].split(':')[1];
            parts.push({ inlineData: { mimeType: mime, data: base64 }});
        }
        return {
            role: m.sender === Sender.User ? 'user' : 'model',
            parts: parts
        };
    });

    const responseText = await sendChatMessage(userMsg.text, history, userMsg.attachment);

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
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
    return formatted;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm border-r border-slate-800 relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
            ✨ GlowMint Muse
          </h2>
          <p className="text-xs text-slate-400">AI Ideation Partner</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowProfile(!showProfile)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs shadow-lg hover:ring-2 hover:ring-white/20 transition-all"
                title="Your Profile"
            >
                👤
            </button>
            <button 
                onClick={handleClearChat} 
                className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-slate-800"
                title="Clear Chat"
            >
                🗑️
            </button>
        </div>
        
        {/* Profile Popover */}
        {showProfile && (
            <div className="absolute top-16 right-4 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-lg">
                        👤
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Creative User</h3>
                        <p className="text-xs text-slate-400">Pro Plan</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm py-2 border-b border-slate-700/50">
                        <span className="text-slate-400">Generated Images</span>
                        <span className="text-teal-400 font-bold">{generatedCount}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-slate-700/50">
                        <span className="text-slate-400">Messages</span>
                        <span className="text-teal-400 font-bold">{messages.length}</span>
                    </div>
                </div>
                <button 
                    onClick={() => setShowProfile(false)}
                    className="mt-3 w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 rounded transition-colors"
                >
                    Close
                </button>
            </div>
        )}
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
                  className={`rounded-2xl p-3 text-sm leading-relaxed shadow-md flex flex-col gap-2 ${
                    msg.sender === Sender.User
                      ? 'bg-teal-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                  }`}
                >
                  {/* Attachment in Message */}
                  {msg.attachment && (
                      <div className="relative group/image overflow-hidden rounded-lg mb-1 border border-black/10">
                          <img src={msg.attachment} alt="Attachment" className="max-w-full h-auto max-h-48 object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                               <button 
                                  onClick={() => onImportImage(msg.attachment!)}
                                  className="bg-white/10 hover:bg-white/20 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors border border-white/20"
                               >
                                   🪄 Edit in Canvas
                               </button>
                          </div>
                      </div>
                  )}

                  {msg.text && <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />}
                  
                  {/* Actions Bar inside Bubble */}
                  {msg.sender === Sender.Gemini && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-wrap gap-2 justify-between items-center opacity-90">
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
        
        {/* Suggestion Chips */}
        {messages.length < 3 && !isTyping && !attachment && (
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

      {/* Attachment Preview Area */}
      {attachment && (
         <div className="px-4 pb-2 bg-slate-900/80 border-t border-slate-800 flex items-center">
             <div className="relative group inline-block">
                 <img src={attachment} className="h-16 w-16 object-cover rounded-lg border border-teal-500/50 shadow-lg" alt="Preview" />
                 <button 
                    onClick={clearAttachment}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md hover:bg-red-600"
                 >
                     ×
                 </button>
             </div>
             <div className="ml-3 text-xs text-teal-400">Image attached</div>
         </div>
      )}

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
                className={`w-full bg-slate-950 border ${isListening ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-800'} rounded-xl pl-10 pr-10 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none placeholder-slate-600 resize-none custom-scrollbar`}
                disabled={isTyping}
                style={{ minHeight: '46px', maxHeight: '120px' }}
            />
            
            {/* Upload Button */}
             <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-2 bottom-2 p-1.5 text-slate-400 hover:text-teal-400 transition-colors"
                title="Upload Image"
            >
                📎
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*" 
                className="hidden" 
            />

            {/* Mic Button */}
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
            disabled={(!input.trim() && !attachment) || isTyping} 
            className="h-[46px] w-[46px] p-0 flex items-center justify-center rounded-xl"
          >
            ➤
          </Button>
        </div>
      </div>
    </div>
  );
};