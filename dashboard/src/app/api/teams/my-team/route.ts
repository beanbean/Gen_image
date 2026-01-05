import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get captain info
    const captainResult = await db.query(
      `SELECT team_id FROM captains WHERE username = $1`,
      [session.user.name]
    );

    if (captainResult.rows.length === 0) {
      return NextResponse.json({ error: "Captain not found" }, { status: 404 });
    }

    const teamId = captainResult.rows[0].team_id;

    // Get team info
    const teamResult = await db.query(
      `SELECT * FROM teams WHERE id = $1`,
      [teamId]
    );

    // Get players
    const playersResult = await db.query(
      `SELECT * FROM players WHERE team_id = $1 ORDER BY created_at ASC`,
      [teamId]
    );

    return NextResponse.json({
      team: teamResult.rows[0],
      players: playersResult.rows,
    });
  } catch (error: any) {
    console.error("Failed to fetch team data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch team data" },
      { status: 500 }
    );
  }
}
