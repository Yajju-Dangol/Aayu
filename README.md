<p align="center">
  <img src="https://aaayu.netlify.app/aayu-logo.svg" alt="Aayu Logo" width="120" height="120" />
</p>

# Aayu - Simple AI Health Helper

**Aayu** is a voice AI that helps elderly people in Nepal manage their health through simple conversations in Nepali. [1](#4-0) 

## What It Does

- **Talks in Nepali** - Uses respectful language like "Hajur/Tapai" [2](#4-1) 
- **Tracks Health** - Records meals, medicine, sleep, and more through voice
- **Sends Alerts** - Notifies family if health problems are detected
- **Shows Reports** - Simple charts and health insights for family members

## How It Works

1. **Voice Chat** - Elderly users press one button and talk to Aayu
2. **AI Listens** - Gemini AI understands and responds in Nepali [3](#4-2) 
3. **Data Saved** - Health information stored securely in database
4. **Family Sees** - Caretakers can view health data on dashboard

## Main Features

- **9 Health Areas Tracked**: food, water, medicine, sleep, energy, mood, symptoms, blood pressure, social time [4](#4-3) 
- **Two Views**: Simple big buttons for elderly, detailed dashboard for family
- **Medical Records**: Upload hospital PDFs for personalized care

## Quick Start

```bash
# Install
npm install

# Setup environment
VITE_GEMINI_API_KEY=your_key
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

# Run
npm run dev
```

## Technology

- **Google Gemini** - Voice AI and smart analysis [5](#4-4) 
- **Supabase** - Database and real-time updates [6](#4-5) 
- **React** - Simple, easy-to-use interface [7](#4-6) 

## Notes

Aayu helps elderly Nepali speakers stay healthy and connected with family through natural voice conversations. The system is designed to be simple, respectful, and culturally appropriate. [8](#4-7) 

Wiki pages you might want to explore:
- [Aayu — Project Overview (Yajju-Dangol/Aayu)](/wiki/Yajju-Dangol/Aayu#1)

### Citations

**File:** src/LandingPage.tsx (L78-80)
```typescript
            Project Aayu (Sanskrit for "Life") is designed to help elderly people manage their health, 
            medicine, and diet through the most natural interface: their voice.
          </motion.p>
```

**File:** src/App.tsx (L1-17)
```typescript
import { useState, useRef, useEffect } from 'react';
import {
  Home, Activity, User,
  Mic, Bot, X, Upload,
  Coffee, Utensils, Droplets, Battery, Pill, Stethoscope, Moon, Users, TrendingUp, Menu
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { processAndUploadPDF } from './lib/knowledge';
import { InterviewerAgent } from './lib/InterviewerAgent';
import { supabase } from './lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import LandingPage from './LandingPage';

// --- DATA ---

export default function App() {
```

**File:** src/App.tsx (L115-157)
```typescript
    const channel = supabase.channel('agent_logs_changes')
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'health_logs', 
          filter: `user_id=eq.${user.id}` 
       }, (payload) => {
          setAgentLogs(prev => [payload.new, ...prev]);
      })
      .subscribe();

    // Fetch initial analytics using raw fetch
    fetch(`${supabaseUrl}/rest/v1/health_metrics?select=*&user_id=eq.${user.id}&metric_type=eq.session_analysis&order=recorded_at.desc&limit=1`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(async res => {
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data) && data.length > 0 && data[0].details) {
        setAnalyticsData(data[0].details);
      }
    })
    .catch(err => console.error('[Analytics] Error fetching initial analytics:', err));

    // Subscribe to new analytics
    const analyticsChannel = supabase.channel('analytics_changes')
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'health_metrics', 
          filter: `user_id=eq.${user.id}` 
       }, (payload) => {
          if (payload.new.metric_type === 'session_analysis' && payload.new.details) {
             setAnalyticsData(payload.new.details);
          }
      })
      .subscribe();
```

**File:** src/App.tsx (L316-325)
```typescript
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      });
```
