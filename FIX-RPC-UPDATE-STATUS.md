# 🔧 FIX NODE "RPC: UPDATE STATUS" - HƯỚNG DẪN CHI TIẾT

**Vấn đề:** Node chỉ gửi 2 parameters (p_error, p_status) thay vì 4 parameters

**Nguyên nhân:** Config node sai hoặc chưa save

---

## 🎯 GIẢI PHÁP CHẮC CHẮN: TẠO LẠI NODE TỪ ĐẦU

### BƯỚC 1: XÓA NODE CŨ

1. Click vào node **"RPC: Update Status"**
2. Nhấn **Delete** (hoặc Backspace)
3. Confirm xóa

### BƯỚC 2: TẠO NODE HTTP REQUEST MỚI

1. Click **"+"** để add node
2. Search: **"HTTP Request"**
3. Click để add
4. Đổi tên node: **"RPC: Update Status"**

### BƯỚC 3: CẤU HÌNH CƠ BẢN

#### A. Method và URL

**Method:** `POST`

**URL:**
```
https://daphxsixhtdvttqrnmhl.supabase.co/rest/v1/rpc/update_queue_status
```

#### B. Authentication

**Authentication:** `Generic Credential Type` → `Header Auth`

Hoặc dùng **None** và thêm headers manually (khuyến nghị).

#### C. Headers

Click **"Add Parameter"** trong Headers section:

**Header 1:**
- Name: `apikey`
- Value:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcGh4c2l4aHRkdnR0cXJubWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NjQzNDEsImV4cCI6MjA1MTE0MDM0MX0.ZqF3r-bnqYp7o2kbPSLp9Wvzxp5F7kE8hKxkDYH_-Kg
```

**Header 2:**
- Name: `Authorization`
- Value:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcGh4c2l4aHRkdnR0cXJubWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NjQzNDEsImV4cCI6MjA1MTE0MDM0MX0.ZqF3r-bnqYp7o2kbPSLp9Wvzxp5F7kE8hKxkDYH_-Kg
```

**Header 3:**
- Name: `Content-Type`
- Value: `application/json`

**Header 4:**
- Name: `Prefer`
- Value: `return=representation`

---

### BƯỚC 4: CẤU HÌNH BODY (QUAN TRỌNG NHẤT!)

#### Option A: Dùng JSON (RECOMMENDED)

1. Tìm section **"Body"** (hoặc "Send Body")
2. **Body Content Type:** Chọn `JSON`
3. **Specify Body:** Chọn `Using JSON`
4. Paste JSON này vào ô JSON:

```json
{
  "p_error": "={{ $json.error || '' }}",
  "p_id": "={{ $json.db_id }}",
  "p_status": "sent",
  "p_zalo_msg_id": "={{ $json.zalo_msg_id || null }}"
}
```

**LƯU Ý:**
- Giữ nguyên dấu ngoặc kép `"` xung quanh expressions
- n8n sẽ tự động evaluate `={{ }}` expressions

#### Option B: Dùng Fields Below (Nếu Option A không có)

1. **Specify Body:** Chọn `Using Fields Below`
2. Click **"Add Parameter"** 4 lần để thêm 4 parameters

**Parameter 1:**
- Name: `p_error`
- Value: `={{ $json.error || '' }}`

**Parameter 2:**
- Name: `p_id`
- Value: `={{ $json.db_id }}`

**Parameter 3:**
- Name: `p_status`
- Value: `sent`

**Parameter 4:**
- Name: `p_zalo_msg_id`
- Value: `={{ $json.zalo_msg_id || null }}`

**QUAN TRỌNG:** Thứ tự phải đúng như trên!

---

### BƯỚC 5: SETTINGS (OPTIONAL)

Click tab **"Settings"**:

- **Always Output Data:** ON
- **Timeout:** 10000 (10 giây)

---

### BƯỚC 6: KẾT NỐI VỚI WORKFLOW

1. Kéo connection từ node **"Zalo: Gửi Ảnh"** → **"RPC: Update Status"**
2. Đảm bảo connection line hiển thị

---

