/**
 * tools.ts — Centralized Gemini Function Calling Registry
 *
 * HOW TO ADD A NEW TOOL:
 * 1. Add a FunctionDeclaration object to FUNCTION_DECLARATIONS
 * 2. Add a case in executeTool() switch statement
 * 3. Write the handler function below
 * That's it. InterviewerAgent picks up all tools automatically.
 */

import { createAgentSupabase } from './supabase';
import { searchKnowledge } from './knowledge';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'OBJECT';
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
}

// ─── Function Declarations (sent to Gemini at session start) ─────────────────

export const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'searchHealthKnowledge',
    description:
      "Search the patient's uploaded medical records, PDFs, and health knowledge base for specific information.",
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'The medical question or search topic.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'logBloodPressure',
    description:
      "Log the patient's blood pressure reading when they mention it during the conversation.",
    parameters: {
      type: 'OBJECT',
      properties: {
        systolic:  { type: 'NUMBER', description: 'Systolic pressure (top number), e.g. 120' },
        diastolic: { type: 'NUMBER', description: 'Diastolic pressure (bottom number), e.g. 80' },
        notes:     { type: 'STRING', description: 'Optional notes about the reading.' },
      },
      required: ['systolic', 'diastolic'],
    },
  },
  {
    name: 'logMedicineTaken',
    description: "Record whether the patient has taken their medicine today.",
    parameters: {
      type: 'OBJECT',
      properties: {
        medicine_name: { type: 'STRING',  description: 'Name of the medicine. Default: Daily medicine.' },
        taken:         { type: 'BOOLEAN', description: 'true if taken, false if skipped.' },
        notes:         { type: 'STRING',  description: 'Any additional notes from the patient.' },
      },
      required: ['taken'],
    },
  },
  {
    name: 'logMoodAndWellness',
    description:
      "Log the patient's current mood and wellness level based on what they describe.",
    parameters: {
      type: 'OBJECT',
      properties: {
        mood:         { type: 'STRING', description: "Patient mood: 'excellent', 'good', 'neutral', or 'bad'." },
        energy_level: { type: 'NUMBER', description: 'Energy level from 1 (exhausted) to 10 (energetic).' },
        notes:        { type: 'STRING', description: "Patient's own words about how they feel." },
      },
      required: ['mood'],
    },
  },
  {
    name: 'logSymptom',
    description: "Log a specific symptom or complaint mentioned by the patient.",
    parameters: {
      type: 'OBJECT',
      properties: {
        symptom:   { type: 'STRING', description: 'Name of the symptom, e.g. headache, dizziness, chest pain.' },
        severity:  { type: 'NUMBER', description: 'Severity from 1 (mild) to 10 (severe).' },
        duration:  { type: 'STRING', description: 'How long the symptom has been present, e.g. "2 days".' },
        notes:     { type: 'STRING', description: 'Additional context from the patient.' },
      },
      required: ['symptom'],
    },
  },
  {
    name: 'logDietaryInfo',
    description: "Log the patient's daily food intake, portion sizes, and appetite.",
    parameters: {
      type: 'OBJECT',
      properties: {
        meal_composition: { type: 'STRING', description: 'What did they eat for their meals?' },
        portion_size: { type: 'STRING', description: 'Did they finish the whole plate or just half?' },
        appetite_levels: { type: 'STRING', description: 'Are they feeling hungry or forced to eat?' },
      },
      required: ['meal_composition', 'portion_size', 'appetite_levels'],
    },
  },
  {
    name: 'logHydrationStatus',
    description: "Log the patient's hydration for the day.",
    parameters: {
      type: 'OBJECT',
      properties: {
        hydration: { type: 'STRING', description: 'How many glasses of water or tea have they had?' },
      },
      required: ['hydration'],
    },
  },
  {
    name: 'logSleepAndEnergy',
    description: "Log the patient's sleep quality and energy levels.",
    parameters: {
      type: 'OBJECT',
      properties: {
        sleep_quality: { type: 'STRING', description: 'Wake up frequency, do they feel rested?' },
        energy_levels: { type: 'STRING', description: 'Energy level on a scale of 1 to 5.' },
      },
      required: ['sleep_quality', 'energy_levels'],
    },
  },
  {
    name: 'logSocialInteraction',
    description: "Log the patient's social interactions for the day.",
    parameters: {
      type: 'OBJECT',
      properties: {
        social_interaction: { type: 'STRING', description: 'Who did they talk to today?' },
      },
      required: ['social_interaction'],
    },
  },
];

