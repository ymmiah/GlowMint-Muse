import React, { useState, useMemo, useEffect } from 'react';
import { AspectRatio, GeneratedImage, GenerationConfig, GenerationModel } from '../types';
import { Button } from './Button';
import { generateImage, refineImage, analyzeImage } from '../services/geminiService';

interface ImageWorkspaceProps {
  prompt: string;
  setPrompt: (p: string) => void;
  onImageGenerated: (img: GeneratedImage) => void;
  generatedImages: GeneratedImage[];
}

export const ImageWorkspace: React.FC<ImageWorkspaceProps> = ({ 
  prompt, 
  setPrompt, 
  onImageGenerated,
  generatedImages 
}) => {
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: AspectRatio.Square,
    model: GenerationModel.Flash,
    negativePrompt: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);

  // Sync selected image when a new one is added to the top of the list
  useEffect(() => {
    if (generatedImages.length > 0 && !selectedImage) {
      setSelectedImage(generatedImages[0]);
    }
  }, [generatedImages, selectedImage]);

  // Determine history state
  const currentIndex = useMemo(() => 
    selectedImage ? generatedImages.findIndex(img => img.id === selectedImage.id) : -1,
    [selectedImage, generatedImages]
  );

  // History is mostly newest-first: [Newest (0), Older (1), Oldest (2)]
  const canUndo = currentIndex !== -1 && currentIndex < generatedImages.length - 1; // Can go to older
  const canRedo = currentIndex !== -1 && currentIndex > 0; // Can go to newer

  const handleUndo = () => {
    if (canUndo) {
      const prevImage = generatedImages[currentIndex + 1];
      setSelectedImage(prevImage);
      setPrompt(prevImage.prompt); // Restore prompt for context
      setEditMode(false);
      setAnalysis(null);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const nextImage = generatedImages[currentIndex - 1];
      setSelectedImage(nextImage);
      setPrompt(nextImage.prompt);
      setEditMode(false);
      setAnalysis(null);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setAnalysis(null);

    try {
      const base64 = await generateImage(
        prompt,
        config.model,
        config.aspectRatio,
        config.negativePrompt
      );

      if (base64) {
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          url: base64,
          prompt: prompt,
          timestamp: new Date(),
          aspectRatio: config.aspectRatio,
          model: config.model
        };
        onImageGenerated(newImage);
        setSelectedImage(newImage);
      }
    } catch (e) {
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!selectedImage || !editPrompt.trim()) return;
    setIsGenerating(true);

    try {
      const refinedBase64 = await refineImage(selectedImage.url, editPrompt, config.model);
      
      if (refinedBase64) {
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          url: refinedBase64,
          prompt: `Refined: ${editPrompt}`,
          timestamp: new Date(),
          aspectRatio: selectedImage.aspectRatio,
          model: selectedImage.model
        };
        onImageGenerated(newImage);
        setSelectedImage(newImage);
        setEditMode(false);
        setEditPrompt('');
      }
    } catch (e) {
      alert("Failed to refine image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsGenerating(true);
    const result = await analyzeImage(selectedImage.url);
    setAnalysis(result);
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!selectedImage) return;
    const link = document.createElement('a');
    link.href = selectedImage.url;
    link.download = `glowmint-muse-${selectedImage.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Top Bar: Controls */}
      <div className="p-6 bg-slate-900/50 border-b border-slate-800 z-20 shrink-0">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex gap-4">
             <div className="flex-1 relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your vision (or ask GlowMint Muse for help)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pr-20 text-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none h-24 text-sm shadow-inner transition-colors duration-200"
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                    {prompt.length} chars
                </div>
             </div>
             
             <div className="w-64 space-y-3">
                <Button 
                    onClick={handleGenerate} 
                    isLoading={isGenerating} 
                    className="w-full py-3 h-full text-lg shadow-xl shadow-teal-500/10 hover:shadow-teal-500/30 transform transition-all hover:scale-[1.02]"
                    icon="✨"
                >
                    Generate
                </Button>
             </div>
          </div>

          <div className="flex items-center gap-4 text-sm animate-fade-in">
            <select 
              value={config.model}
              onChange={(e) => setConfig({...config, model: e.target.value as GenerationModel})}
              className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-teal-500 outline-none transition-colors cursor-pointer hover:border-slate-600"
            >
              <option value={GenerationModel.Flash}>⚡ Gemini Flash (Fast)</option>
              <option value={GenerationModel.Pro}>💎 Gemini Pro (Quality)</option>
            </select>

            <select 
              value={config.aspectRatio}
              onChange={(e) => setConfig({...config, aspectRatio: e.target.value as AspectRatio})}
              className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-teal-500 outline-none transition-colors cursor-pointer hover:border-slate-600"
            >
              <option value={AspectRatio.Square}>1:1 Square</option>
              <option value={AspectRatio.Landscape}>4:3 Landscape</option>
              <option value={AspectRatio.Wide}>16:9 Wide</option>
              <option value={AspectRatio.Portrait}>3:4 Portrait</option>
              <option value={AspectRatio.Tall}>9:16 Tall</option>
            </select>
            
            <input 
               type="text" 
               placeholder="Negative prompt (e.g. blurry, distorted)"
               value={config.negativePrompt}
               onChange={(e) => setConfig({...config, negativePrompt: e.target.value})}
               className="flex-1 bg-transparent border-b border-slate-700 text-slate-400 placeholder-slate-600 px-2 py-1 focus:border-teal-500 outline-none transition-colors"
            />

            <div className="h-6 w-px bg-slate-700 mx-1" />

            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                onClick={handleUndo} 
                disabled={!canUndo} 
                title="Undo (Previous Image)"
                className="px-2"
              >
                ↩️
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleRedo} 
                disabled={!canRedo} 
                title="Redo (Next Image)"
                className="px-2"
              >
                ↪️
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Viewer or Empty State */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {isGenerating ? (
           <div className="w-full h-full flex flex-col p-2 gap-2 animate-fade-in">
              {/* Skeleton Canvas */}
              <div className="flex-1 rounded-xl bg-slate-900 relative overflow-hidden flex items-center justify-center ring-1 ring-white/5 shadow-2xl">
                  {/* Pulse and Glow Effects */}
                  <div className="absolute inset-0 bg-slate-800/20 animate-pulse" />
                  <div className="absolute w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-75" />
                  
                  <div className="relative z-10 flex flex-col items-center gap-6">
                      {/* Custom Spinner */}
                      <div className="relative w-16 h-16">
                          <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center text-lg animate-pulse">✨</div>
                      </div>
                      
                      {/* Loading Text */}
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-teal-400 font-medium text-lg tracking-wide animate-pulse">GlowMint Muse is creating</span>
                        <span className="text-slate-500 text-sm">Weaving pixels into art...</span>
                      </div>
                  </div>
              </div>
              
              {/* Skeleton Bottom Panel (History Placeholder) */}
               <div className="shrink-0 flex flex-col gap-3">
                   <div className="w-full h-20 bg-slate-900/40 border border-slate-800/50 rounded-lg animate-pulse" />
               </div>
           </div>
        ) : !selectedImage ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 animate-slide-up">
             <div className="text-6xl opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>🖼️</div>
             <p className="opacity-80">Select or generate an image to begin editing</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col p-2 gap-2"> 
            
            {/* Image Viewer */}
            <div className="flex-1 min-h-0 relative group rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-slate-900 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-fade-in">
               <img 
                 src={selectedImage.url} 
                 alt={selectedImage.prompt} 
                 className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-[1.01]"
               />
               
               {/* Overlay Controls */}
               <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 flex justify-center items-end h-32">
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={handleDownload} icon="⬇️" className="hover:-translate-y-1">Download</Button>
                    <Button variant="secondary" onClick={() => setEditMode(!editMode)} icon="🪄" className="hover:-translate-y-1">Magic Edit</Button>
                    <Button variant="secondary" onClick={handleAnalyze} icon="🧐" className="hover:-translate-y-1">Critique</Button>
                  </div>
               </div>
            </div>

            {/* Bottom Panel: Analysis, Edit, History */}
            <div className="shrink-0 flex flex-col gap-3">
                {/* Analysis Result */}
                {analysis && (
                    <div className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 animate-slide-up max-h-32 overflow-y-auto custom-scrollbar shadow-lg">
                        <h3 className="text-teal-400 text-xs font-semibold mb-1 flex items-center gap-1">
                            <span>👁️</span> Gemini Vision Analysis
                        </h3>
                        <p className="text-slate-300 text-xs leading-relaxed">{analysis}</p>
                    </div>
                )}

                {/* Magic Edit Panel */}
                {editMode && (
                    <div className="w-full bg-slate-800/50 border border-teal-500/30 rounded-xl p-3 flex gap-3 items-center animate-slide-up shadow-lg shadow-teal-500/5">
                        <div className="bg-teal-500/20 p-2 rounded-lg text-teal-300 text-xl animate-pulse">🪄</div>
                        <div className="flex-1">
                            <label className="block text-[10px] text-teal-300 mb-0.5 font-semibold">SEMANTIC EDITING</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                                placeholder="e.g., 'Make the lighting moodier', 'Turn the cat into a dog'"
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleRefine} isLoading={isGenerating}>Apply</Button>
                    </div>
                )}
                
                {/* History - Horizontal Scroll */}
                <div className="w-full pt-2 border-t border-slate-800">
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar h-20 items-center">
                        {generatedImages.map(img => (
                            <button 
                                key={img.id}
                                onClick={() => { setSelectedImage(img); setEditMode(false); setAnalysis(null); setPrompt(img.prompt); }}
                                className={`relative h-16 aspect-square shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedImage.id === img.id ? 'border-teal-500 scale-105 shadow-lg shadow-teal-500/20' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                            >
                                <img src={img.url} className="w-full h-full object-cover" loading="lazy" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};