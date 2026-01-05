import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { username, teamName, zaloId } = await request.json();

    // Create team
    const teamResult = await db.query(
      `INSERT INTO teams (name, round) VALUES ($1, $2) RETURNING id`,
      [teamName, "Vòng 1"]
    );

    const teamId = teamResult.rows[0].id;

    // Get user from Better Auth (they just registered)
    // For now, we'll create captain record separately
    // Better Auth will handle user table, we manage captains table

    await db.query(
      `INSERT INTO captains (username, zalo_id, team_id, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [username, zaloId || null, teamId, "managed_by_better_auth"]
    );

    return NextResponse.json({
      success: true,
      teamId,
    });
  } catch (error: any) {
    console.error("Failed to register team:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
