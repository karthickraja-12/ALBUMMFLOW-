import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request, { params }) {
  const supabase = await createClient();
  const { id: eventId } = await params;
  const { photoId, userName } = await request.json();

  if (!userName || !photoId) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // 1. Check if event is finalized
  const { data: event } = await supabase
      .from('events')
      .select('is_finalized, max_selections')
      .eq('id', eventId)
      .single();
      
  if (event?.is_finalized) return NextResponse.json({ error: 'Album is finalized and locked' }, { status: 403 });

  // 2. See if existing selection by THIS user
  const { data: existingSelection } = await supabase
      .from('selections')
      .select('*')
      .eq('photo_id', photoId)
      .eq('user_name', userName)
      .eq('event_id', eventId)
      .maybeSingle();

  if (existingSelection) {
    // Deselect
    const { error } = await supabase.from('selections').delete().eq('id', existingSelection.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: 'deselected' });
  } else {
    // 3. Prevent going over total limit
    const { count } = await supabase.from('selections').select('*', { count: 'exact', head: true }).eq('event_id', eventId);
    if (count >= event.max_selections) return NextResponse.json({ error: 'Max limit reached' }, { status: 403 });

    // Select
    const { data: newSelection, error } = await supabase.from('selections').insert([
        { photo_id: photoId, user_name: userName, event_id: eventId }
    ]).select().single();
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: 'selected', selection: newSelection });
  }
}
