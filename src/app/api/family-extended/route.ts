import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const sql = getDb();
  const familyId = req.nextUrl.searchParams.get('familyId');

  if (!familyId) {
    return NextResponse.json({ error: 'familyId required' }, { status: 400 });
  }

  try {
    // Get badges for all children in family
    const badges = await sql`
      SELECT b.*, c.name as child_name, c.avatar as child_avatar
      FROM rh_badges b
      JOIN rh_children c ON c.id = b.child_id
      WHERE c.family_id = ${familyId}
      ORDER BY b.earned_at DESC
    `;

    // Get rewards for family
    const rewards = await sql`
      SELECT * FROM rh_rewards
      WHERE family_id = ${familyId}
      ORDER BY created_at DESC
    `;

    // Get reward claims for family
    const rewardClaims = await sql`
      SELECT rc.*, r.title as reward_title, r.icon as reward_icon, c.name as child_name, c.avatar as child_avatar
      FROM rh_reward_claims rc
      JOIN rh_rewards r ON r.id = rc.reward_id
      JOIN rh_children c ON c.id = rc.child_id
      WHERE r.family_id = ${familyId}
      ORDER BY rc.claimed_at DESC
    `;

    return NextResponse.json({ 
      ok: true, 
      badges,
      rewards,
      rewardClaims
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}