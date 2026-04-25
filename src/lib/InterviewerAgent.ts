// The system instructions for the Interviewer Agent
const SYSTEM_INSTRUCTION = `
You are Aayu, a respectful and caring Nepali AI Doctor.
CRITICAL: You MUST speak exclusively in Nepali language.
Your goal is to gently ask the patient (Aama) about her health today, 
including whether she has taken her medicine and how she is feeling.
Keep your responses short, natural, conversational, and caring.
`;

import { supabase } from './supabase';

export class InterviewerAgent {
  private ws: WebSocket | null = null;
  private onMessageCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onInputCallback: ((text: string) => void) | null = null;
  private audioContext: AudioContext | null = null;
  private nextPlayTime = 0;
  
  constructor(private userId: string) {}

  public onMessage(callback: (text: string, isFinal: boolean) => void) {
    this.onMessageCallback = callback;
  }

  public onInputMessage(callback: (text: string) => void) {
    this.onInputCallback = callback;
  }

  // Initialize Audio Context for playback
  private initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }); // Output audio from gemini is 24kHz
    }
  }

  /**
   * Connects to the Live API WebSocket natively and starts listening for real-time audio.
   */
  public async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Connecting to Gemini Live API via WebSockets...');
        this.initAudio();
        
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key is missing.");

        // Fetch user health knowledge
        let additionalContext = "";
        try {
           const { data: knowledgeData, error } = await supabase
             .from('health_knowledge')
             .select('content, metadata')
             .eq('user_id', this.userId);
           
           if (!error && knowledgeData && knowledgeData.length > 0) {
             additionalContext = "\n\nHere is the patient's health knowledge context:\n" + 
               knowledgeData.map(k => k.content).join("\n");
           }
        } catch (err) {
           console.error("Failed to fetch knowledge context", err);
        }

        const dynamicSystemInstruction = SYSTEM_INSTRUCTION + additionalContext;

        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("WebSocket opened. Sending setup message...");
          const setupMessage = {
            setup: {
              model: "models/gemini-3.1-flash-live-preview",
              generationConfig: {
                responseModalities: ["AUDIO"]
              },
              realtimeInputConfig: {
                turnCoverage: "TURN_INCLUDES_ONLY_ACTIVITY",
                automaticActivityDetection: {
                  startOfSpeechSensitivity: "START_SENSITIVITY_HIGH",
                  endOfSpeechSensitivity: "END_SENSITIVITY_HIGH",
                  silenceDurationMs: 250,
                  prefixPaddingMs: 50
                }
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              systemInstruction: {
                parts: [{ text: dynamicSystemInstruction }]
              }
            }
          };
          this.ws?.send(JSON.stringify(setupMessage));
        };

        this.ws.onmessage = async (event) => {
          try {
            let dataStr = event.data;
            if (dataStr instanceof Blob) {
              dataStr = await dataStr.text();
            }
            const msg = JSON.parse(dataStr);

            if (msg.setupComplete) {
              console.log('Session setup complete.');
              resolve();
              // Trigger the first greeting quietly by sending a hidden text prompt
              this.sendText("Please greet me in Nepali to start the conversation.");
            }

            if (msg.serverContent) {
              const content = msg.serverContent;
              
              if (content.outputTranscription && this.onMessageCallback) {
                this.onMessageCallback(content.outputTranscription.text, true);
              }

              if (content.inputTranscription && this.onInputCallback) {
                this.onInputCallback(content.inputTranscription.text);
              }

              // Surface text transcripts from the Gemini server directly
              if (content.modelTurn && content.modelTurn.parts) {
                for (const part of content.modelTurn.parts) {
                  // Some text responses come inline
                  if (part.text && this.onMessageCallback) {
                    this.onMessageCallback(part.text, true);
                  }
                  // Inline Audio Parts
                  if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
                    const audioBytes = part.inlineData.data;
                    const binaryStr = atob(audioBytes);
                    const uint8 = new Uint8Array(binaryStr.length);
                    for (let i = 0; i < binaryStr.length; i++) {
                      uint8[i] = binaryStr.charCodeAt(i);
                    }
                    await this.playAudioChunk(uint8);
                  }
                }
              }
            }
          } catch (e) {
            console.error("Error handling message:", e);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket Error:", error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        };

      } catch (error) {
        console.error('Failed to initialize connection:', error);
        reject(error);
      }
    });
  }

  // Play PCM 24kHz little-endian
  private async playAudioChunk(pcmData: Uint8Array) {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    const float32Array = new Float32Array(pcmData.length / 2);
    const dataView = new DataView(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength);
    for (let i = 0; i < pcmData.length / 2; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / 32768; // Convert to [-1.0, 1.0]
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    // Smooth consecutive playback
    const startTime = Math.max(this.audioContext.currentTime, this.nextPlayTime);
    source.start(startTime);
    this.nextPlayTime = startTime + audioBuffer.duration;
  }

  // --- Real-time Microphone Capture ---
  private mediaStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;

  public async startMicrophone() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!this.audioContext) this.initAudio();
      
      this.audioSource = this.audioContext!.createMediaStreamSource(this.mediaStream);
      // We need 16kHz PCM. We use ScriptProcessor for cross-browser simplicity in prototype.
      // (A full app would use AudioWorklet).
      this.audioProcessor = this.audioContext!.createScriptProcessor(4096, 1, 1);
      
      this.audioProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Resample from AudioContext rate (24k/48k) to 16kHz
        const pcm16 = this.downsampleBuffer(inputData, this.audioContext!.sampleRate, 16000);
        
        // Safely Convert Int16Array to Base64 avoiding spread operator stack exhaustion
        const uint8 = new Uint8Array(pcm16.buffer);
        let binaryString = "";
        for (let i = 0; i < uint8.byteLength; i++) {
            binaryString += String.fromCharCode(uint8[i]);
        }
        const base64Pcm = btoa(binaryString);
        this.sendAudioChunk(base64Pcm);
      };

      this.audioSource.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext!.destination);

    } catch (e) {
      console.error("Microphone error:", e);
    }
  }

  private downsampleBuffer(buffer: Float32Array, sampleRate: number, outRate: number) {
    if (outRate === sampleRate) {
      const pcm = new Int16Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        pcm[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7FFF;
      }
      return pcm;
    }
    const sampleRateRatio = sampleRate / outRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Int16Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      let nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0, count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = Math.max(-1, Math.min(1, accum / count)) * 0x7FFF;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  // Send textual commands
  public async sendText(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      realtimeInput: { text: text }
    }));
  }

  // Send PCM audio chunk securely via realtimeInput
  public async sendAudioChunk(base64Pcm: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      realtimeInput: {
        audio: {
          mimeType: "audio/pcm;rate=16000",
          data: base64Pcm
        }
      }
    }));
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      console.log('Disconnected from Gemini Live API.');
    }
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(e => console.error(e));
      this.audioContext = null;
    }
    this.nextPlayTime = 0;
  }
}
