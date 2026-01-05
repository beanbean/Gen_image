# Phase 02 - Day 2: Google Sheets Import + Polish

**Thời lượng:** 8 giờ
**Mục tiêu:** Import Google Sheets hoạt động + Queue monitor + Dashboard deployed

---

## 🎯 DELIVERABLES

- ✅ Google Sheets API integration working
- ✅ Import data từ Sheets vào `bot_queue`
- ✅ QueueTable component hiển thị real-time data
- ✅ Error handling cơ bản
- ✅ Dashboard deployed on Vercel
- ✅ README documentation

---

## ⏰ TIMELINE BREAKDOWN

### MORNING SESSION (4 giờ)

#### 1. Google Sheets API Setup (1 giờ)

**Step 1: Tạo Service Account (20 phút)**
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện tại
3. Enable Google Sheets API:
   - APIs & Services → Library
   - Search "Google Sheets API" → Enable
4. Tạo Service Account:
   - APIs & Services → Credentials
   - Create Credentials → Service Account
   - Tên: `n8n-dashboard-service`
   - Role: Viewer (read-only)
5. Tạo key:
   - Vào service account → Keys tab
   - Add Key → JSON
   - Download file `credentials.json`

**Step 2: Share Google Sheet (5 phút)**
1. Mở Google Sheet: `1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4`
2. Click Share
3. Add email của service account (có trong `credentials.json`)
4. Role: Viewer

**Step 3: Setup Environment (10 phút)**
```bash
# Install dependencies
npm install googleapis @google-cloud/local-auth
```

Add vào `.env.local`:
```env
# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1Z9nU5cQwEDeSKAn-Ba5HFpHUhQQyOoSxukaO7mG5DV4
```

**Step 4: Test Connection (25 phút)**
Tạo test script `scripts/test-sheets.ts`:
```typescript
import { google } from 'googleapis';

async function testSheetsAPI() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range: 'Sheet1!A1:N10', // Test range
  });

  console.log('Rows:', response.data.values);
}

testSheetsAPI();
```

Run:
```bash
npx tsx scripts/test-sheets.ts
```

**Checklist:**
- [ ] Service account created
- [ ] Sheet shared với service account
- [ ] Credentials trong `.env.local`
- [ ] Test script chạy thành công

---

#### 2. Implement Google Sheets Client (1.5 giờ)

Tạo `lib/sheets.ts`:
```typescript
import { google } from 'googleapis';

// Initialize auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

export interface SheetRow {
  printImage: string;        // In Ảnh?
  role: string;              // Vai Trò
  playerName: string;        // Người chơi
  day0: number;              // Day 0 weight
  day1: number;              // Day 1 weight
  // ... day2-day10
  team: string;              // Đội
  round: string;             // Vòng
  time: string;              // Thời Gian
  captain: string;           // Đội trưởng
  zaloIdCaptain: string;     // zaloID_captain
  avatarUrl: string;         // avatar_url
}

export async function fetchSheetData(
  sheetId: string,
  range: string
): Promise<any[][]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,
  });

  return response.data.values || [];
}

export function transformSheetRowToQueueItem(row: any[], rowIndex: number) {
  // Column mapping (adjust dựa vào actual sheet structure)
  const [
    printImage,     // A: In Ảnh?
    role,           // B: Vai Trò
    playerName,     // C: Người chơi
    day0,           // D: Day 0
    day1,           // E: Day 1
    day2,           // F: Day 2
    // ... skip day3-day9
    day10,          // O: Day 10
    team,           // P: Đội
    round,          // Q: Vòng
    time,           // R: Thời Gian
    captain,        // S: Đội trưởng
    zaloIdCaptain,  // T: zaloID_captain
    avatarUrl,      // U: avatar_url
  ] = row;

  // Determine bot_type dựa vào role
  const botType = role === 'Đội trưởng' ? 'CAPTAIN' : 'PLAYER';

  return {
    bot_type: botType,
    status: 'pending',
    player_name: playerName,
    team_id: team,
    role: role,
    day_0_weight: parseFloat(day0) || 0,
    day_1_weight: parseFloat(day1) || 0,
    day_10_weight: parseFloat(day10) || 0,
    captain_name: captain,
    zalo_id_captain: zaloIdCaptain,
    avatar_url: avatarUrl,
    print_image: printImage === 'x' || printImage === 'X',
    created_at: new Date(),
  };
}

export async function importFromSheet(
  sheetId: string,
  range: string
): Promise<{ imported: number; errors: any[] }> {
  try {
    const rows = await fetchSheetData(sheetId, range);

    if (rows.length === 0) {
      throw new Error('No data found in sheet');
    }

    // Skip header row (row 0)
    const dataRows = rows.slice(1);

    const transformed = dataRows
      .map((row, index) => transformSheetRowToQueueItem(row, index + 1))
      .filter((item) => item.player_name); // Skip empty rows

    return {
      imported: transformed.length,
      errors: [],
    };
  } catch (error: any) {
    console.error('Import error:', error);
    throw error;
  }
}
```

