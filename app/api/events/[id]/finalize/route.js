import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request, { params }) {
  const supabase = await createClient();
  const { id: eventId } = await params;
  
  const { error } = await supabase.from('events').update({ is_finalized: true }).eq('id', eventId);
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Event finalized and locked' });
}
