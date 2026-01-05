"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Player {
  id: string;
  name: string;
}

interface WeightInputProps {
  players: Player[];
  onUpdate: () => void;
}

export function WeightInput({ players, onUpdate }: WeightInputProps) {
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [day, setDay] = useState("0");
  const [saving, setSaving] = useState(false);

  const handleWeightChange = (playerId: string, value: string) => {
    setWeights({ ...weights, [playerId]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const entries = Object.entries(weights)
        .filter(([_, weight]) => weight && parseFloat(weight) > 0)
        .map(([playerId, weight]) => ({
          playerId,
          day: parseInt(day),
          weight: parseFloat(weight),
        }));

      if (entries.length === 0) {
        toast.error("Vui lòng nhập ít nhất 1 cân nặng");
        setSaving(false);
        return;
      }

      const response = await fetch("/api/weights/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      if (!response.ok) {
        throw new Error("Failed to save weights");
      }

      toast.success(`Đã lưu cân nặng ngày ${day} cho ${entries.length} thành viên`);
      setWeights({});
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Lưu cân nặng thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nhập cân nặng</CardTitle>
        <CardDescription>
          Nhập cân nặng hàng ngày cho các thành viên
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Day Selector */}
          <div>
            <label className="text-sm font-medium">Ngày thi</label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full border rounded-md p-2 mt-1"
            >
              {[...Array(11)].map((_, i) => (
                <option key={i} value={i}>
                  Ngày {i}
                </option>
              ))}
            </select>
          </div>

          {/* Weight Inputs */}
          <div className="space-y-3">
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-3">
                <label className="flex-1 text-sm font-medium">
                  {player.name}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={weights[player.id] || ""}
                    onChange={(e) => handleWeightChange(player.id, e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500">kg</span>
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Đang lưu..." : "Lưu cân nặng"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
