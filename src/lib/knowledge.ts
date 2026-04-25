import { GoogleGenAI } from '@google/genai';
import { supabase } from './supabase';

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
});

export async function processAndUploadPDF(file: File, userId: string): Promise<void> {
  try {
    // 1. Convert File to Base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // 2. Generate Embeddings using Gemini 2.0 Multimodal Embedding Model
    // (We prefix it with a task instruction as recommended by the docs)
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: [
        "task: classification | query: Processing hospital report for patient database",
        {
          inlineData: {
            data: base64Data,
            mimeType: 'application/pdf'
          }
        }
      ],
      config: {
        outputDimensionality: 1536 // Explicitly align with Supabase schema vector(1536)
      }
    });

    const embedding = response.embeddings[0].values;

    // 3. Store into Supabase Vector Store
    // Omitting user_id for now to avoid Foreign Key constraint error since we don't have a real logged-in user profile.
    const { error } = await supabase
      .from('health_knowledge')
      .insert({
        content: `PDF Document: ${file.name}`, 
        embedding: embedding,
        metadata: { source: file.name, type: 'pdf', uploadedAt: new Date().toISOString() }
      });

    if (error) {
      throw new Error(`Supabase Insert Error: ${error.message}`);
    }

    console.log('Successfully embedded and stored PDF:', file.name);
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
}
