import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, max_selections } = body;

    const event = await prisma.event.create({
      data: {
        photographer_id: session.user.id,
        name,
        max_selections: parseInt(max_selections) || 50
      }
    });

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
