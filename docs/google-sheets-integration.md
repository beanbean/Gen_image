# Google Sheets Integration Guide

## Sheet Information

### Main Sheet
- **URL:** https://docs.google.com/spreadsheets/d/1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4/edit
- **Sheet ID:** `1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4`
- **Tab GID:** `345514191`

## Data Structure

### Columns
| Column Name      | Type   | Description                |
|-----------------|--------|----------------------------|
| In Ảnh?         | Bool   | Đánh dấu để render ảnh     |
| Vai Trò         | Text   | Role của người chơi        |
| Người chơi      | Text   | Tên người chơi             |
| Day 0           | Number | Cân nặng ngày 0            |
| Day 1           | Number | Cân nặng ngày 1            |
| Day 2           | Number | Cân nặng ngày 2            |
| ...             | ...    | ...                        |
| Day 10          | Number | Cân nặng ngày 10           |
| Đội             | Text   | Tên đội                    |
| Vòng            | Number | Vòng thi                   |
| Thời Gian       | Date   | Thời gian ghi nhận         |
| Đội trưởng      | Text   | Tên đội trưởng             |
| zaloID_captain  | Text   | Zalo ID của đội trưởng     |
| avatar_url      | URL    | URL avatar người chơi      |

## Workflow

```
┌─────────────────────────────────────────────────────────┐
│  1. Admin nhập data vào Google Sheet                   │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  2. Admin mở Dashboard                                  │
│     - Import data từ Google Sheet                       │
│     - Preview data trước khi import                     │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  3. Admin tick "In Ảnh?" checkbox                       │
│     hoặc bấm button "Tạo Ảnh"                           │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  4. Dashboard trigger workflow n8n                      │
│     - Gửi data từ Google Sheet                          │
│     - n8n render ảnh                                     │
│     - n8n gửi ảnh qua Zalo                              │
└─────────────────────────────────────────────────────────┘
```

## Implementation

### 1. Setup Google Sheets API

#### Tạo Service Account
```bash
# 1. Truy cập Google Cloud Console
https://console.cloud.google.com

# 2. Tạo project mới hoặc chọn project hiện tại

# 3. Enable Google Sheets API
https://console.cloud.google.com/apis/library/sheets.googleapis.com

# 4. Tạo Service Account
# Navigation Menu → IAM & Admin → Service Accounts → Create Service Account

# 5. Download JSON credentials
# Chọn Service Account → Keys → Add Key → JSON
```

#### Share Google Sheet
```
1. Mở Google Sheet
2. Click "Share" button
3. Thêm email của Service Account
   (format: xxx@xxx.iam.gserviceaccount.com)
4. Chọn role "Editor" hoặc "Viewer" (tùy nhu cầu)
```

### 2. Install Dependencies

```bash
npm install googleapis @google-cloud/local-auth
```

### 3. Code Implementation

#### Read Data from Sheet

```typescript
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SHEET_ID = '1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4';
const RANGE = 'Sheet1!A1:Z1000'; // Adjust range as needed

async function getSheetData() {
  // Authenticate
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS!),
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Read data
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  });

  const rows = response.data.values;

  if (!rows || rows.length === 0) {
    return [];
  }

  // Parse header row
  const headers = rows[0];
  const data = rows.slice(1).map((row) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });

  return data;
}
```

#### Transform Data

```typescript
interface PlayerData {
  inAnh: boolean; // "In Ảnh?"
  vaiTro: string; // "Vai Trò"
  nguoiChoi: string; // "Người chơi"
  day0: number;
  day1: number;
  // ... day2-day10
  day10: number;
  doi: string; // "Đội"
  vong: number; // "Vòng"
  thoiGian: string; // "Thời Gian"
  doiTruong: string; // "Đội trưởng"
  zaloIDCaptain: string;
  avatarUrl: string;
}

function transformSheetData(rows: any[]): PlayerData[] {
  return rows.map((row) => ({
    inAnh: row['In Ảnh?']?.toLowerCase() === 'true' || row['In Ảnh?'] === '1',
    vaiTro: row['Vai Trò'] || '',
    nguoiChoi: row['Người chơi'] || '',
    day0: parseFloat(row['Day 0']) || 0,
    day1: parseFloat(row['Day 1']) || 0,
    day2: parseFloat(row['Day 2']) || 0,
    day3: parseFloat(row['Day 3']) || 0,
    day4: parseFloat(row['Day 4']) || 0,
    day5: parseFloat(row['Day 5']) || 0,
    day6: parseFloat(row['Day 6']) || 0,
    day7: parseFloat(row['Day 7']) || 0,
    day8: parseFloat(row['Day 8']) || 0,
    day9: parseFloat(row['Day 9']) || 0,
    day10: parseFloat(row['Day 10']) || 0,
    doi: row['Đội'] || '',
    vong: parseInt(row['Vòng']) || 0,
    thoiGian: row['Thời Gian'] || '',
    doiTruong: row['Đội trưởng'] || '',
    zaloIDCaptain: row['zaloID_captain'] || '',
    avatarUrl: row['avatar_url'] || '',
  }));
}
```

