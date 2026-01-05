"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface ImageGeneratorProps {
  teamId: string;
}

const IMAGE_TYPES = [
  {
    id: "player_progress",
    name: "Ảnh Player Progress",
    description: "Ảnh tiến độ cá nhân cho từng thành viên",
    workflowId: "nxdj3XeZAA4WscYp",
  },
  {
    id: "team_leaderboard",
    name: "Ảnh Team Leaderboard",
    description: "Bảng xếp hạng đội",
    workflowId: "9fD7jTNV9LbMYGJu",
  },
];

export function ImageGenerator({ teamId }: ImageGeneratorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const handleToggle = (imageType: string) => {
    setSelected((prev) =>
      prev.includes(imageType)
        ? prev.filter((t) => t !== imageType)
        : [...prev, imageType]
    );
  };

  const handleGenerate = async () => {
    if (selected.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 loại ảnh");
      return;
    }

    setGenerating(true);

    try {
      const promises = selected.map((imageType) => {
        const workflow = IMAGE_TYPES.find((t) => t.id === imageType);
        if (!workflow) return Promise.resolve();

        return fetch("/api/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflowId: workflow.workflowId,
            data: { teamId },
          }),
        });
      });

      await Promise.all(promises);

      toast.success(`Đã tạo ${selected.length} workflow! Hình ảnh sẽ được gửi qua Zalo.`);
      setSelected([]);
    } catch (error: any) {
      toast.error(error.message || "Tạo ảnh thất bại");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo và gửi hình ảnh</CardTitle>
        <CardDescription>
          Chọn loại hình ảnh muốn tạo và gửi qua Zalo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Type Selection */}
        <div className="space-y-3">
          {IMAGE_TYPES.map((imageType) => (
            <div
              key={imageType.id}
              className="flex items-start gap-3 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleToggle(imageType.id)}
            >
              <Checkbox
                checked={selected.includes(imageType.id)}
                onCheckedChange={() => handleToggle(imageType.id)}
              />
              <div className="flex-1">
                <p className="font-medium">{imageType.name}</p>
                <p className="text-sm text-gray-600">{imageType.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={generating || selected.length === 0}
          className="w-full"
          size="lg"
        >
          {generating
            ? "Đang tạo ảnh..."
            : `Tạo và gửi ${selected.length > 0 ? `(${selected.length})` : ""}`}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Hình ảnh sẽ được tạo và tự động gửi đến Zalo đã đăng ký
        </p>
      </CardContent>
    </Card>
  );
}
