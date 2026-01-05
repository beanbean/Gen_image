import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get stats từ execution_logs
    const statsResult = await db.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM execution_logs
      GROUP BY status
    `);

    const stats = {
      pending: 0,
      running: 0,
      success: 0,
      error: 0,
    };

    statsResult.rows.forEach((row: any) => {
      const status = row.status as keyof typeof stats;
      if (status in stats) {
        stats[status] = parseInt(row.count, 10);
      }
    });

    // Get latest queue items từ bot_queue
    const queueResult = await db.query(`
      SELECT
        id,
        bot_type,
        status,
        player_name,
        team_id,
        created_at
      FROM bot_queue
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return NextResponse.json({
      stats,
      queue: queueResult.rows,
    });
  } catch (error: any) {
    console.error('Queue API error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch queue data',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
