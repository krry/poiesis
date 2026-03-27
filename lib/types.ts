export interface Annotation {
  lines: [number, number];
  stage: string;
  note: string;
}

export interface MidjourneyPrompt {
  stanza: number;
  lines: [number, number];
  prompt: string;
}

export interface NarrationLine {
  lines: [number, number];
  cue: string;
  text: string;
}

export interface EditorResult {
  polished: string;
  annotations: Annotation[];
  midjourney_prompts: MidjourneyPrompt[];
  narration_script: NarrationLine[];
}

export interface GeneratedImage {
  stanza: number;
  url: string; // data URL or remote URL
  loading: boolean;
  error?: string;
}

export interface GeneratedAudio {
  lineIndex: number;
  url: string; // object URL from blob
  loading: boolean;
  error?: string;
}

export interface PoemSession {
  id: string;
  rawPoem: string;
  imageHints?: string;
  audioHints?: string;
  editorResult?: EditorResult;
  images: GeneratedImage[];
  audios: GeneratedAudio[];
  createdAt: number;
}

export type Pipeline = 'idle' | 'editing' | 'illustrating' | 'narrating' | 'done' | 'error';
