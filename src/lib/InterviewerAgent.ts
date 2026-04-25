// The system instructions for the Interviewer Agent
const SYSTEM_INSTRUCTION = `
You are Aayu, a respectful and caring Nepali AI Doctor.
CRITICAL: You MUST speak exclusively in Nepali language.
Your goal is to gently ask the patient (Aama) about her health today, 
including whether she has taken her medicine and how she is feeling.
Keep your responses short, natural, conversational, and caring.
`;

import { supabase, createAgentSupabase } from './supabase';
import { FUNCTION_DECLARATIONS, executeTool, type ToolCall } from './tools';

export class InterviewerAgent {
  private ws: WebSocket | null = null;
  private onMessageCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onInputCallback: ((text: string) => void) | null = null;
  private onStatusCallback: ((status: string) => void) | null = null;
  private audioContext: AudioContext | null = null;
  private nextPlayTime = 0;
  private transcriptAccumulator = '';
  private userId: string;
  private accessToken: string;

  constructor(userId: string, accessToken?: string) {
    this.userId = userId;
    this.accessToken = accessToken || '';
  }

  public onMessage(callback: (text: string, isFinal: boolean) => void) {
    this.onMessageCallback = callback;
  }

  public onInputMessage(callback: (text: string) => void) {
    this.onInputCallback = callback;
  }

  public onStatus(callback: (status: string) => void) {
    this.onStatusCallback = callback;
  }

  // Initialize Audio Context - MUST be called from a user gesture (button click)
  public unlockAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Connects to the Live API WebSocket natively and starts listening for real-time audio.
   */
  public async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Connecting to Gemini Live API via WebSockets...');
        // Note: AudioContext is initialized via unlockAudio() before connect() is called

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key is missing.");

