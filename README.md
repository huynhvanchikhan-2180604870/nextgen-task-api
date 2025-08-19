# Task Manager Backend

Ứng dụng quản lý task cho dự án **bán source code**.  
Stack: **Node.js + Express + MongoDB + JWT**.

---

## 🚀 Cách chạy

### 1. Cài đặt

```bash
cd backend
npm install
```

### 2. Tạo file `.env`

```bash
cp .env.example .env
```

Chỉnh `MONGO_URI` và `JWT_SECRET` nếu cần.

### 3. Chạy MongoDB

- Local MongoDB: `mongod`
- Hoặc Mongo Atlas (dán URI vào `.env`)

### 4. Chạy server

```bash
npm run dev
```

Mặc định API chạy tại: **http://localhost:4000**

---

## 🔑 Auth

- Đăng ký: `POST /api/auth/register`
- Đăng nhập: `POST /api/auth/login`

Header cần có cho các API khác:

```
Authorization: Bearer <token>
```

---

## 📂 Các nhóm API chính

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Users

- `GET /api/users?q=<keyword>`
- `GET /api/users/:id`

### Projects

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `POST /api/projects/:id/members`
- `DELETE /api/projects/:id/members/:userId`

### Tasks

- `GET /api/tasks?status=&assignee=&tag=&q=`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/comments`
- `POST /api/tasks/:id/assign` (**chỉ admin/owner**)

### Reports (Dashboard)

- `GET /api/reports/overview?scope=mine&days=30`
- `GET /api/reports/burndown?project=<id>&start=YYYY-MM-DD&end=YYYY-MM-DD`

---

## 🧪 Test bằng Postman

### Import Collection

File Postman Collection có sẵn: [postman_collection.json](./postman_collection.json)

### Cách dùng

1. Import `postman_collection.json` vào Postman.
2. Import environment (nếu cần): [postman_env.json](./postman_env.json)
3. Chạy request **Register** → **Login**.
4. Token sẽ được set tự động vào biến `token`.
5. Test các API còn lại.

---

## 📊 Quyền hạn (RBAC)

- **owner/admin (per-project)**: tạo/sửa project, thêm thành viên, assign task.
- **member**: nhận & update task được assign.
- **viewer**: chỉ xem.

---

## 📎 Tệp Postman

### postman_collection.json

```json
{
  "info": {
    "name": "Task Manager API",
    "_postman_id": "12345678-abcd-efgh-ijkl-1234567890ab",
    "description": "Collection test API Task Manager",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth - Register",
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "url": "{{baseUrl}}/api/auth/register",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Admin\",\n  \"email\": \"admin@example.com\",\n  \"password\": \"secret\",\n  \"role\": \"admin\"\n}"
        }
      }
    },
    {
      "name": "Auth - Login",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "var jsonData = pm.response.json();",
              "if (jsonData.token) {",
              "   pm.environment.set('token', jsonData.token);",
              "}"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "url": "{{baseUrl}}/api/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"admin@example.com\",\n  \"password\": \"secret\"\n}"
        }
      }
    },
    {
      "name": "Projects - Create",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Content-Type", "value": "application/json" },
          { "key": "Authorization", "value": "Bearer {{token}}" }
        ],
        "url": "{{baseUrl}}/api/projects",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\":\"Marketplace Source Code\",\n  \"key\":\"MSC\",\n  \"description\":\"Dự án bán source code\"\n}"
        }
      }
    },
    {
      "name": "Tasks - Create",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Content-Type", "value": "application/json" },
          { "key": "Authorization", "value": "Bearer {{token}}" }
        ],
        "url": "{{baseUrl}}/api/tasks",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"project\": \"{{projectId}}\",\n  \"title\": \"Thiết kế kiến trúc\",\n  \"status\": \"in_progress\",\n  \"priority\": \"high\",\n  \"progress\": 30\n}"
        }
      }
    },
    {
      "name": "Reports - Overview",
      "request": {
        "method": "GET",
        "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
        "url": "{{baseUrl}}/api/reports/overview?scope=mine&days=30"
      }
    }
  ]
}
```

### postman_env.json

```json
{
  "id": "1234abcd-5678-efgh-ijkl-9876543210",
  "name": "Task Manager Env",
  "values": [
    { "key": "baseUrl", "value": "http://localhost:4000", "enabled": true },
    { "key": "token", "value": "", "enabled": true },
    { "key": "projectId", "value": "", "enabled": true }
  ],
  "_postman_variable_scope": "environment",
  "_postman_exported_using": "Postman/10.23.2"
}
```
