
import { createClient } from '@supabase/supabase-js';

// INSTRUCTIONS:
// 1. Create a project at https://supabase.com
// 2. Get your URL and ANON KEY from Project Settings > API
// 3. Add them to your .env file as VITE_SUPABASE_URL and VITE_SUPABASE_KEY

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'your-anon-key';

// This client will be used to talk to the real database
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

