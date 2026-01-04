# 📅 Hướng Dẫn Setup Schedule Trigger cho 18 Rows

**Vấn đề:** Google Sheet có 18 rows → chạy manual sẽ mất 18 * 10s = 180s (3 phút) → crash

**Giải pháp:** Dùng Schedule Trigger để tự động chạy hàng ngày + giảm wait time

---

## 🎯 CHIẾN LƯỢC XỬ LÝ 18 ROWS

### Option 1: Chạy Tất Cả Một Lần (Recommended)
**Phù hợp:** Gửi báo cáo hàng ngày vào 1 thời điểm cố định

- Schedule: **Mỗi ngày 8:00 PM**
- Batch size: **3 items**
- Wait time: **3 seconds**
- Tổng thời gian: 18 rows / 3 = 6 batches × (3s wait + ~15s process) = **~110 giây (2 phút)**

### Option 2: Chia Nhỏ Thành 2 Lần Chạy
**Phù hợp:** Nếu muốn giảm tải VPS

- Schedule 1: **8:00 PM** → 9 rows đầu
- Schedule 2: **8:15 PM** → 9 rows cuối
- Mỗi lần: ~1 phút

### Option 3: Chạy Theo Team (Best Practice)
**Phù hợp:** Gửi riêng từng team

- Team 1 (6 người): 8:00 PM
- Team 2 (6 người): 8:10 PM
- Team 3 (6 người): 8:20 PM
- Mỗi lần: ~40 giây

---

## 📋 HƯỚNG DẪN TỪNG BƯỚC

### WORKFLOW 1: Personal Progress (18 người)

#### **BƯỚC 1: Thêm Schedule Trigger Node**

1. Mở workflow: https://workflow.nexme.vn/workflow/nxdj3XeZAA4WscYp

2. Xóa hoặc disable node **"When clicking 'Execute workflow'"** (Manual Trigger):
   - Click vào node
   - Press **Delete** hoặc Click **Disable**

3. Thêm **Schedule Trigger** node:
   - Click **+** Add Node
   - Search: `Schedule Trigger`
   - Click để add

4. Kéo Schedule Trigger lên đầu workflow

5. Nối Schedule Trigger → **"Get row(s) in sheet"**

#### **BƯỚC 2: Cấu Hình Schedule Trigger**

**A. Chạy mỗi ngày 8:00 PM:**

1. Click vào **Schedule Trigger** node
2. Chọn **Interval** → `Every Day`
3. **Hour**: `20` (8 PM)
4. **Minute**: `0`
5. **Timezone**: `Asia/Ho_Chi_Minh`

**Cron Expression tương đương:**
```
0 20 * * *
```

**B. Hoặc chạy Custom với Cron:**

1. Click **Schedule Trigger** node
2. Chọn mode: `Custom (Cron)`
3. Nhập cron expression:

```
# Mỗi ngày 8:00 PM
0 20 * * *

# Hoặc mỗi ngày 8:00 PM và 8:15 PM (2 lần)
0,15 20 * * *

# Hoặc 8:00 PM, 8:10 PM, 8:20 PM (chia làm 3 lần)
0,10,20 20 * * *
```

#### **BƯỚC 3: Tối Ưu Loop Settings**

1. Tìm node **"Loop Over Items"** (Split in Batches)

2. Click vào node → Settings

3. Cấu hình:
   - **Batch Size**: `3` (xử lý 3 người/lần)
   - **Reset**: `true`

4. Tìm node **"Wait"**

5. Đổi settings:
   - **Amount**: `3` (giây)
   - **Unit**: `seconds`

#### **BƯỚC 4: Thêm Execution Timeout**

1. Click **Workflow Settings** (icon bánh răng góc phải)

2. Tìm **Execution Timeout**

3. Nhập: `300` (5 phút = 300 giây)

4. **Save**

#### **BƯỚC 5: Active Workflow**

1. Click nút **"Active"** ở góc trên
2. Chuyển từ OFF → **ON**
3. Workflow sẽ tự chạy vào 8:00 PM hàng ngày

---

### WORKFLOW 2: Team Leaderboard (3 teams)

#### **BƯỚC 1-4:** Tương tự Workflow 1

#### **BƯỚC 5: Schedule Khác Nhau**

