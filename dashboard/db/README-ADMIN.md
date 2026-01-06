# 🔐 Tạo Tài Khoản Admin

## Thông tin tài khoản
- **Email:** dqcong@gmail.com
- **Password:** Go123456
- **Bcrypt Hash:** `$2b$10$OvionRlWg.6ymIu7E.FBYOFM.qf8dmrvqd.hzC1KoR7mXFrhD2qce`

## Cách 1: Chạy trên Supabase SQL Editor (KHUYẾN NGHỊ)

1. Truy cập Supabase Dashboard: https://app.supabase.com
2. Chọn project `vkhqqybnvnoagxqglnkn`
3. Mở **SQL Editor** từ menu bên trái
4. Copy và paste toàn bộ nội dung file `db/create-admin.sql`
5. Click **Run** để thực thi

## Cách 2: Chạy từ command line (nếu có psql)

```bash
psql "postgresql://postgres:ec8YjCnX2m8Gu7@db.vkhqqybnvnoagxqglnkn.supabase.co:5432/postgres" -f dashboard/db/create-admin.sql
```

## Cách 3: Sử dụng Node.js script

```bash
cd dashboard
node db/run-create-admin.js
```

## Sau khi tạo xong

Đăng nhập vào dashboard tại: http://localhost:3000/login

- Email: `dqcong@gmail.com`
- Password: `Go123456`

## File liên quan

- **Script SQL:** [db/create-admin.sql](dashboard/db/create-admin.sql)
- **Script Node.js:** [db/run-create-admin.js](dashboard/db/run-create-admin.js)
- **Hash generator:** [db/hash-password.js](dashboard/db/hash-password.js)

## Lưu ý

- Script sẽ **XÓA** tài khoản cũ nếu email đã tồn tại
- User được tạo với `email_verified = true` (đã xác thực email)
- Provider: `credential` (đăng nhập bằng email/password)

## Kiểm tra

Sau khi chạy script, verify bằng query:

```sql
SELECT u.id, u.email, u.name, u.email_verified, u.created_at
FROM "user" u
WHERE u.email = 'dqcong@gmail.com';
```

Nếu thấy kết quả trả về thông tin user là thành công!
