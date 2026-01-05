import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadAvatar } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const avatarFile = formData.get("avatar") as File | null;

    // Get captain's team_id
    const captainResult = await db.query(
      `SELECT team_id FROM captains WHERE username = $1`,
      [session.user.name]
    );

    if (captainResult.rows.length === 0) {
      return NextResponse.json({ error: "Captain not found" }, { status: 404 });
    }

    const teamId = captainResult.rows[0].team_id;

    // Upload avatar if provided
    let avatarUrl = null;
    if (avatarFile) {
      const tempId = `temp-${Date.now()}`;
      avatarUrl = await uploadAvatar(avatarFile, tempId);
    }

    // Add player
    const result = await db.query(
      `INSERT INTO players (team_id, name, avatar_url, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [teamId, name, avatarUrl, "member"]
    );

    return NextResponse.json({
      success: true,
      player: result.rows[0],
    });
  } catch (error: any) {
    console.error("Failed to add player:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add player" },
      { status: 500 }
    );
  }
}
