# 🔧 Hướng Dẫn Fix Performance n8n Workflows

**Ngày:** 2026-01-04
**Vấn đề:** Workflows chiếm tài nguyên VPS, không chạy được

---

## 🚨 Nguyên Nhân Chính

Execution ID **283985** (workflow `1.Render_image_progress_player`) bị **CRASHED**:
- Thời gian: 04:43:22 → 04:47:12 (3 phút 50 giây)
- Nguyên nhân: Loop qua nhiều items với wait time 10s → chạy quá lâu → crash
- Hệ quả: Không release tài nguyên → CPU/Memory bị chiếm

---

## ✅ CÁC BƯỚC FIX (Làm Ngay)

### BƯỚC 1: Giảm Wait Time trong Workflows

#### Workflow 1: `1.Render_image_progress_player`

1. Mở workflow trong n8n UI: https://workflow.nexme.vn/workflow/nxdj3XeZAA4WscYp
2. Tìm node **"Wait"**
3. Click vào node → Settings
4. Đổi `amount` từ **10** → **3** (giây)
5. Click **Save**

#### Workflow 2: `2.Render_team_leaderboard`

1. Mở workflow: https://workflow.nexme.vn/workflow/9fD7jTNV9LbMYGJu
2. Tìm node **"Wait"**
3. Đổi `amount` từ **10** → **3** (giây)
4. Click **Save**

---

### BƯỚC 2: Thêm Execution Timeout

**Vào tất cả 3 workflows:**

1. Mở workflow
2. Click vào **Settings** (bánh răng góc trên phải)
3. Tìm phần **"Execution Timeout"**
4. Nhập: **300** (5 phút)
5. Click **Save**

**Áp dụng cho:**
- Workflow 1: `nxdj3XeZAA4WscYp`
- Workflow 2: `9fD7jTNV9LbMYGJu`
- Workflow 3: `Cxhi6bFhwv0XbUF4`

---

### BƯỚC 3: Limit Batch Size trong "Split in Batches"

#### Workflow 1:

1. Mở workflow `1.Render_image_progress_player`
2. Tìm node **"Loop Over Items"** (type: Split in Batches)
3. Click vào node → Settings
4. Tìm **"Batch Size"** → Set = **3**
5. Click **Save**

#### Workflow 2:

1. Mở workflow `2.Render_team_leaderboard`
2. Tìm node **"Loop Over Items"**
3. Set **"Batch Size"** = **3**
4. Click **Save**

---

### BƯỚC 4: Clear Crashed Executions

1. Vào **Executions** page: https://workflow.nexme.vn/executions
2. Filter by status: **"crashed"**
3. Select tất cả crashed executions
4. Click **Delete** để giải phóng tài nguyên

Hoặc dùng lệnh sau (nếu có SSH access vào VPS):

```bash
# Clear crashed executions (nếu có quyền access database)
docker exec -it n8n_container npm run clear:crashed-executions
```

---

## 🧪 TEST SAU KHI FIX

### Test Workflow 1 (Personal Progress)

1. Vào Google Sheet: https://docs.google.com/spreadsheets/d/1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4
2. **TẠM THỜI XÓA HÀNG** để chỉ còn **3-5 người** (để test)
3. Vào n8n workflow 1: https://workflow.nexme.vn/workflow/nxdj3XeZAA4WscYp
4. Click **"Execute Workflow"**
5. Theo dõi execution
6. Kiểm tra:
   - ✅ Execution finish trong < 30s
   - ✅ Ảnh được render thành công
   - ✅ Message xuất hiện trong queue (Supabase)
   - ✅ Zalo OA nhận được tin nhắn

### Test Workflow 2 (Team Leaderboard)

1. Vào workflow 2: https://workflow.nexme.vn/workflow/9fD7jTNV9LbMYGJu
2. Click **"Execute Workflow"**
3. Kiểm tra tương tự workflow 1

### Test Workflow 3 (Sender)

Workflow 3 đang chạy tự động mỗi phút. Không cần test thủ công.

Kiểm tra:
1. Vào **Executions** của workflow 3
2. Xem executions gần đây có status **"success"** không
3. Check execution time: nên < 5s

---

## 📊 MONITORING SAU KHI FIX

### Kiểm tra hàng ngày:

1. **Check Execution History:**
   ```
   https://workflow.nexme.vn/executions
   ```
   - Filter by workflow
   - Xem có crashed executions không
   - Average execution time bao nhiêu

2. **Check Queue Size (Supabase):**
   ```sql
   SELECT COUNT(*) FROM bot_queue WHERE status = 'pending';
   ```
   - Nếu > 100 items → cần investigate
   - Queue nên được clear mỗi phút

3. **Check VPS Resources:**
   ```bash
   # SSH vào VPS
   htop  # Xem CPU/Memory
   docker stats  # Xem container usage
   ```

---

## 🔐 BEST PRACTICES ĐỂ TRÁNH CRASH

### 1. Không chạy manual với data lớn

❌ **KHÔNG LÀM:**
- Execute workflow 1 khi Google Sheet có > 10 rows
- Execute workflow 2 khi có > 3 teams

✅ **NÊN LÀM:**
- Test với 3-5 rows trước
- Sau khi confirm OK, mới scale lên

### 2. Monitor trước khi chạy

Trước khi execute workflow, check:
```
1. Queue size (Supabase) < 50
2. VPS CPU < 70%
3. VPS Memory < 80%
```

### 3. Schedule thay vì Manual

Thay vì click manual, nên:
- Set schedule trigger (mỗi ngày 8PM)
- Workflow tự chạy, không cần manual
- Có retry mechanism

---

## 🆘 NẾU VẪN BỊ CRASH

### Cách xử lý khẩn cấp:

1. **Stop workflow ngay:**
   ```
   Vào workflow → Settings → Deactivate
   ```

2. **Kill running executions:**
   ```bash
   # SSH vào VPS
   docker restart n8n_container
   ```

3. **Clear queue:**
   ```sql
   -- Vào Supabase SQL Editor
   UPDATE bot_queue
   SET status = 'cancelled'
   WHERE status = 'pending';
   ```

4. **Check logs:**
   ```bash
   docker logs n8n_container --tail 100
   ```

---

## 📞 CONTACT

Nếu vẫn gặp vấn đề, liên hệ:
- **Dev:** dqcong@gmail.com
- **n8n Instance:** https://workflow.nexme.vn/
- **Render API:** https://render.nexme.vn/

---

## 📝 CHANGELOG

### 2026-01-04
- ✅ Phát hiện crashed execution 283985
- ✅ Xác định nguyên nhân: Loop + Wait 10s
- ✅ Tạo hướng dẫn fix
- 🔄 Đợi implement fix

---

**QUAN TRỌNG:** Sau khi fix xong, nhớ test lại với ít data trước khi scale lên!
