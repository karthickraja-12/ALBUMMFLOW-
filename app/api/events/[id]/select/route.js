import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  const { id: eventId } = await params;
  const { photoId, userName } = await request.json();

  if (!userName || !photoId) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    // 1. Check if event exists and if it is finalized
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { is_finalized: true, max_selections: true }
    });

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (event.is_finalized) return NextResponse.json({ error: 'Album is finalized and locked' }, { status: 403 });

    // 2. See if existing selection by THIS user
    const existingSelection = await prisma.selection.findFirst({
      where: {
        photo_id: photoId,
        user_name: userName,
        event_id: eventId
      }
    });

    if (existingSelection) {
      // 3. Deselect
      await prisma.selection.delete({
        where: { id: existingSelection.id }
      });
      return NextResponse.json({ action: 'deselected' });
    } else {
      // 4. Prevent going over total limit (optional: limit PER GUEST or total?)
      // Current behavior matches original: TOTAL selections for the event
      const count = await prisma.selection.count({
        where: { event_id: eventId }
      });

      if (count >= event.max_selections) {
        return NextResponse.json({ error: 'Max limit reached' }, { status: 403 });
      }

      // 5. Select
      const newSelection = await prisma.selection.create({
        data: {
          photo_id: photoId,
          user_name: userName,
          event_id: eventId
        }
      });

      return NextResponse.json({ action: 'selected', selection: newSelection });
    }
  } catch (error) {
    console.error("Selection API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
