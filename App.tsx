import React, { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { ImageWorkspace } from './components/ImageWorkspace';
import { GeneratedImage, GenerationModel, AspectRatio } from './types';
import { Button } from './components/Button';

function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  // Check for API Key selection on mount
  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio?.hasSelectedApiKey) {
          const has = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(has);
        } else {
          // If we are not in the AI Studio wrapper environment, assume key is present in env
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
        // Fallback to true to allow trying, if check fails
        setHasApiKey(true);
      } finally {
        setCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleConnectApiKey = async () => {
    try {
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        // Assume success after dialog closes (race condition mitigation)
      }
      setHasApiKey(true);
    } catch (e) {
      console.error("Error selecting key:", e);
      alert("Failed to open key selector. Please try again.");
    }
  };

  const handlePromptFromChat = (newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const handleImageGenerated = (image: GeneratedImage) => {
    setGeneratedImages(prev => [image, ...prev]);
  };

  const handleImportImage = (base64: string) => {
    const importedImage: GeneratedImage = {
        id: Date.now().toString(),
        url: base64,
        prompt: "Imported from Chat",
        timestamp: new Date(),
        aspectRatio: AspectRatio.Square, // Default
        model: GenerationModel.Flash, // Default assumption
        source: 'imported'
    };
    setGeneratedImages(prev => [importedImage, ...prev]);
    // The ImageWorkspace useEffect will automatically select this new image
  };

  if (checkingKey) {
    return <div className="flex h-screen w-screen bg-slate-950 items-center justify-center text-teal-500">
      <span className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  // Blocking overlay if no key selected
  if (!hasApiKey) {
    return (
      <div className="flex flex-col h-screen w-screen bg-slate-950 items-center justify-center text-center p-8 relative overflow-hidden animate-fade-in">
        {/* Ambience */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-md space-y-6 animate-slide-up">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-4xl shadow-xl shadow-teal-500/20 transform hover:rotate-12 transition-transform cursor-default">
            ✨
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome to GlowMint Muse</h1>
          <p className="text-slate-400">
            To generate high-quality images with Google's latest Imagen models, you need to connect a Google Cloud project with billing enabled.
          </p>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-sm text-slate-300">
             <p>Access to <span className="text-teal-400 font-mono">gemini-3-pro-image-preview</span> and <span className="text-teal-400 font-mono">gemini-2.5-flash-image</span> requires a valid API key selection.</p>
          </div>
          <Button onClick={handleConnectApiKey} className="w-full py-3 text-lg hover:scale-105">
            Connect & Start Creating
          </Button>
           <p className="text-xs text-slate-500 pt-4">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 underline transition-colors">
              Learn more about billing requirements
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-50 overflow-hidden animate-fade-in">
      {/* Sidebar / Chat Area */}
      <div className="w-96 flex-shrink-0 h-full border-r border-slate-800 relative z-30 shadow-2xl">
        <ChatInterface 
            onGeneratePrompt={handlePromptFromChat} 
            onImportImage={handleImportImage}
            generatedCount={generatedImages.length}
        />
      </div>

      {/* Main Workspace */}
      <div className="flex-1 h-full relative z-0">
        <ImageWorkspace 
            prompt={prompt} 
            setPrompt={setPrompt}
            generatedImages={generatedImages}
            onImageGenerated={handleImageGenerated}
        />
      </div>
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      </div>
    </div>
  );
}

export default App;