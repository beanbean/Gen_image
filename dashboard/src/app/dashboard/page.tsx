"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamManagement } from "@/components/TeamManagement";
import { WeightInput } from "@/components/WeightInput";
import { ImageGenerator } from "@/components/ImageGenerator";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [teamData, setTeamData] = useState<any>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchTeamData();
    }
  }, [session]);

  const fetchTeamData = async () => {
    const response = await fetch("/api/teams/my-team");
    if (response.ok) {
      const data = await response.json();
      setTeamData(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Đội trưởng</h1>
            <p className="text-gray-600">Xin chào, {session.user.name}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Đăng xuất
          </Button>
        </div>

        {/* Team Info */}
        {teamData && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đội</CardTitle>
              <CardDescription>
                {teamData.team.name} - {teamData.team.round}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Số thành viên: {teamData.players.length}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Team Management */}
        <TeamManagement teamData={teamData} onUpdate={fetchTeamData} />

        {/* Weight Input */}
        {teamData && teamData.players.length > 0 && (
          <WeightInput players={teamData.players} onUpdate={fetchTeamData} />
        )}

        {/* Image Generator */}
        {teamData && teamData.players.length > 0 && (
          <ImageGenerator teamId={teamData.team.id} />
        )}
      </div>
    </div>
  );
}
