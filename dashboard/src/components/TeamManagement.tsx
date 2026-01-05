"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Player {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

interface TeamManagementProps {
  teamData: any;
  onUpdate: () => void;
}

export function TeamManagement({ teamData, onUpdate }: TeamManagementProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("name", playerName);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      // Add player via API (handles avatar upload server-side)
      const response = await fetch("/api/players/add", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to add player");
      }

      toast.success(`Đã thêm thành viên: ${playerName}`);
      setPlayerName("");
      setAvatarFile(null);
      setIsAdding(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Thêm thành viên thất bại");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Quản lý đội</CardTitle>
            <CardDescription>Thêm và quản lý thành viên trong đội</CardDescription>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? "Hủy" : "+ Thêm thành viên"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Player Form */}
        {isAdding && (
          <form onSubmit={handleAddPlayer} className="border rounded-lg p-4 space-y-3 bg-gray-50">
            <div>
              <label className="text-sm font-medium">Tên thành viên</label>
              <Input
                type="text"
                required
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Avatar (200x200px)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Ảnh sẽ tự động resize về 200x200px
              </p>
            </div>

            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? "Đang upload..." : "Thêm thành viên"}
            </Button>
          </form>
        )}

        {/* Players List */}
        {teamData && teamData.players.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamData.players.map((player: Player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 border rounded-lg p-3 bg-white"
              >
                {player.avatar_url ? (
                  <img
                    src={player.avatar_url}
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">No Avatar</span>
                  </div>
                )}
                <div>
                  <p className="font-medium">{player.name}</p>
                  <p className="text-xs text-gray-500">
                    {player.role === "captain" ? "Đội trưởng" : "Thành viên"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            Chưa có thành viên nào. Nhấn &quot;Thêm thành viên&quot; để bắt đầu.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
