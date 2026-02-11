import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  const sql = getDb();

  try {
    // Families table
    await sql`
      CREATE TABLE IF NOT EXISTS rh_families (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        pin_hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Children table
    await sql`
      CREATE TABLE IF NOT EXISTS rh_children (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES rh_families(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        age INTEGER NOT NULL DEFAULT 5,
        avatar VARCHAR(10) NOT NULL DEFAULT '🧒',
        xp INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        streak INTEGER NOT NULL DEFAULT 0,
        last_completed TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Routines table
    await sql`
      CREATE TABLE IF NOT EXISTS rh_routines (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES rh_families(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'morning',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Routine tasks table
    await sql`
      CREATE TABLE IF NOT EXISTS rh_routine_tasks (
        id SERIAL PRIMARY KEY,
        routine_id INTEGER REFERENCES rh_routines(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(10) NOT NULL DEFAULT '⭐',
        duration INTEGER NOT NULL DEFAULT 5,
        points INTEGER NOT NULL DEFAULT 10,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `;

    // Routine assignments (which children get which routines)
    await sql`
      CREATE TABLE IF NOT EXISTS rh_routine_assignments (
        routine_id INTEGER REFERENCES rh_routines(id) ON DELETE CASCADE,
        child_id INTEGER REFERENCES rh_children(id) ON DELETE CASCADE,
        PRIMARY KEY (routine_id, child_id)
      )
    `;

    // Completions table
    await sql`
      CREATE TABLE IF NOT EXISTS rh_completions (
        id SERIAL PRIMARY KEY,
        child_id INTEGER REFERENCES rh_children(id) ON DELETE CASCADE,
        routine_id INTEGER REFERENCES rh_routines(id) ON DELETE CASCADE,
        xp_earned INTEGER NOT NULL DEFAULT 0,
        completed_at TIMESTAMP DEFAULT NOW()
      )
    `;

    return NextResponse.json({ ok: true, message: 'Tables created' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