**Option A: Chạy cùng lúc với WF1 (8:00 PM):**
```
0 20 * * *
```

**Option B: Chạy sau WF1 5 phút (8:05 PM):**
```
5 20 * * *
```
Tránh 2 workflows chạy cùng lúc gây quá tải

**Option C: Chạy mỗi team riêng:**

Không khả thi với 1 workflow. Cần tạo 3 workflows riêng hoặc dùng Option A/B.

---

## 🔧 TÍNH TOÁN THỜI GIAN CHO 18 ROWS

### Với Setup Được Recommend:

```
Batch Size: 3
Wait Time: 3s
Processing Time per item: ~10s (render + queue)

Tính toán:
- Số batches: 18 / 3 = 6 batches
- Thời gian mỗi batch:
  + Process 3 items: 3 * 10s = 30s
  + Wait: 3s
  + Total: 33s per batch
- Tổng thời gian: 6 * 33s = 198s ≈ 3.3 phút

Với timeout 300s (5 phút) → AN TOÀN ✅
```

### Nếu Muốn Nhanh Hơn (Batch Size 5):

```
Batch Size: 5
Wait Time: 2s

- Số batches: 18 / 5 = 4 batches (batch cuối 3 items)
- Thời gian: ~2.5 phút

NHƯNG: Risk cao hơn nếu render service slow
```

---

## 📊 CÁCH CHIA NHỎ 18 ROWS (ADVANCED)

### Phương Án 1: Filter Theo Team trong Workflow

**Tạo 3 workflows riêng:**

**Workflow 1A: Team Báo Săn (6 người)**
```javascript
// Trong node "Get row(s) in sheet"
// Thêm node "Filter" sau đó:

return items.filter(item => {
  const team = item.json.Đội || item.json.team;
  return team === "Đội Báo Săn";
});
```
Schedule: `0 20 * * *` (8:00 PM)

**Workflow 1B: Team Cánh Gió (6 người)**
```javascript
return items.filter(item => {
  const team = item.json.Đội || item.json.team;
  return team === "Đội Cánh Gió";
});
```
Schedule: `10 20 * * *` (8:10 PM)

**Workflow 1C: Team Sóng Dũng (6 người)**
```javascript
return items.filter(item => {
  const team = item.json.Đội || item.json.team;
  return team === "Đội Sóng Dũng";
});
```
Schedule: `20 20 * * *` (8:20 PM)

### Phương Án 2: Filter Theo Range trong Google Sheets

**Thay vì đọc toàn bộ sheet, đọc từng phần:**

**Workflow 1A:**
- Google Sheets node → Range: `A2:K7` (6 rows đầu)
- Schedule: 8:00 PM

**Workflow 1B:**
- Google Sheets node → Range: `A8:K13` (6 rows giữa)
- Schedule: 8:10 PM

**Workflow 1C:**
- Google Sheets node → Range: `A14:K19` (6 rows cuối)
- Schedule: 8:20 PM

---

## ✅ RECOMMENDED SETUP CHO 18 ROWS

### **Setup Đơn Giản Nhất (Dễ Maintain):**

```
✅ 1 Workflow
✅ Schedule: Mỗi ngày 8:00 PM
✅ Batch Size: 3
✅ Wait Time: 3s
✅ Execution Timeout: 300s
✅ Tổng thời gian: ~3 phút
```

**Ưu điểm:**
- Đơn giản, dễ quản lý
- Chỉ cần 1 workflow
- An toàn với timeout 5 phút

**Nhược điểm:**
- Chạy hơi lâu (3 phút)
- Nếu fail phải chạy lại toàn bộ

### **Setup Tối Ưu (Recommended):**

```
✅ 3 Workflows (chia theo team)
✅ Schedule: 8:00 PM, 8:10 PM, 8:20 PM
✅ Batch Size: 3
✅ Wait Time: 2s
✅ Mỗi workflow: ~1 phút
✅ Tổng thời gian: 3 phút (phân tán)
```

**Ưu điểm:**
- Load VPS phân tán
- Nếu 1 team fail, 2 team kia vẫn OK
- Dễ debug

**Nhược điểm:**
- Phải maintain 3 workflows
- Phức tạp hơn

---