#### Filter Records Marked "In Ảnh?"

```typescript
async function getRecordsToRender() {
  const allData = await getSheetData();
  const transformed = transformSheetData(allData);

  // Filter only records với "In Ảnh?" = true
  const toRender = transformed.filter((record) => record.inAnh === true);

  return toRender;
}
```

### 4. API Route Example

```typescript
// app/api/import/google-sheets/route.ts
import { NextResponse } from 'next/server';
import { getSheetData, transformSheetData } from '@/lib/google-sheets';

export async function POST(request: Request) {
  try {
    const { sheetId, range, autoTrigger } = await request.json();

    // 1. Fetch data from Google Sheets
    const rawData = await getSheetData(sheetId, range);

    // 2. Transform data
    const transformedData = transformSheetData(rawData);

    // 3. Filter records marked "In Ảnh?"
    const toRender = transformedData.filter((r) => r.inAnh);

    // 4. Optional: Save to database
    // await db.insert('import_history', { ... });

    // 5. Optional: Auto-trigger workflows
    if (autoTrigger) {
      for (const record of toRender) {
        await triggerWorkflow('nxdj3XeZAA4WscYp', {
          player_name: record.nguoiChoi,
          team_id: record.doi,
          weights: {
            day0: record.day0,
            day1: record.day1,
            // ... day2-day10
          },
          captain_zalo_id: record.zaloIDCaptain,
          avatar_url: record.avatarUrl,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: transformedData.length,
      toRender: toRender.length,
      data: toRender,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    );
  }
}
```

### 5. UI Component

```tsx
// components/GoogleSheetsImporter.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export function GoogleSheetsImporter() {
  const [sheetUrl, setSheetUrl] = useState(
    'https://docs.google.com/spreadsheets/d/1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4/edit'
  );
  const [range, setRange] = useState('Sheet1!A1:Z1000');
  const [autoTrigger, setAutoTrigger] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/import/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId: extractSheetId(sheetUrl),
          range,
          autoTrigger,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractSheetId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h2 className="text-xl font-semibold">Import từ Google Sheets</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Sheet URL</label>
        <Input
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Range</label>
        <Input
          value={range}
          onChange={(e) => setRange(e.target.value)}
          placeholder="Sheet1!A1:Z1000"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="auto-trigger"
          checked={autoTrigger}
          onCheckedChange={(checked) => setAutoTrigger(checked as boolean)}
        />
        <label htmlFor="auto-trigger" className="text-sm">
          Tự động tạo ảnh sau khi import (trigger workflows)
        </label>
      </div>

      <Button onClick={handleImport} disabled={loading}>
        {loading ? 'Đang import...' : 'Import Data'}
      </Button>

      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="font-semibold">Import thành công!</p>
          <p>Tổng số records: {result.total}</p>
          <p>Số records đánh dấu "In Ảnh?": {result.toRender}</p>
        </div>
      )}
    </div>
  );
}
```

## Environment Variables

```env
# .env.local
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

## Testing

```bash
# Test read data
curl http://localhost:3000/api/import/google-sheets \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "sheetId": "1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4",
    "range": "Sheet1!A1:Z10",
    "autoTrigger": false
  }'
```

## Notes

- Service Account credentials phải được bảo mật tốt (không commit vào git)
- Nên sử dụng environment variables cho sensitive data
- Có thể cache data để giảm số lần gọi API
- Google Sheets API có [quota limits](https://developers.google.com/sheets/api/limits):
  - Read requests: 300/min/user
  - Write requests: 300/min/user
