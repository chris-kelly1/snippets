import { elevenlabsConfig } from './config';

export interface VoiceCloneResponse {
  voice_id: string;
  name: string;
  status: 'training' | 'ready' | 'failed';
}

export interface TextToSpeechOptions {
  text: string;
  voice_id: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
  };
}

class ElevenLabsService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = elevenlabsConfig.API_KEY;
    this.baseUrl = elevenlabsConfig.BASE_URL;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Don't set Content-Type for FormData - let browser handle it
    const isFormData = options.body instanceof FormData;
    const defaultHeaders: Record<string, string> = {
      'xi-api-key': this.apiKey,
    };
    
    if (!isFormData) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorData}`);
    }

    return response;
  }

  async cloneVoice(
    name: string,
    audioFile: File | Blob | { uri: string; name: string; type: string },
    description?: string
  ): Promise<VoiceCloneResponse> {
    const formData = new FormData();
    formData.append('name', name);

    let fileToUpload: any = audioFile;

    /**
     * In React Native the recommended way to attach a file to `FormData` is to provide
     * an object of the shape `{ uri, name, type }`. When the caller passes a Blob or
     * File (e.g. when running on web), we simply forward that instance. Otherwise we
     * assume the caller supplied the React Native friendly object.
     */
    if (audioFile instanceof Blob) {
      // Web / Expo Web environment – wrap in File so the backend receives a filename.
      fileToUpload = new File([audioFile], 'voice_sample.m4a', {
        type: audioFile.type || 'audio/m4a',
      });
    }

    formData.append('files', fileToUpload as any);

    if (description) {
      formData.append('description', description);
    }

    console.log('Uploading to ElevenLabs:', {
      name,
      fileDesc:
        fileToUpload &&
        (fileToUpload.size !== undefined
          ? { size: fileToUpload.size, type: fileToUpload.type }
          : fileToUpload),
      description,
    });

    const response = await this.makeRequest('/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        // Content-Type left undefined for FormData
      },
      body: formData,
    });

    return response.json();
  }

  async getVoice(voiceId: string) {
    const response = await this.makeRequest(`/voices/${voiceId}`);
    return response.json();
  }

  async deleteVoice(voiceId: string): Promise<void> {
    await this.makeRequest(`/voices/${voiceId}`, {
      method: 'DELETE',
    });
  }

  async textToSpeech(options: TextToSpeechOptions): Promise<Blob> {
    const { text, voice_id, model_id = 'eleven_monolingual_v1', voice_settings } = options;

    const body = {
      text,
      model_id,
      voice_settings: voice_settings || {
        stability: 0.75,
        similarity_boost: 0.75,
      },
    };

    const response = await this.makeRequest(`/text-to-speech/${voice_id}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return response.blob();
  }

  async textToSpeechStream(options: TextToSpeechOptions): Promise<ReadableStream> {
    const { text, voice_id, model_id = 'eleven_monolingual_v1', voice_settings } = options;

    const body = {
      text,
      model_id,
      voice_settings: voice_settings || {
        stability: 0.75,
        similarity_boost: 0.75,
      },
    };

    const response = await this.makeRequest(`/text-to-speech/${voice_id}/stream`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return response.body!;
  }

  async getVoices() {
    const response = await this.makeRequest('/voices');
    return response.json();
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim() !== '';
  }
}

export const elevenlabsService = new ElevenLabsService();