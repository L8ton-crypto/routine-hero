import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - List routines for a family (with tasks and assignments)
export async function GET(req: NextRequest) {
  const sql = getDb();
  try {
    const familyId = req.nextUrl.searchParams.get('familyId');
    const childId = req.nextUrl.searchParams.get('childId');

    if (!familyId) {
      return NextResponse.json({ error: 'familyId required' }, { status: 400 });
    }

    let routines;
    if (childId) {
      // Get routines assigned to a specific child
      routines = await sql`
        SELECT r.id, r.name, r.type
        FROM rh_routines r
        JOIN rh_routine_assignments ra ON ra.routine_id = r.id
        WHERE r.family_id = ${parseInt(familyId)}
        AND ra.child_id = ${parseInt(childId)}
        ORDER BY r.name
      `;
    } else {
      routines = await sql`
        SELECT id, name, type
        FROM rh_routines
        WHERE family_id = ${parseInt(familyId)}
        ORDER BY name
      `;
    }

    // Fetch tasks and assignments for each routine
    const enriched = await Promise.all(routines.map(async (routine: any) => {
      const tasks = await sql`
        SELECT id, name, icon, duration, points, sort_order
        FROM rh_routine_tasks
        WHERE routine_id = ${routine.id}
        ORDER BY sort_order
      `;
      const assignments = await sql`
        SELECT child_id FROM rh_routine_assignments WHERE routine_id = ${routine.id}
      `;
      return {
        ...routine,
        tasks,
        assignedChildren: assignments.map((a: any) => a.child_id)
      };
    }));

    return NextResponse.json({ routines: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a routine with tasks and assignments
export async function POST(req: NextRequest) {
  const sql = getDb();
  try {
    const { familyId, name, type, tasks, assignedChildren } = await req.json();

    if (!familyId || !name) {
      return NextResponse.json({ error: 'familyId and name required' }, { status: 400 });
    }

    // Create routine
    const result = await sql`
      INSERT INTO rh_routines (family_id, name, type)
      VALUES (${familyId}, ${name}, ${type || 'morning'})
      RETURNING id
    `;
    const routineId = result[0].id;

    // Insert tasks
    if (tasks && tasks.length > 0) {
      for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        await sql`
          INSERT INTO rh_routine_tasks (routine_id, name, icon, duration, points, sort_order)
          VALUES (${routineId}, ${t.name}, ${t.icon || '⭐'}, ${t.duration || 5}, ${t.points || 10}, ${i})
        `;
      }
    }

    // Insert assignments
    if (assignedChildren && assignedChildren.length > 0) {
      for (const childId of assignedChildren) {
        await sql`
          INSERT INTO rh_routine_assignments (routine_id, child_id)
          VALUES (${routineId}, ${childId})
        `;
      }
    }

    return NextResponse.json({ ok: true, routineId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a routine (replaces tasks and assignments)
export async function PUT(req: NextRequest) {
  const sql = getDb();
  try {
    const { id, name, type, tasks, assignedChildren } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Routine id required' }, { status: 400 });
    }

    // Update routine
    await sql`
      UPDATE rh_routines SET
        name = COALESCE(${name}, name),
        type = COALESCE(${type}, type)
      WHERE id = ${id}
    `;

    // Replace tasks if provided
    if (tasks) {
      await sql`DELETE FROM rh_routine_tasks WHERE routine_id = ${id}`;
      for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        await sql`
          INSERT INTO rh_routine_tasks (routine_id, name, icon, duration, points, sort_order)
          VALUES (${id}, ${t.name}, ${t.icon || '⭐'}, ${t.duration || 5}, ${t.points || 10}, ${i})
        `;
      }
    }

    // Replace assignments if provided
    if (assignedChildren) {
      await sql`DELETE FROM rh_routine_assignments WHERE routine_id = ${id}`;
      for (const childId of assignedChildren) {
        await sql`
          INSERT INTO rh_routine_assignments (routine_id, child_id)
          VALUES (${id}, ${childId})
        `;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a routine
export async function DELETE(req: NextRequest) {
  const sql = getDb();
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Routine id required' }, { status: 400 });
    }

    await sql`DELETE FROM rh_routines WHERE id = ${id}`;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
