import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST - Record a routine completion
export async function POST(req: NextRequest) {
  const sql = getDb();
  try {
    const { childId, routineId } = await req.json();

    if (!childId || !routineId) {
      return NextResponse.json({ error: 'childId and routineId required' }, { status: 400 });
    }

    // Calculate XP from routine tasks
    const tasks = await sql`
      SELECT SUM(points) as total_points
      FROM rh_routine_tasks
      WHERE routine_id = ${routineId}
    `;
    const xpEarned = tasks[0]?.total_points || 0;

    // Record completion
    await sql`
      INSERT INTO rh_completions (child_id, routine_id, xp_earned)
      VALUES (${childId}, ${routineId}, ${xpEarned})
    `;

    // Check if child completed a routine today already (for streak)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const yesterdayCompletion = await sql`
      SELECT id FROM rh_completions
      WHERE child_id = ${childId}
      AND completed_at::date = ${yesterday}::date
      LIMIT 1
    `;

    // Get current child data
    const childData = await sql`
      SELECT xp, level, streak, last_completed FROM rh_children WHERE id = ${childId}
    `;

    if (childData.length === 0) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const child = childData[0];
    const newXp = child.xp + xpEarned;
    const newLevel = Math.floor(newXp / 100) + 1;

    // Calculate streak
    let newStreak = child.streak;
    const lastCompleted = child.last_completed ? new Date(child.last_completed).toISOString().split('T')[0] : null;

    if (lastCompleted === today) {
      // Already completed today, don't increment streak
    } else if (lastCompleted === yesterday || yesterdayCompletion.length > 0) {
      newStreak += 1;
    } else if (!lastCompleted) {
      newStreak = 1;
    } else {
      newStreak = 1; // Streak broken
    }

    // Update child
    const updated = await sql`
      UPDATE rh_children
      SET xp = ${newXp}, level = ${newLevel}, streak = ${newStreak}, last_completed = NOW()
      WHERE id = ${childId}
      RETURNING id, name, avatar, xp, level, streak
    `;

    return NextResponse.json({
      ok: true,
      xpEarned,
      child: updated[0],
      levelUp: newLevel > child.level
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
