"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    teamName: "",
    zaloId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Register user with Better Auth
      await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.username,
      });

      // Create team and captain in database
      const response = await fetch("/api/teams/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          teamName: formData.teamName,
          zaloId: formData.zaloId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create team");
      }

      toast.success("Đăng ký thành công! Đang chuyển đến trang đăng nhập...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (error: any) {
      toast.error(error.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Đăng ký Đội trưởng</CardTitle>
          <CardDescription>
            Tạo tài khoản và đăng ký đội thi Marathon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tên đăng nhập</label>
              <Input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="captain_alpha"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="captain@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Mật khẩu</label>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tên đội</label>
              <Input
                type="text"
                required
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                placeholder="Đội Alpha"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Zalo ID (tùy chọn)</label>
              <Input
                type="text"
                value={formData.zaloId}
                onChange={(e) => setFormData({ ...formData, zaloId: e.target.value })}
                placeholder="0123456789"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </Button>

            <p className="text-sm text-center text-gray-600">
              Đã có tài khoản?{" "}
              <a href="/login" className="text-blue-600 hover:underline">
                Đăng nhập
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
