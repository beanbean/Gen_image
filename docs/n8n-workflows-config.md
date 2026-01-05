# n8n Workflows Configuration

## Workflows chính trong dự án Gen_image

### 1. Render Player Progress
- **Workflow ID:** `nxdj3XeZAA4WscYp`
- **Tên:** `1.Render_image_progress_player`
- **Trạng thái:** Inactive
- **Chức năng:** Render ảnh tiến độ cá nhân của người chơi

### 2. Render Team Leaderboard
- **Workflow ID:** `9fD7jTNV9LbMYGJu`
- **Tên:** `2.Render_team_leaderboard`
- **Trạng thái:** Inactive
- **Chức năng:** Render ảnh bảng xếp hạng đội

### 3. Send Image Zalo Captain
- **Workflow ID:** `Cxhi6bFhwv0XbUF4`
- **Tên:** `3.send_image_zalo_captain`
- **Trạng thái:** Inactive
- **Chức năng:** Gửi ảnh qua Zalo cho đội trưởng

## Workflows liên quan khác

### WF4 - Daily Leaderboard Broadcast
- **Workflow ID:** `CaYmVJdAAlwxVJaD`
- **Chức năng:** Broadcast leaderboard hàng ngày

### WF5 - Render & Push Leaderboard
- **Workflow ID:** `j87LOet7CxPN8INB`
- **Chức năng:** Render và push bảng xếp hạng

### Workers (Support workflows)
- `Worker_P5_ViewProgress_V2_Render` (RTKgr3eE5VlElrMM)
- `Worker_Player_Log` (e0QImaMVEBGd90Yg)
- `Worker_C1_ViewTeam` (FnE7rWEvdY9O7CzS)
- `Worker_Captain_Report` (A7mnI9Me8DOmLION)
- `Worker_Player_General` (ylGoHutyN5Okym9R)
- `WORKER: Zalo NOTIFY` (scPaqxbqRIhjNahh)

## API Configuration

### Base URL
```
https://workflow.nexme.vn
```

### API Endpoints

#### Trigger Workflow
```bash
POST /api/v1/workflows/{workflowId}/execute
Headers:
  X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNjFmZmIxYy00ODNjLTQ3YjUtOTg5ZC1iYzJiNWQ1YjM3NzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY3MjQ2NTA1fQ.wRd6jgQh73FXPWeW_Rn7b1UXXI_L8PGU_3JO6GcQOTg
  Content-Type: application/json

Body:
  {
    "data": {
      "player_id": "123",
      "team_id": "team-a"
    }
  }
```

#### Get Execution Status
```bash
GET /api/v1/executions/{executionId}
Headers:
  X-N8N-API-KEY: ...
```

#### List All Executions
```bash
GET /api/v1/executions?workflowId={workflowId}&status=success&limit=50
Headers:
  X-N8N-API-KEY: ...
```

## Example: Trigger từ Dashboard

### JavaScript/TypeScript
```typescript
const triggerWorkflow = async (workflowId: string, data: any) => {
  const response = await fetch(
    `https://workflow.nexme.vn/api/v1/workflows/${workflowId}/execute`,
    {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    }
  );

  return response.json();
};

// Usage
const result = await triggerWorkflow('nxdj3XeZAA4WscYp', {
  player_name: 'John Doe',
  team_id: 'team-a',
  day: 5
});

console.log('Execution ID:', result.data.executionId);
```

### Polling Status
```typescript
const pollExecutionStatus = async (executionId: string) => {
  const response = await fetch(
    `https://workflow.nexme.vn/api/v1/executions/${executionId}`,
    {
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY!,
      },
    }
  );

  const data = await response.json();
  return {
    status: data.data.status, // 'running' | 'success' | 'error'
    startedAt: data.data.startedAt,
    finishedAt: data.data.finishedAt,
  };
};

// Poll every 2 seconds
const interval = setInterval(async () => {
  const status = await pollExecutionStatus(executionId);

  if (status.status !== 'running') {
    clearInterval(interval);
    console.log('Workflow completed:', status);
  }
}, 2000);
```

## Dashboard Integration Plan

### Workflow Cards
```tsx
const workflows = [
  {
    id: 'nxdj3XeZAA4WscYp',
    name: 'Render Player Progress',
    description: 'Tạo ảnh tiến độ cá nhân',
    type: 'PLAYER',
  },
  {
    id: '9fD7jTNV9LbMYGJu',
    name: 'Render Team Leaderboard',
    description: 'Tạo ảnh bảng xếp hạng đội',
    type: 'TEAM',
  },
  {
    id: 'Cxhi6bFhwv0XbUF4',
    name: 'Send to Zalo Captain',
    description: 'Gửi ảnh qua Zalo cho đội trưởng',
    type: 'ZALO',
  },
];
```

## Notes

- Tất cả workflows hiện đang ở trạng thái **Inactive**
- Cần activate workflows trước khi sử dụng production
- API key được cung cấp có quyền trigger và monitor executions
- Dashboard sẽ sử dụng REST API thay vì webhooks để có control tốt hơn