        // Fetch user health knowledge — with a 3s timeout so it never blocks the connection
        let additionalContext = "";
        try {
          const agentSupabase = createAgentSupabase(this.accessToken);
          const fetchPromise = agentSupabase
            .from('health_knowledge')
            .select('content')
            .eq('user_id', this.userId);
          
          const timeoutPromise = new Promise<never>((_, r) =>
            setTimeout(() => r(new Error('Knowledge fetch timeout')), 10000)
          );

          const { data: knowledgeData, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

          if (!error && knowledgeData && knowledgeData.length > 0) {
            additionalContext = "\n\nPatient's uploaded health records:\n" +
              knowledgeData.map((k: any) => k.content).join("\n");
            console.log(`[Agent] Loaded ${knowledgeData.length} knowledge entries.`);
          }
        } catch (err) {
          console.warn("[Agent] Knowledge fetch skipped:", (err as Error).message);
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
                // Not using TURN_INCLUDES_ONLY_ACTIVITY so the model can respond to our text prompt immediately
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
              },
              // ── Tool Declarations ────────────────────────────────────
              // Per Live API docs: toolCall arrives as a TOP-LEVEL message,
              // NOT inside serverContent.modelTurn.parts.
              // Response must be sent as { toolResponse: { functionResponses: [{id, name, response}] } }
              tools: [{
                functionDeclarations: FUNCTION_DECLARATIONS
              }]
            }
          };
          this.ws?.send(JSON.stringify(setupMessage));
        };

        let isResolved = false;

        this.ws.onmessage = async (event) => {
          try {
            let dataStr = event.data;
            if (dataStr instanceof Blob) {
              dataStr = await dataStr.text();
            }
            const msg = JSON.parse(dataStr);

            if (msg.setupComplete) {
              console.log('Session setup complete.');
              if (this.onStatusCallback) this.onStatusCallback('Connected! Aayu is about to greet you...');
              if (!isResolved) {
                isResolved = true;
                resolve();
              }
              // Trigger the greeting - use realtimeInput.text (works with VAD active)
              setTimeout(() => {
                this.sendText("Please greet the patient warmly in Nepali to start the conversation.");
              }, 300);
            }

            // ── Tool Call Handler (TOP-LEVEL message, per Live API spec) ──────
            // msg.toolCall arrives separately from serverContent.
            // Must respond with toolResponse including the id from each call.
            if (msg.toolCall?.functionCalls?.length > 0) {
              const functionResponses: Array<{ id: string; name: string; response: Record<string, any> }> = [];

              for (const fc of msg.toolCall.functionCalls) {
                console.log(`[Tool] Called: ${fc.name}`, fc.args);
                const toolCall: ToolCall = { id: fc.id, name: fc.name, args: fc.args ?? {} };
                // Pass access token so tools can make authenticated Supabase calls
                const result = await executeTool(toolCall, this.userId, this.accessToken);
                console.log(`[Tool] Result for ${fc.name}:`, result);
                functionResponses.push({ id: fc.id, name: fc.name, response: result });
              }

              // Send all responses back in one message
              if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                  toolResponse: { functionResponses }
                }));
              }
            }

            if (msg.serverContent) {
              const content = msg.serverContent;

              // Accumulate and emit transcript chunks
              if (content.outputTranscription?.text) {
                this.transcriptAccumulator += content.outputTranscription.text;
                if (this.onMessageCallback) {
                  this.onMessageCallback(this.transcriptAccumulator, false);
                }
              }

              if (content.inputTranscription?.text && this.onInputCallback) {
                this.onInputCallback(content.inputTranscription.text);
              }

              if (content.generationComplete) {
                // Mark final transcript; reset accumulator for next turn
                if (this.transcriptAccumulator && this.onMessageCallback) {
                  this.onMessageCallback(this.transcriptAccumulator, true);
                }
                this.transcriptAccumulator = '';
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
          if (!isResolved) {
             isResolved = true;
             reject(error);
          }
          if (this.onMessageCallback) {
             this.onMessageCallback("Connection error occurred. Please try again.", true);
          }
        };

        this.ws.onclose = (event) => {
          console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
          if (!isResolved) {
             isResolved = true;
             reject(new Error(`WebSocket connection closed. Code: ${event.code}`));
          }
          if (event.code !== 1000 && this.onMessageCallback) {
             this.onMessageCallback(`Connection closed unexpectedly. Code: ${event.code}`, true);
          }
        };

      } catch (error) {
        console.error('Failed to initialize connection:', error);
        reject(error);
      }
    });
  }

  // Play PCM 24kHz little-endian
  private async playAudioChunk(pcmData: Uint8Array) {
    // Ensure AudioContext exists and is running
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
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
  private audioWorkletNode: AudioWorkletNode | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;

  public async startMicrophone() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!this.audioContext) this.initAudio();

      this.audioSource = this.audioContext!.createMediaStreamSource(this.mediaStream);
      
      const workletCode = `
        class PCMProcessor extends AudioWorkletProcessor {
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input.length > 0) {
              const channelData = input[0];
              this.port.postMessage(channelData);
            }
            return true;
          }
        }
        registerProcessor('pcm-processor', PCMProcessor);
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      await this.audioContext!.audioWorklet.addModule(url);
      
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext!, 'pcm-processor');

      let buffer: Float32Array[] = [];
      let bufferLength = 0;

      this.audioWorkletNode.port.onmessage = (e) => {
        buffer.push(e.data);
        bufferLength += e.data.length;

        if (bufferLength >= 4096) {
          const combined = new Float32Array(bufferLength);
          let offset = 0;
          for (const chunk of buffer) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }
          buffer = [];
          bufferLength = 0;

          const pcm16 = this.downsampleBuffer(combined, this.audioContext!.sampleRate, 16000);
          const uint8 = new Uint8Array(pcm16.buffer);
          let binaryString = "";
          for (let i = 0; i < uint8.byteLength; i++) {
            binaryString += String.fromCharCode(uint8[i]);
          }
          const base64Pcm = btoa(binaryString);
          this.sendAudioChunk(base64Pcm);
        }
      };

      this.audioSource.connect(this.audioWorkletNode);
      this.audioWorkletNode.connect(this.audioContext!.destination);

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

  // Send textual commands - must use realtimeInput.text (NOT clientContent) when VAD is active
  public async sendText(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      realtimeInput: { text: text }
    }));
  }

  // Send PCM audio chunk - must use realtimeInput.audio (mediaChunks is deprecated, causes 1007 close)
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
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
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
