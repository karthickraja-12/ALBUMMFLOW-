import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const count = await prisma.user.count();
    return NextResponse.json({ status: 'ok', count });
  } catch (err) {
    return NextResponse.json({ 
      status: 'error', 
      message: err.message,
      code: err.code,
      meta: err.meta
    }, { status: 500 });
  }
}
