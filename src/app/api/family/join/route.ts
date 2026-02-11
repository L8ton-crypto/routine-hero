import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST - Join a family with code
export async function POST(req: NextRequest) {
  const sql = getDb();
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Family code required' }, { status: 400 });
    }

    const result = await sql`
      SELECT id, name, code FROM rh_families WHERE code = ${code.toUpperCase()}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Get children for this family
    const children = await sql`
      SELECT id, name, age, avatar, xp, level, streak
      FROM rh_children
      WHERE family_id = ${result[0].id}
      ORDER BY name
    `;

    return NextResponse.json({ ok: true, family: result[0], children });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
