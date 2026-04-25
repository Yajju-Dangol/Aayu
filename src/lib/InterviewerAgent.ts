import { GoogleGenAI } from '@google/genai';

// Initialize the client using the environment variable.
// Make sure to add VITE_GEMINI_API_KEY in your .env file.
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'MISSING_API_KEY',
});

// The system instructions for the Interviewer Agent
const SYSTEM_INSTRUCTION = `
You are Aayu, a respectful and caring Nepali AI Doctor (Interviewer Agent).
You speak respectfully using 'Hajur' and 'Tapai'.
Your goal is to gently ask the patient (Aama) about her health today, 
including whether she has taken her medicine and how she is feeling.
You understand spoken Nepali and English.
Keep your responses short, natural, and conversational with no awkward delays.
`;

export class InterviewerAgent {
  private session: any = null;
  private onMessageCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onAudioCallback: ((audioData: Uint8Array) => void) | null = null;
  
  constructor() {}

  public onMessage(callback: (text: string, isFinal: boolean) => void) {
    this.onMessageCallback = callback;
  }

  public onAudio(callback: (audioData: Uint8Array) => void) {
    this.onAudioCallback = callback;
  }

  /**
   * Connect to the Gemini Live API utilizing WebSockets.
   */
  public async connect() {
    try {
      console.log('Connecting to Gemini Live API...');
      
      // We use the live preview model that supports Real-time Audio
      this.session = await ai.clients.createLiveClient({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: ['AUDIO'],
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          }
        }
      });
      
      await this.session.connect();
      console.log('Session connected.');

      // Start the infinite loop to receive events from the model
      this.startListening();

    } catch (error) {
      console.error('Failed to connect to Interviewer Agent:', error);
    }
  }

  /**
   * Listen asynchronously to the server responses
   */
  private async startListening() {
    if (!this.session) return;
    
    try {
      // The SDK uses async iterators to receive the real-time stream
      for await (const response of this.session.receive()) {
        const content = response.serverContent;
        if (!content) continue;

        // 1. Handle Transcriptions (Text)
        if (content.outputTranscription && this.onMessageCallback) {
          const text = content.outputTranscription.text;
          const isFinal = content.outputTranscription.isFinal || false;
          this.onMessageCallback(text, isFinal);
        }

        if (content.inputTranscription) {
           console.log(`[User Audio Transcribed]: ${content.inputTranscription.text}`);
        }

        // 2. Handle Audio output chunks
        if (content.modelTurn) {
          for (const part of content.modelTurn.parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm') && this.onAudioCallback) {
              // Extract raw PCM bytes and send to callback for playback
              const audioBytes = part.inlineData.data;
              this.onAudioCallback(audioBytes);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during live session receive:', error);
    }
  }

  /**
   * Send raw PCM audio chunks from the user's microphone.
   * Format required: raw 16-bit PCM audio, 16kHz, little-endian
   */
  public async sendAudioChunk(pcmChunk: Uint8Array) {
    if (!this.session) return;
    
    await this.session.sendRealtimeInput([{
        mimeType: 'audio/pcm;rate=16000',
        data: pcmChunk
    }]);
  }

  /**
   * Directly send text to the model
   */
  public async sendText(text: string) {
    if (!this.session) return;
    await this.session.sendRealtimeInput([{ text }]);
  }

  public disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
      console.log('Disconnected from Gemini Live API.');
    }
  }
}
