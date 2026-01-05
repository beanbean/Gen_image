import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { entries } = await request.json();

    // Get captain ID
    const captainResult = await db.query(
      `SELECT id FROM captains WHERE username = $1`,
      [session.user.name]
    );

    if (captainResult.rows.length === 0) {
      return NextResponse.json({ error: "Captain not found" }, { status: 404 });
    }

    const captainId = captainResult.rows[0].id;

    // Insert all weight entries
    const promises = entries.map((entry: any) =>
      db.query(
        `INSERT INTO daily_weights (player_id, day, weight, recorded_by)
         VALUES ($1, $2, $3, $4)`,
        [entry.playerId, entry.day, entry.weight, captainId]
      )
    );

    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      count: entries.length,
    });
  } catch (error: any) {
    console.error("Failed to save weights:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save weights" },
      { status: 500 }
    );
  }
}
