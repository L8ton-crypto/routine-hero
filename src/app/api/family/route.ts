import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'HERO-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function hashPin(pin: string): string {
  // Simple hash for 4-digit PIN (not cryptographic, but fine for family app)
  let hash = 0;
  const str = pin + 'routine-hero-salt';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// POST - Create a new family
export async function POST(req: NextRequest) {
  const sql = getDb();
  try {
    const { name, pin } = await req.json();

    if (!name || !pin || pin.length !== 4) {
      return NextResponse.json({ error: 'Name and 4-digit PIN required' }, { status: 400 });
    }

    const code = generateCode();
    const pinHash = hashPin(pin);

    const result = await sql`
      INSERT INTO rh_families (name, code, pin_hash)
      VALUES (${name}, ${code}, ${pinHash})
      RETURNING id, name, code, created_at
    `;

    return NextResponse.json({ ok: true, family: result[0] });
  } catch (error: any) {
    // Retry with new code on unique constraint violation
    if (error.message?.includes('unique')) {
      const sql2 = getDb();
      try {
        const { name, pin } = await req.json();
        const code = generateCode();
        const pinHash = hashPin(pin);
        const result = await sql2`
          INSERT INTO rh_families (name, code, pin_hash)
          VALUES (${name}, ${code}, ${pinHash})
          RETURNING id, name, code, created_at
        `;
        return NextResponse.json({ ok: true, family: result[0] });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
