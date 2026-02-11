import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - List children for a family
export async function GET(req: NextRequest) {
  const sql = getDb();
  try {
    const familyId = req.nextUrl.searchParams.get('familyId');
    if (!familyId) {
      return NextResponse.json({ error: 'familyId required' }, { status: 400 });
    }

    const children = await sql`
      SELECT id, name, age, avatar, xp, level, streak, last_completed
      FROM rh_children
      WHERE family_id = ${parseInt(familyId)}
      ORDER BY name
    `;

    return NextResponse.json({ children });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add a child
export async function POST(req: NextRequest) {
  const sql = getDb();
  try {
    const { familyId, name, age, avatar } = await req.json();

    if (!familyId || !name) {
      return NextResponse.json({ error: 'familyId and name required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO rh_children (family_id, name, age, avatar)
      VALUES (${familyId}, ${name}, ${age || 5}, ${avatar || '🧒'})
      RETURNING id, name, age, avatar, xp, level, streak
    `;

    return NextResponse.json({ ok: true, child: result[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a child
export async function PUT(req: NextRequest) {
  const sql = getDb();
  try {
    const { id, name, age, avatar } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Child id required' }, { status: 400 });
    }

    const result = await sql`
      UPDATE rh_children
      SET name = COALESCE(${name}, name),
          age = COALESCE(${age}, age),
          avatar = COALESCE(${avatar}, avatar)
      WHERE id = ${id}
      RETURNING id, name, age, avatar, xp, level, streak
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, child: result[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a child
export async function DELETE(req: NextRequest) {
  const sql = getDb();
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Child id required' }, { status: 400 });
    }

    await sql`DELETE FROM rh_children WHERE id = ${id}`;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
