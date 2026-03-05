import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const sql = getDb();

  try {
    const { familyId, title, description, xpCost, icon } = await request.json();

    if (!familyId || !title || !xpCost) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [reward] = await sql`
      INSERT INTO rh_rewards (family_id, title, description, xp_cost, icon)
      VALUES (${familyId}, ${title}, ${description || ''}, ${xpCost}, ${icon || '🎁'})
      RETURNING *
    `;

    return NextResponse.json({ ok: true, reward });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const sql = getDb();

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Reward ID required' }, { status: 400 });
    }

    await sql`DELETE FROM rh_rewards WHERE id = ${id}`;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}