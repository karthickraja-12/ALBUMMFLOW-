import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  const supabase = await createClient();
  const { id } = await params;

  // 1. Fetch Event first (Simple, no joins)
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (eventError || !event) {
    console.error("Event Fetch Error:", eventError);
    return NextResponse.json({ error: eventError?.message || "Event not found" }, { status: 404 });
  }

  // 2. Fetch Photographer Profile (Separate query is more reliable)
  // We check both photographer_id and user_id just in case
  const userId = event.photographer_id || event.user_id;
  const { data: photographer } = await supabase
    .from('profiles')
    .select('company_name, logo_url, brand_color')
    .eq('id', userId)
    .single();

  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', id);

  const { data: selections } = await supabase
    .from('selections')
    .select('*')
    .eq('event_id', id);
    
  return NextResponse.json({ 
    event, 
    photos: photos || [], 
    selections: selections || [],
    photographer: photographer || null
  });
}

export async function DELETE(request, { params }) {
  const supabase = await createClient();
  const { id } = await params;

  // 1. Fetch all photos for this event to get their paths
  const { data: photos } = await supabase.from('photos').select('url').eq('event_id', id);

  if (photos && photos.length > 0) {
    // Collect specific file paths if needed, or simply delete the folder
    // Our paths are structured as "events/[eventId]/..."
    const folderPath = `events/${id}`;
    
    // List all files in the event folder
    const { data: files } = await supabase.storage.from('albumflow').list(folderPath);
    
    if (files && files.length > 0) {
      const pathsToDelete = files.map(f => `${folderPath}/${f.name}`);
      await supabase.storage.from('albumflow').remove(pathsToDelete);
      console.log(`Purged ${pathsToDelete.length} files from storage for event ${id}`);
    }
  }

  // 2. Delete database records (Cascade should handle photos/selections if configured, but let's be safe)
  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
