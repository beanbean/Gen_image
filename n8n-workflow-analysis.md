# Báo Cáo Kiểm Tra Workflows n8n - Marathon 10000TV

**Ngày kiểm tra:** 2026-01-04
**n8n Instance:** https://workflow.nexme.vn/
**Số lượng workflows:** 3

---

## 📊 Tổng Quan Workflows

| ID | Tên Workflow | Trạng thái | Số Nodes | Mục đích |
|---|---|---|---|---|
| nxdj3XeZAA4WscYp | 1.Render_image_progress_player | ❌ Inactive | 12 | Render báo cáo tiến trình cá nhân |
| 9fD7jTNV9LbMYGJu | 2.Render_team_leaderboard | ❌ Inactive | 12 | Render bảng xếp hạng đội |
| Cxhi6bFhwv0XbUF4 | 3.send_image_zalo_captain | ✅ Active | 9 | Gửi ảnh qua Zalo OA |

---

## 🔍 Chi Tiết Từng Workflow

### 1. Render_image_progress_player (ID: nxdj3XeZAA4WscYp)

**📌 Mục đích:** Tạo báo cáo tiến trình cá nhân cho từng thành viên và gửi qua Zalo

**📅 Thông tin:**
- Tạo: 2025-12-31
- Cập nhật cuối: 2026-01-04 04:47:05
- Trạng thái: **INACTIVE** ❌
- Version: 349
- Error Workflow: hORJlWLQ84vPW1tX

**🔄 Luồng hoạt động:**
```
Manual Trigger
  → Get Google Sheets Data (marathon)
  → Loop Over Items (Split in Batches)
  → JS: Format Report (Code node)
  → API: Render Personal Card (render.nexme.vn)
  → Check: Render Success? (IF node)
     ├─ YES → Queue: Success Msg → Send to Zalo
     └─ NO → Queue: Fallback Text → Send to Zalo
  → Wait 10s
  → Loop back
```

**🔧 Nodes quan trọng:**

1. **Get row(s) in sheet**
   - Google Sheets: `1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4`
   - Sheet: "marathon" (ID: 345514191)

2. **JS: Format Report** (Code Node)
   - Xử lý dữ liệu cân nặng Day0 → Day10
   - Tính toán delta weight (chênh lệch vs ngày trước)
   - Format data cho template
   - **⚠️ Fallback Logic:** Có xử lý fallback cho captain ID theo team:
     ```
     Đội Báo Săn → 3633624730889700356
     Đội Cánh Gió → 2405161230734177
     Đội Sóng Dũng → 2405161230734177
     DEFAULT → 2405161230734177
     ```

3. **API: Render Personal Card**
   - URL: `https://render.nexme.vn/render`
   - API Key: `goPT@marathon10000TV`
   - Template: `personal_progress.hbs`
   - Size: 1080x1444

4. **Queue nodes** (Supabase)
   - Table: `bot_queue`
   - Bot type: `PLAYER`
   - Credential: `vEyQn3WuVDmUMZO6`

**📝 Observations:**
- ✅ Có xử lý error handling (continueRegularOutput)
- ✅ Có fallback khi render thất bại
- ✅ Batch processing với delay 10s giữa mỗi batch
- ⚠️ Workflow đang INACTIVE - cần active để chạy

---

### 2. Render_team_leaderboard (ID: 9fD7jTNV9LbMYGJu)

**📌 Mục đích:** Tạo bảng xếp hạng top 8 thành viên của từng đội

**📅 Thông tin:**
- Tạo: 2026-01-02
- Cập nhật cuối: 2026-01-04 04:47:17
- Trạng thái: **INACTIVE** ❌
- Version: 30

**🔄 Luồng hoạt động:**
```
Manual Trigger
  → Get Marathon Data (Google Sheets)
  → Group By Team (Code node - nhóm theo đội)
  → Loop Over Items (xử lý từng đội)
  → Rank Players Top 8 (Code node - xếp hạng)
  → Render Team Leaderboard (render.nexme.vn)
  → Check: Render Success?
     ├─ YES → Queue: Team Success → Send Zalo
     └─ NO → Queue: Team Fallback → Send Zalo
  → Wait 10s
  → Loop back
```

