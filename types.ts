export enum Sender {
  User = 'user',
  Gemini = 'gemini'
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  timestamp: Date;
  isThinking?: boolean;
  attachment?: string; // Base64 data URL
}

export interface GeneratedImage {
  id: string;
  url: string; // Base64 data URL
  prompt: string;
  timestamp: Date;
  aspectRatio: string;
  model: string;
  source?: 'generated' | 'imported';
}

export enum AspectRatio {
  Square = "1:1",
  Portrait = "3:4",
  Landscape = "4:3",
  Wide = "16:9",
  Tall = "9:16"
}

export enum GenerationModel {
  Flash = "gemini-2.5-flash-image",
  Pro = "gemini-3-pro-image-preview"
}

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  model: GenerationModel;
  negativePrompt?: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}