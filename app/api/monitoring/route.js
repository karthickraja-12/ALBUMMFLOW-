import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { level, message, details, source } = body;

    const { error } = await supabase.from('monitoring_logs').insert([
      { 
        user_id: user.id, 
        level: level || 'error', 
        message, 
        details, 
        source: source || 'client' 
      }
    ]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to save log:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