**🔧 Nodes quan trọng:**

1. **Group By Team** (Code Node)
   - Nhóm players theo team
   - Tách captain và members
   - **⚠️ FIX:** Đã sửa logic lấy `zaloID_captain` - tìm trong nhiều key variants
   - Normalize team names (bỏ dấu, lowercase)

2. **Rank Players (Top 8)** (Code Node)
   - Tự động detect ngày hiện tại (1-10)
   - Tính daily_loss (giảm cân hôm nay)
   - Tính total_loss (tổng giảm từ đầu)
   - Sort theo daily_loss DESC
   - Lấy top 8 + captain
   - **Format đặc biệt:**
     - Giảm cân: `-0.4`
     - Tăng cân: `⚠️ +0.3` (có warning icon)
   - Tạo text_report sẵn để gửi Zalo

3. **Render Team Leaderboard**
   - Template: `daily_leaderboard.hbs`
   - Size: 1080x1920
   - Filename prefix: `team_leader`

4. **Queue nodes**
   - Bot type: `TEAM_LEADER`
   - Gửi đến captain qua `captain_id`

**📝 Observations:**
- ✅ Logic xử lý captain ID đã được fix (search multiple keys)
- ✅ Auto-detect current day từ data
- ✅ Format cảnh báo khi tăng cân
- ✅ Có fallback text khi render fail
- ⚠️ Workflow đang INACTIVE

---

### 3. send_image_zalo_captain (ID: Cxhi6bFhwv0XbUF4)

**📌 Mục đích:** Worker workflow - Xử lý queue và gửi tin nhắn có ảnh qua Zalo OA

**📅 Thông tin:**
- Tạo: 2025-12-16
- Cập nhật cuối: 2026-01-04 04:47:26
- Trạng thái: **ACTIVE** ✅
- Version: 102
- Triggers: 2 (Schedule + Execute)

**🔄 Luồng hoạt động:**
```
[Trigger 1] Schedule: Mỗi phút
[Trigger 2] Executed by Another Workflow
  ↓
  → RPC: Pop Queue (lấy 10 items từ bot_queue)
  → Loop Over Items
  → 🛡️ Safe Parser (parse JSON payload)
  → ❓ Có Ảnh không?
     ├─ CÓ → Zalo: Gửi Ảnh
     └─ KHÔNG → Skip
  → RPC: Update Status (sent)
  → Loop back
```

**🔧 Nodes quan trọng:**

1. **Schedule Trigger**
   - Chạy mỗi phút: `* * * * *`
   - Tự động poll queue

2. **RPC: Pop Queue**
   - Supabase Function: `pop_bot_queue`
   - Limit: 10 items/lần
   - Retry: enabled, wait 2s

3. **🛡️ Safe Parser** (Code Node)
   - Parse JSON payload an toàn
   - Extract: user_id, text, image_url
   - **⚠️ Validation:** Check recipient.id tồn tại
   - Return flat structure

4. **Zalo: Gửi Ảnh**
   - Operation: `sendImageMessage`
   - Credential: OA nexme - app marathon
   - Error handling: continueRegularOutput

5. **RPC: Update Status**
   - Update status → `sent`
   - Supabase function: `update_queue_status`

**📝 Observations:**
- ✅ Workflow đang ACTIVE - chạy tốt
- ✅ Có schedule auto-run mỗi phút
- ✅ Batch processing (10 items/lần)
- ✅ Error handling robust
- ✅ Có pin data để test
- ⚠️ Chỉ gửi ảnh, không gửi text

---

## ⚠️ Vấn Đề Phát Hiện

### 1. **Workflows chính đang INACTIVE**
- Workflow 1 và 2 đều inactive
- Cần active để chạy tự động hoặc manual

