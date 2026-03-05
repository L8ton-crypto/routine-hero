import { getDb } from './db';
import { BADGE_DEFINITIONS } from './types';

export async function checkAndAwardBadges(childId: number) {
  const sql = getDb();
  
  try {
    // Get child data
    const [child] = await sql`SELECT * FROM rh_children WHERE id = ${childId}`;
    if (!child) return [];

    // Get current badges
    const currentBadges = await sql`SELECT badge_type FROM rh_badges WHERE child_id = ${childId}`;
    const badgeTypes = currentBadges.map(b => b.badge_type);
    
    // Get completion data
    const today = new Date().toISOString().split('T')[0];
    const totalCompletions = await sql`
      SELECT COUNT(*) as count FROM rh_completions WHERE child_id = ${childId}
    `;
    const todayCompletions = await sql`
      SELECT COUNT(*) as count FROM rh_completions 
      WHERE child_id = ${childId} AND completed_at::date = ${today}::date
    `;

    const newBadges = [];

    // first_quest: Complete 1 routine
    if (!badgeTypes.includes('first_quest') && totalCompletions[0].count >= 1) {
      newBadges.push('first_quest');
    }

    // helper: Complete 10 routines
    if (!badgeTypes.includes('helper') && totalCompletions[0].count >= 10) {
      newBadges.push('helper');
    }

    // quest_master: Complete 50 routines
    if (!badgeTypes.includes('quest_master') && totalCompletions[0].count >= 50) {
      newBadges.push('quest_master');
    }

    // speed_runner: Complete 5 routines in one day
    if (!badgeTypes.includes('speed_runner') && todayCompletions[0].count >= 5) {
      newBadges.push('speed_runner');
    }

    // hot_streak: 3-day streak
    if (!badgeTypes.includes('hot_streak') && child.streak >= 3) {
      newBadges.push('hot_streak');
    }

    // level_5: Reach level 5
    if (!badgeTypes.includes('level_5') && child.level >= 5) {
      newBadges.push('level_5');
    }

    // champion: Reach level 10
    if (!badgeTypes.includes('champion') && child.level >= 10) {
      newBadges.push('champion');
    }

    // Insert new badges
    for (const badgeType of newBadges) {
      await sql`
        INSERT INTO rh_badges (child_id, badge_type)
        VALUES (${childId}, ${badgeType})
      `;
    }

    // Check collector badge (earn all other badges)
    if (!badgeTypes.includes('collector') && !newBadges.includes('collector')) {
      const updatedBadges = await sql`SELECT badge_type FROM rh_badges WHERE child_id = ${childId}`;
      const allBadgeTypes = updatedBadges.map(b => b.badge_type);
      const otherBadges = Object.keys(BADGE_DEFINITIONS).filter(b => b !== 'collector');
      
      if (otherBadges.every(badge => allBadgeTypes.includes(badge))) {
        await sql`
          INSERT INTO rh_badges (child_id, badge_type)
          VALUES (${childId}, 'collector')
        `;
        newBadges.push('collector');
      }
    }

    return newBadges.map(type => ({
      icon: BADGE_DEFINITIONS[type].icon,
      name: BADGE_DEFINITIONS[type].name,
    }));
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
}