import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const sql = getDb();

  try {
    const { rewardId, childId } = await request.json();

    if (!rewardId || !childId) {
      return NextResponse.json({ error: 'Reward ID and child ID required' }, { status: 400 });
    }

    // Get reward details and child's current XP
    const [reward] = await sql`SELECT * FROM rh_rewards WHERE id = ${rewardId}`;
    const [child] = await sql`SELECT * FROM rh_children WHERE id = ${childId}`;

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    if (child.xp < reward.xp_cost) {
      return NextResponse.json({ error: 'Not enough XP' }, { status: 400 });
    }

    // Deduct XP from child
    const newXP = child.xp - reward.xp_cost;
    await sql`UPDATE rh_children SET xp = ${newXP} WHERE id = ${childId}`;

    // Create reward claim
    const [claim] = await sql`
      INSERT INTO rh_reward_claims (reward_id, child_id)
      VALUES (${rewardId}, ${childId})
      RETURNING *
    `;

    return NextResponse.json({ ok: true, claim, newXP });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}