### 2. **Workflow 3 chỉ gửi ảnh**
- Node "Zalo: Gửi Ảnh" không gửi kèm text
- Nếu cần gửi cả text + ảnh, cần thêm node hoặc sửa logic

### 3. **Dependency giữa workflows**
- Workflow 1 & 2 đều call workflow 3 (`Cxhi6bFhwv0XbUF4`)
- Nếu workflow 3 fail → toàn bộ flow bị ảnh hưởng

### 4. **Hard-coded credentials**
- API keys và tokens được hard-code trong nodes
- Nên move sang environment variables

### 5. **Error Workflow**
- Workflow 1 có error workflow: `hORJlWLQ84vPW1tX`
- Nên kiểm tra xem workflow này có tồn tại không

---

## ✅ Điểm Mạnh

1. **Architecture tốt:**
   - Tách riêng logic: render → queue → send
   - Dễ maintain và debug

2. **Error handling:**
   - Có fallback khi render fail
   - Continue on error để không block flow

3. **Queue system:**
   - Sử dụng Supabase queue
   - Batch processing hiệu quả
   - Auto-retry

4. **Data processing:**
   - Logic tính toán cân nặng chính xác
   - Handle null/empty values tốt
   - Auto-detect current day

---

## ⚠️ VẤN ĐỀ ĐANG GẶP (Update 05:00 04/01/2026)

### 🔴 CRITICAL: Workflow bị crash gây chiếm tài nguyên VPS

**Execution ID 283985 (Workflow 1):**
- Status: **CRASHED**
- Time: 04:43:22 → 04:47:12 (chạy 3p50s)
- Mode: Manual trigger
- Nguyên nhân: **Loop Over Items + Wait 10s** với nhiều data → chạy lâu → crash giữa chừng

**Vấn đề:**
1. Workflow 1 & 2 có loop với wait time → nếu data lớn sẽ chạy rất lâu
2. Khi crash, không release tài nguyên → chiếm CPU/Memory
3. Workflow 3 chạy schedule mỗi phút → nếu queue đông cũng gây lag

**Giải pháp:**
1. ✅ Đừng chạy manual workflow 1 & 2 khi có nhiều data (>10 rows)
2. ✅ Giảm wait time từ 10s → 3-5s
3. ✅ Implement timeout cho workflows (max 5 phút)
4. ✅ Clear crashed executions định kỳ
5. ✅ Monitor queue size trước khi chạy

---

## 🎯 Khuyến Nghị

### 🔴 Urgent - FIX NGAY
1. **Giảm wait time** trong Loop Over Items: 10s → 3s
2. **Thêm timeout setting** cho workflows (max execution time: 300s)
3. **Clear crashed executions** để free tài nguyên
4. **Limit batch size** trong Split in Batches: max 5 items/batch

### 🟡 Important
5. Kiểm tra error workflow `hORJlWLQ84vPW1tX` có tồn tại không
6. Move credentials sang environment variables
7. Setup monitoring/alerting cho queue
8. Thêm error notification qua Telegram/Zalo

### 🟢 Nice to have
9. Thêm logging để track errors
10. Implement retry mechanism cho failed renders
11. Add webhook trigger để trigger từ bên ngoài
12. Cache Google Sheets data để giảm API calls

---

## 📈 Metrics

- **Tổng nodes:** 33 nodes
- **Active workflows:** 1/3 (33%)
- **Triggers:** 3 (1 manual, 1 schedule, 1 execute)
- **External integrations:**
  - Google Sheets ✅
  - Render API ✅
  - Supabase ✅
  - Zalo OA ✅

---

## 🔗 Resources

- Google Sheet: [marathon](https://docs.google.com/spreadsheets/d/1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4)
- Render API: https://render.nexme.vn/render
- Supabase Project: vkhqqybnvnoagxqglnkn
- Zalo OA: nexme - app marathon

---

**Báo cáo tạo bởi:** Claude Code
**Phương thức:** n8n API (X-N8N-API-KEY)