### BƯỚC 7: SAVE VÀ TEST

1. **Save workflow:** Ctrl+S (hoặc Cmd+S trên Mac)
2. Đợi notification "Workflow saved"
3. Click vào node "RPC: Pop Queue1"
4. Click **"Execute Node"** để test từ đầu
5. Hoặc click workflow → **"Execute Workflow"**

---

## ✅ VERIFICATION

### Sau khi execute, check:

1. **Node "RPC: Update Status" có màu xanh** (success)
2. **Output tab** hiển thị response từ Supabase
3. **Supabase bot_queue** có record được update:

```sql
SELECT * FROM bot_queue
WHERE status = 'sent'
ORDER BY updated_at DESC
LIMIT 5;
```

---

## 🎯 KẾT QUẢ MONG ĐỢI

### Success Response:

```json
{
  "success": true,
  "rows_updated": 1
}
```

hoặc

```json
[
  {
    "id": "eee37675-3388-45a2-8173-9e02b23c0259",
    "status": "sent",
    "updated_at": "2026-01-04T14:40:00.000Z"
  }
]
```

---

## 🚨 NẾU VẪN LỖI

### Lỗi 1: "function not found with parameters (p_error, p_status)"

**Nguyên nhân:** Vẫn chỉ gửi 2 parameters

**Fix:**
1. Check lại JSON body có đúng 4 fields không
2. Check lại không có typo trong field names
3. Save workflow lại (Ctrl+S)
4. Refresh browser (F5)
5. Execute lại

### Lỗi 2: "unauthorized" hoặc "401"

**Nguyên nhân:** API key sai hoặc thiếu

**Fix:**
1. Check lại apikey header
2. Check lại Authorization header
3. Đảm bảo có prefix "Bearer " trước token

### Lỗi 3: "Cannot read property 'db_id' of undefined"

**Nguyên nhân:** Data từ node trước không có field db_id

**Fix:**
1. Click node "RPC: Pop Queue1"
2. Xem Output tab
3. Kiểm tra tên field chính xác (có thể là `id` thay vì `db_id`)
4. Đổi `$json.db_id` thành `$json.id` nếu cần

---

## 📊 DEBUG TIPS

### Xem Request Thực Tế Được Gửi:

1. Mở **Developer Tools** (F12)
2. Tab **Network**
3. Execute workflow
4. Tìm request tới `update_queue_status`
5. Click vào request → Tab **Payload**
6. Xem JSON được gửi đi có 4 fields không

---

## 🎯 TEMPLATE HOÀN CHỈNH

Copy toàn bộ config này:

```yaml
Node: HTTP Request
Name: RPC: Update Status

Method: POST
URL: https://daphxsixhtdvttqrnmhl.supabase.co/rest/v1/rpc/update_queue_status

Headers:
  - apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcGh4c2l4aHRkdnR0cXJubWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NjQzNDEsImV4cCI6MjA1MTE0MDM0MX0.ZqF3r-bnqYp7o2kbPSLp9Wvzxp5F7kE8hKxkDYH_-Kg
  - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcGh4c2l4aHRkdnR0cXJubWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NjQzNDEsImV4cCI6MjA1MTE0MDM0MX0.ZqF3r-bnqYp7o2kbPSLp9Wvzxp5F7kE8hKxkDYH_-Kg
  - Content-Type: application/json
  - Prefer: return=representation

Body Type: JSON
Body:
{
  "p_error": "={{ $json.error || '' }}",
  "p_id": "={{ $json.db_id }}",
  "p_status": "sent",
  "p_zalo_msg_id": "={{ $json.zalo_msg_id || null }}"
}
```

---

## 📞 NẾU VẪN KHÔNG ĐƯỢC

Gửi cho tôi:

1. Screenshot node "RPC: Update Status" → Tab Parameters (toàn bộ)
2. Screenshot node "RPC: Update Status" → Tab Settings
3. Screenshot node "RPC: Pop Queue1" → Output (để tôi thấy field names)
4. Error message mới nhất (nếu có)

---

**Last Updated:** 2026-01-04 14:40
**Status:** Ready to implement
