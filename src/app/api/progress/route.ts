import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get progress stats for a family
export async function GET(req: NextRequest) {
  const sql = getDb();
  try {
    const familyId = req.nextUrl.searchParams.get('familyId');
    if (!familyId) {
      return NextResponse.json({ error: 'familyId required' }, { status: 400 });
    }

    // Get all children with stats
    const children = await sql`
      SELECT id, name, avatar, xp, level, streak, last_completed
      FROM rh_children
      WHERE family_id = ${parseInt(familyId)}
      ORDER BY xp DESC
    `;

    // Get total routines
    const routineCount = await sql`
      SELECT COUNT(*) as count FROM rh_routines WHERE family_id = ${parseInt(familyId)}
    `;

    // Get recent completions (last 7 days)
    const recent = await sql`
      SELECT c.id, c.xp_earned, c.completed_at, ch.name as child_name, ch.avatar,
             r.name as routine_name
      FROM rh_completions c
      JOIN rh_children ch ON ch.id = c.child_id
      JOIN rh_routines r ON r.id = c.routine_id
      WHERE ch.family_id = ${parseInt(familyId)}
      AND c.completed_at > NOW() - INTERVAL '7 days'
      ORDER BY c.completed_at DESC
      LIMIT 20
    `;

    // Today's completions
    const todayCompletions = await sql`
      SELECT c.child_id, c.routine_id
      FROM rh_completions c
      JOIN rh_children ch ON ch.id = c.child_id
      WHERE ch.family_id = ${parseInt(familyId)}
      AND c.completed_at::date = CURRENT_DATE
    `;

    const totalXP = children.reduce((sum: number, c: any) => sum + c.xp, 0);
    const avgLevel = children.length > 0
      ? Math.round(children.reduce((sum: number, c: any) => sum + c.level, 0) / children.length)
      : 0;
    const longestStreak = children.length > 0
      ? Math.max(...children.map((c: any) => c.streak))
      : 0;

    return NextResponse.json({
      children,
      stats: {
        totalXP,
        avgLevel,
        longestStreak,
        routineCount: parseInt(routineCount[0].count),
        todayCompletions: todayCompletions.length
      },
      recentActivity: recent
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
