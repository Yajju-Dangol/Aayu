import { GoogleGenAI } from '@google/genai';
import { supabase } from './supabase';

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
});

export async function processAndUploadPDF(file: File, userId: string): Promise<void> {
  try {
    // 1. Convert File to Base64 (using robust FileReader to avoid memory leaks)
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

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

    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) throw new Error("No embedding returned");

    // 3. Store into Supabase Vector Store
    const { error } = await supabase
      .from('health_knowledge')
      .insert({
        user_id: userId,
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

export async function searchKnowledge(query: string, userId: string): Promise<string> {
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: [
        "task: retrieval_query | query: " + query
      ],
      config: {
        outputDimensionality: 1536
      }
    });

    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) return "No data found.";

    const { data, error } = await supabase.rpc('match_health_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 3,
      p_user_id: userId
    });

    if (error) {
      console.error("RPC Error:", error);
      return "Database error during search.";
    }

    if (!data || data.length === 0) {
      return "No matching medical records found.";
    }

    return data.map((d: any) => `Document Content:\n${d.content}`).join("\n\n---\n\n");
  } catch (err) {
    console.error("Search error:", err);
    return "Failed to search knowledge base.";
  }
}