// ─── Tool Dispatcher ──────────────────────────────────────────────────────────

/**
 * Execute a single tool call and return the response object.
 * Add new tools by adding a case here and a handler function below.
 */
export async function executeTool(
  toolCall: ToolCall,
  userId: string,
  accessToken?: string
): Promise<Record<string, any>> {
  console.log(`[Tool] ▶ ${toolCall.name}`, toolCall.args);

  const agentSupabase = createAgentSupabase(accessToken || '');
  const { error: logError } = await agentSupabase.from('health_logs').insert({
    user_id: userId,
    log_type: 'agent_action',
    data: { action: toolCall.name, args: toolCall.args },
    logged_at: new Date().toISOString()
  });
  if (logError) {
    console.error("Failed to log agent action", logError);
  }



  try {
    switch (toolCall.name) {
      case 'searchHealthKnowledge':
        return await handleSearchKnowledge(toolCall.args.query, userId, accessToken || '');

      case 'logBloodPressure':
        return await handleLogBloodPressure(toolCall.args, userId, accessToken || '');

      case 'logMedicineTaken':
        return await handleLogMedicine(toolCall.args, userId, accessToken || '');

      case 'logMoodAndWellness':
        return await handleLogMood(toolCall.args, userId, accessToken || '');

      case 'logSymptom':
        return await handleLogSymptom(toolCall.args, userId, accessToken || '');

      case 'logDietaryInfo':
        return await handleLogDietaryInfo(toolCall.args, userId, accessToken || '');

      case 'logHydrationStatus':
        return await handleLogHydrationStatus(toolCall.args, userId, accessToken || '');

      case 'logSleepAndEnergy':
        return await handleLogSleepAndEnergy(toolCall.args, userId, accessToken || '');

      case 'logSocialInteraction':
        return await handleLogSocialInteraction(toolCall.args, userId, accessToken || '');

      default:
        return { result: `Unknown tool: ${toolCall.name}` };
    }
  } catch (err: any) {
    console.error(`[Tool] ✗ Error in ${toolCall.name}:`, err);
    return { result: `Error: ${err.message || 'Unknown error'}` };
  }
}

// ─── Helper: timeout wrapper for Supabase calls ─────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms = 10000, label = 'operation'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ─── Individual Tool Handlers ─────────────────────────────────────────────────

async function handleSearchKnowledge(query: string, userId: string, accessToken: string): Promise<Record<string, any>> {
  // Use the robust vector search function from knowledge.ts
  const resultText = await withTimeout(
    searchKnowledge(query, userId, accessToken),
    10000, 'searchKnowledge'
  );

  return { result: resultText };
}

async function handleLogBloodPressure(args: any, userId: string, accessToken: string): Promise<Record<string, any>> {
  const agentSupabase = createAgentSupabase(accessToken);
  const { error } = await withTimeout(
    agentSupabase.from('health_logs').insert({
      user_id:   userId,
      log_type:  'blood_pressure',
      data:      { systolic: args.systolic, diastolic: args.diastolic, notes: args.notes ?? '' },
      logged_at: new Date().toISOString(),
    }),
    10000, 'logBloodPressure'
  );

  if (error) {
    console.error('[Tool] logBloodPressure Supabase error:', error.message, error.details, error.hint);
    return { result: `Could not save blood pressure: ${error.message}` };
  }
  return { result: `Blood pressure ${args.systolic}/${args.diastolic} mmHg logged successfully.` };
}