**Checklist:**
- [ ] `lib/sheets.ts` created
- [ ] `fetchSheetData()` working
- [ ] `transformSheetRowToQueueItem()` mapping correct
- [ ] Test với sample data

---

#### 3. API Route `/api/import` (1 giờ)

Tạo `app/api/import/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { importFromSheet } from '@/lib/sheets';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheetId, range } = body;

    if (!sheetId || !range) {
      return NextResponse.json(
        { error: 'sheetId and range are required' },
        { status: 400 }
      );
    }

    // Import data từ sheet
    const result = await importFromSheet(sheetId, range);

    // Insert vào database (batch insert)
    const values = result.transformed.map((item) => [
      item.bot_type,
      item.status,
      item.player_name,
      item.team_id,
      item.role,
      item.day_0_weight,
      item.day_1_weight,
      item.day_10_weight,
      item.captain_name,
      item.zalo_id_captain,
      item.avatar_url,
      item.print_image,
    ]);

    // Batch insert
    for (const value of values) {
      await db.query(
        `INSERT INTO bot_queue
         (bot_type, status, player_name, team_id, role,
          day_0_weight, day_1_weight, day_10_weight,
          captain_name, zalo_id_captain, avatar_url, print_image)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        value
      );
    }

    return NextResponse.json({
      success: true,
      imported: result.imported,
      errors: result.errors,
      message: `Imported ${result.imported} rows successfully`,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import data' },
      { status: 500 }
    );
  }
}
```

**Checklist:**
- [ ] `/api/import` endpoint created
- [ ] Test với Postman
- [ ] Verify data insert vào `bot_queue`
- [ ] Error handling working

---

#### 4. GoogleSheetsImport Component (30 phút)

Tạo `components/GoogleSheetsImport.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export function GoogleSheetsImport() {
  const [sheetId, setSheetId] = useState(
    process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || ''
  );
  const [range, setRange] = useState('Sheet1!A2:U100');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId, range }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Import Success',
          description: `Imported ${result.imported} rows`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>📥 Import from Google Sheets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Sheet ID</label>
          <Input
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            placeholder="1Z9nU5cQwE..."
          />
        </div>
        <div>
          <label className="text-sm font-medium">Range</label>
          <Input
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="Sheet1!A2:U100"
          />
        </div>
        <Button onClick={handleImport} disabled={loading} className="w-full">
          {loading ? 'Importing...' : 'Import'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

Add vào `app/page.tsx`:
```typescript
import { GoogleSheetsImport } from '@/components/GoogleSheetsImport';

// ... trong main section
<section>
  <GoogleSheetsImport />
</section>
```

**Checklist:**
- [ ] Component created
- [ ] Input fields working
- [ ] Import button triggers API
- [ ] Toast shows result

---

### AFTERNOON SESSION (4 giờ)

#### 5. QueueTable Component (1.5 giờ)

Tạo `components/QueueTable.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface QueueItem {
  id: number;
  bot_type: string;
  status: string;
  player_name: string;
  team_id: string;
  created_at: string;
}

export function QueueTable() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/queue');
      const data = await response.json();
      setQueue(data.queue || []);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'running':
        return 'secondary';
      case 'success':
        return 'success';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <div>Loading queue...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Player/Team</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queue.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              No items in queue
            </TableCell>
          </TableRow>
        ) : (
          queue.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.bot_type}</TableCell>
              <TableCell>
                <Badge variant={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                {item.player_name || item.team_id}
              </TableCell>
              <TableCell>
                {new Date(item.created_at).toLocaleString()}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
```

Update `/api/queue` để return queue data:
```typescript
// app/api/queue/route.ts
const queueResult = await db.query(`
  SELECT
    id, bot_type, status, player_name, team_id, created_at
  FROM bot_queue
  ORDER BY created_at DESC
  LIMIT 10
`);

return NextResponse.json({
  stats,
  queue: queueResult.rows,
});
```

**Checklist:**
- [ ] Table component created
- [ ] Displays latest 10 queue items
- [ ] Auto-refresh working
- [ ] Status badges colored correctly

---

#### 6. Connect All Pieces & Testing (1 giờ)

**Full Flow Test:**
1. Import Google Sheets
   - [ ] Paste Sheet ID + range
   - [ ] Click Import
   - [ ] Verify toast success
   - [ ] Check database: rows inserted

2. Trigger Workflow
   - [ ] Click "Trigger" button
   - [ ] Verify toast success
   - [ ] Check n8n dashboard: execution running

3. View Queue
   - [ ] Queue table shows new items
   - [ ] Stats update correctly
   - [ ] Auto-refresh working

**Integration Tests:**
```bash
# Test import API
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -d '{"sheetId":"1Z9nU5cQwE...","range":"Sheet1!A2:U10"}'

# Test trigger API
curl -X POST http://localhost:3000/api/trigger \
  -H "Content-Type: application/json" \
  -d '{"workflowId":"nxdj3XeZAA4WscYp"}'

# Test queue API
curl http://localhost:3000/api/queue
```

**Checklist:**
- [ ] All APIs working
- [ ] UI components connected
- [ ] No console errors
- [ ] Database queries optimized

---

#### 7. Error Handling (30 phút)

**Add error boundaries:**
```typescript
// lib/errors.ts
export class APIError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    return { error: error.message, statusCode: error.statusCode };
  }
  return { error: 'Internal server error', statusCode: 500 };
}
```

**Update API routes:**
```typescript
try {
  // ... existing code
} catch (error) {
  const { error: message, statusCode } = handleAPIError(error);
  return NextResponse.json({ error: message }, { status: statusCode });
}
```

**Client-side error handling:**
- [ ] Toast notifications cho all errors
- [ ] Graceful fallbacks cho failed API calls
- [ ] Loading states for all async operations

---

#### 8. Polish UI (30 phút)

**Visual improvements:**
- [ ] Consistent spacing (padding/margins)
- [ ] Color scheme (primary/secondary colors)
- [ ] Hover effects cho buttons/cards
- [ ] Loading spinners
- [ ] Empty states (no data messages)

**Accessibility:**
- [ ] Button labels clear
- [ ] Form inputs có labels
- [ ] Color contrast sufficient
- [ ] Keyboard navigation works

---

#### 9. Deploy to Vercel (30 phút)

**Step 1: Prepare for deployment**
```bash
# Build locally to check for errors
npm run build

# Fix any build errors
```

**Step 2: Push to Git**
```bash
git add .
git commit -m "feat: MVP dashboard complete"
git push origin main
```

**Step 3: Deploy**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Step 4: Configure Environment Variables**
Trong Vercel dashboard:
- Settings → Environment Variables
- Add all variables từ `.env.local`:
  - `N8N_API_URL`
  - `N8N_API_KEY`
  - `DATABASE_URL`
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`
  - `GOOGLE_SHEET_ID`

**Step 5: Verify Deployment**
- [ ] Visit production URL
- [ ] Test trigger workflow
- [ ] Test import Google Sheets
- [ ] Check queue table loads

---

#### 10. Documentation (30 phút)

Tạo/Update `README.md`:
```markdown
# n8n Dashboard MVP

Dashboard để quản lý n8n workflows cho dự án Gen_image.

## Features

- ✅ Trigger 3 workflows từ UI
- ✅ Import data từ Google Sheets
- ✅ Monitor queue status real-time
- ✅ View execution stats

## Tech Stack

- Next.js 15 + TypeScript
- shadcn/ui + Tailwind CSS
- PostgreSQL
- n8n REST API
- Google Sheets API

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- n8n instance
- Google Cloud Service Account

### Installation

1. Clone repo:
\`\`\`bash
git clone <repo-url>
cd dashboard
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Setup environment:
\`\`\`bash
cp .env.example .env.local
# Edit .env.local với credentials
\`\`\`

4. Setup database:
\`\`\`bash
psql $DATABASE_URL < db/migration.sql
\`\`\`

5. Run dev server:
\`\`\`bash
npm run dev
\`\`\`

## Usage

### Trigger Workflow
1. Click "Trigger" button trên workflow card
2. Check toast notification
3. Verify execution trong n8n dashboard

### Import Google Sheets
1. Paste Sheet ID: `1Z9nU5cQwE...`
2. Enter range: `Sheet1!A2:U100`
3. Click "Import"
4. Check queue table for imported data

## Deployment

Deploy to Vercel:
\`\`\`bash
vercel --prod
\`\`\`

## License

Private project
```

**Checklist:**
- [ ] README.md created
- [ ] Setup instructions clear
- [ ] Environment variables documented
- [ ] Usage guide complete

---

## ✅ END OF DAY 2 CHECKLIST

### Functional Requirements
- [ ] Google Sheets import working end-to-end
- [ ] Queue table displays real-time data
- [ ] All 3 workflows triggerable
- [ ] Stats update automatically
- [ ] Deployed to Vercel successfully

### Technical Requirements
- [ ] No build errors
- [ ] No TypeScript errors
- [ ] Environment variables secured
- [ ] Database optimized
- [ ] APIs documented

### Code Quality
- [ ] Error handling implemented
- [ ] Loading states for all async ops
- [ ] Code organized and clean
- [ ] Git history clean commits

### Documentation
- [ ] README.md complete
- [ ] Environment setup documented
- [ ] API endpoints documented
- [ ] Deployment guide complete

---

## 🚨 POTENTIAL BLOCKERS

| Issue | Solution |
|-------|----------|
| Google Sheets authentication fail | Verify service account email, re-share sheet |
| Vercel build timeout | Optimize build, check dependencies |
| Database connection from Vercel | Check DATABASE_URL, verify VPS accepts connections |
| Environment variables not working | Check Vercel dashboard, redeploy |

---

## 🎉 SUCCESS METRICS

MVP hoàn thành khi:
1. ✅ Dashboard deployed và accessible
2. ✅ Workflows trigger thành công từ UI
3. ✅ Google Sheets import vào database
4. ✅ Queue monitor hiển thị real-time
5. ✅ Stats counters chính xác

---

**Previous:** [Phase 01 - Day 1](./phase-01-day1.md)
**Main Plan:** [Plan Overview](./plan.md)
