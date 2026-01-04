# Gen Image - n8n Workflow Project

Dự án n8n workflows tự động tạo ảnh bảng xếp hạng và tiến độ cho các đội thi.

## 🎯 Mô tả

Hệ thống tự động render và gửi ảnh:
- **Bảng xếp hạng đội** (Team Leaderboard)
- **Tiến độ cá nhân** (Player Progress)
- **Gửi qua Zalo** cho đội trưởng

## 📁 Cấu trúc

```
.
├── workflows/
│   ├── Render_team_leaderboard.json      # Workflow render bảng xếp hạng đội
│   ├── Render_image_progress_player.json # Workflow render tiến độ cá nhân
│   └── send_image_zalo_captain.json      # Workflow gửi ảnh qua Zalo
├── docs/                                  # Tài liệu dự án
├── .claude/                              # Claude Code configuration
└── *.md                                  # Debug & verification docs
```

## 🚀 Tính năng

### Render Team Leaderboard
- Nhóm người chơi theo đội
- Tính toán điểm giảm cân theo ngày/tổng
- Xếp hạng top 8 thành viên xuất sắc
- Đếm số "sao" (daily loss ≥ 1.0kg)
- Thêm thông tin đội trưởng vào cuối bảng

### Render Player Progress
- Hiển thị tiến độ cá nhân
- Biểu đồ thể hiện kết quả theo ngày
- Tính toán daily/total loss

### Send to Zalo
- Tự động gửi ảnh đến đội trưởng
- Kèm text report

## 🛠 Công nghệ

- **n8n**: Workflow automation platform
- **Node.js**: JavaScript runtime cho các code nodes
- **Zalo API**: Gửi ảnh và tin nhắn

## 📊 Debug & Monitoring

Xem các tài liệu debug:
- [URGENT-crash-report.md](URGENT-crash-report.md)
- [FIX-RPC-UPDATE-STATUS.md](FIX-RPC-UPDATE-STATUS.md)
- [GUIDE-schedule-trigger-setup.md](GUIDE-schedule-trigger-setup.md)
- [VPS-DEBUG-GUIDE.md](VPS-DEBUG-GUIDE.md)

## 📝 Scripts

- `check-vps-resources.sh`: Kiểm tra tài nguyên VPS

## 🔧 Setup

1. Import workflows vào n8n instance
2. Cấu hình credentials (Zalo API, database)
3. Thiết lập schedule triggers
4. Test với sample data

## ⚠️ Notes

- Workflows được tối ưu cho VPS với RAM hạn chế
- Có các fallback mechanisms cho captain ID
- Support multiple team configurations

## 📄 License

Private project
