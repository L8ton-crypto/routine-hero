import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function hashPin(pin: string): string {
  let hash = 0;
  const str = pin + 'routine-hero-salt';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// POST - Verify parent PIN
export async function POST(req: NextRequest) {
  const sql = getDb();
  try {
    const { familyId, pin } = await req.json();

    if (!familyId || !pin) {
      return NextResponse.json({ error: 'Family ID and PIN required' }, { status: 400 });
    }

    const pinHash = hashPin(pin);
    const result = await sql`
      SELECT id FROM rh_families WHERE id = ${familyId} AND pin_hash = ${pinHash}
    `;

    if (result.length === 0) {
      return NextResponse.json({ ok: false, error: 'Incorrect PIN' }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