## 🧪 TEST SCHEDULE TRIGGER

### Cách Test Không Cần Đợi Đến 8 PM:

**Option 1: Test Manual Trigger Trước**

1. Thêm **Manual Trigger** node (temporary)
2. Nối Manual → Get Sheet (parallel với Schedule)
3. Giới hạn test với 3 rows:
   - Thêm node **Limit** sau Get Sheet
   - Set limit: 3
4. Click "Execute Workflow"
5. Xem có success không
6. Nếu OK → remove Manual Trigger

**Option 2: Test với Schedule Gần (1 phút sau)**

1. Check giờ hiện tại: ví dụ 5:45 PM
2. Set schedule: 5:46 PM (1 phút sau)
3. Active workflow
4. Đợi 1 phút → workflow tự chạy
5. Check execution log
6. Nếu OK → đổi lại schedule 8:00 PM

**Option 3: Test bằng Cron Expression**

```
# Chạy mỗi 5 phút (chỉ để test)
*/5 * * * *

# Sau khi test OK, đổi lại:
0 20 * * *
```

---

## 📊 MONITORING SCHEDULE TRIGGERS

### Check Workflow Có Chạy Không:

1. Vào **Executions**: https://workflow.nexme.vn/executions

2. Filter:
   - Workflow: `1.Render_image_progress_player`
   - Mode: `trigger`
   - Date: Hôm nay

3. Kiểm tra:
   - ✅ Có execution vào 8:00 PM không
   - ✅ Status: success
   - ✅ Duration: < 4 phút

### Setup Alert (Optional):

**Via Telegram/Zalo:**

Thêm node vào cuối workflow:
```
IF execution failed
  → Send alert to Telegram/Zalo
ELSE
  → Send success report
```

---

## 🚨 TROUBLESHOOTING

### Vấn Đề 1: Schedule Không Chạy

**Nguyên nhân:**
- Workflow chưa Active
- Timezone sai
- Cron expression sai

**Fix:**
1. Check workflow Active = ON
2. Check timezone = `Asia/Ho_Chi_Minh`
3. Test với manual trigger trước

### Vấn Đề 2: Execution Bị Timeout

**Nguyên nhân:**
- 18 rows × 10s = 180s > timeout
- Render service slow

**Fix:**
1. Tăng execution timeout: 300s → 600s
2. Giảm wait time: 3s → 2s
3. Hoặc chia thành 2 schedules

### Vấn Đề 3: Một Số Items Failed

**Nguyên nhân:**
- Render API timeout
- Zalo API error
- Data invalid

**Fix:**
1. Check execution logs
2. Xem item nào failed
3. Fix data hoặc retry

---

## 📋 CHECKLIST SETUP

### Trước Khi Active:

- [ ] Đã thêm Schedule Trigger node
- [ ] Đã set correct time (8:00 PM)
- [ ] Đã set timezone (Asia/Ho_Chi_Minh)
- [ ] Đã giảm wait time (3s)
- [ ] Đã set batch size (3)
- [ ] Đã set execution timeout (300s)
- [ ] Đã test với 3 rows
- [ ] Đã remove/disable Manual Trigger
- [ ] Đã Active workflow

### Sau Khi Active:

- [ ] Check execution vào 8:00 PM ngày đầu
- [ ] Verify tất cả 18 messages đã gửi
- [ ] Check Zalo OA có nhận đủ không
- [ ] Monitor VPS resources trong lúc chạy
- [ ] Setup alert nếu fail

---

## 🎯 KẾT LUẬN

**Với 18 rows, Setup Recommended:**

```yaml
Schedule: Mỗi ngày 8:00 PM
Batch Size: 3 items
Wait Time: 3 seconds
Execution Timeout: 300 seconds (5 phút)
Expected Duration: ~3 phút
Success Rate: >95%
VPS Load: Medium (acceptable)
```

**Nếu muốn tối ưu hơn:**
- Chia thành 3 workflows (6 rows/workflow)
- Schedule: 8:00, 8:10, 8:20 PM
- Mỗi workflow: ~1 phút
- VPS Load: Low (distributed)

---

**Questions?** Hỏi nếu cần giải thích thêm về:
1. Cron expression
2. Timezone configuration
3. Error handling
4. Testing strategies
