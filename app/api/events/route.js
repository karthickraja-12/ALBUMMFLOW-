import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { eventSchema } from '@/lib/validations';

export async function GET(request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const events = await prisma.event.findMany({
      where: { photographer_id: session.user.id },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('[GET /api/events] Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while fetching events.' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = eventSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, max_selections } = parsed.data;

    const event = await prisma.event.create({
      data: {
        photographer_id: session.user.id,
        name,
        max_selections
      }
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('[POST /api/events] Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while creating the event.' }, { status: 500 });
  }
}
