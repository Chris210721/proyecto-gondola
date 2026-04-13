import supabase from 'supabase-js';

const supabaseUrl = 'https://your-project-ref.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'your-anon-key'; // Replace with your Supabase key

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;