async function handleLogMedicine(args: any, userId: string, accessToken: string): Promise<Record<string, any>> {
  const agentSupabase = createAgentSupabase(accessToken);
  const { error } = await withTimeout(
    agentSupabase.from('health_logs').insert({
      user_id:   userId,
      log_type:  'medicine',
      data:      { medicine_name: args.medicine_name ?? 'Daily medicine', taken: args.taken, notes: args.notes ?? '' },
      logged_at: new Date().toISOString(),
    }),
    10000, 'logMedicine'
  );

  if (error) {
    console.error('[Tool] logMedicine Supabase error:', error.message, error.details, error.hint);
    return { result: `Could not save medicine log: ${error.message}` };
  }
  return { result: args.taken ? 'Medicine intake recorded.' : 'Missed medicine noted.' };
}

async function handleLogMood(args: any, userId: string, accessToken: string): Promise<Record<string, any>> {
  const agentSupabase = createAgentSupabase(accessToken);
  const { error } = await withTimeout(
    agentSupabase.from('health_logs').insert({
      user_id:   userId,
      log_type:  'mood',
      data:      { mood: args.mood, energy_level: args.energy_level ?? null, notes: args.notes ?? '' },
      logged_at: new Date().toISOString(),
    }),
    10000, 'logMood'
  );

  if (error) {
    console.error('[Tool] logMood Supabase error:', error.message, error.details, error.hint);
    return { result: `Could not save mood: ${error.message}` };
  }
  return { result: `Mood "${args.mood}" logged successfully.` };
}

async function handleLogSymptom(args: any, userId: string, accessToken: string): Promise<Record<string, any>> {
  const agentSupabase = createAgentSupabase(accessToken);
  const { error } = await withTimeout(
    agentSupabase.from('health_logs').insert({
      user_id:   userId,
      log_type:  'symptom',
      data:      { symptom: args.symptom, severity: args.severity ?? null, duration: args.duration ?? null, notes: args.notes ?? '' },
      logged_at: new Date().toISOString(),
    }),
    10000, 'logSymptom'
  );

  if (error) {
    console.error('[Tool] logSymptom Supabase error:', error.message, error.details, error.hint);
    return { result: `Could not save symptom: ${error.message}` };
  }
  return { result: `Symptom "${args.symptom}" logged successfully.` };
}

async function handleLogDietaryInfo(args: any, userId: string, accessToken: string): Promise<Record<string, any>> {
  const agentSupabase = createAgentSupabase(accessToken);
  const { error } = await withTimeout(
    agentSupabase.from('health_logs').insert({
      user_id:   userId,
      log_type:  'dietary_info',
      data:      args,
      logged_at: new Date().toISOString(),
    }),
    10000, 'logDietaryInfo'
  );
  if (error) return { result: `Error: ${error.message}` };
  return { result: `Dietary info logged successfully.` };
}

async function handleLogHydrationStatus(args: any, userId: string, accessToken: string): Promise<Record<string, any>> {
  const agentSupabase = createAgentSupabase(accessToken);
  const { error } = await withTimeout(
    agentSupabase.from('health_logs').insert({
      user_id:   userId,
      log_type:  'hydration_status',
      data:      args,
      logged_at: new Date().toISOString(),
    }),
    10000, 'logHydrationStatus'
  );
  if (error) return { result: `Error: ${error.message}` };
  return { result: `Hydration status logged successfully.` };
}

async function handleLogSleepAndEnergy(args: any, userId: string, accessToken: string): Promise<Record<string, any>> {
  const agentSupabase = createAgentSupabase(accessToken);
  const { error } = await withTimeout(
    agentSupabase.from('health_logs').insert({
      user_id:   userId,
      log_type:  'sleep_and_energy',
      data:      args,
      logged_at: new Date().toISOString(),
    }),
    10000, 'logSleepAndEnergy'
  );
  if (error) return { result: `Error: ${error.message}` };
  return { result: `Sleep and energy logged successfully.` };
}

async function handleLogSocialInteraction(args: any, userId: string, accessToken: string): Promise<Record<string, any>> {
  const agentSupabase = createAgentSupabase(accessToken);
  const { error } = await withTimeout(
    agentSupabase.from('health_logs').insert({
      user_id:   userId,
      log_type:  'social_interaction',
      data:      args,
      logged_at: new Date().toISOString(),
    }),
    10000, 'logSocialInteraction'
  );
  if (error) return { result: `Error: ${error.message}` };
  return { result: `Social interaction logged successfully.` };
}
