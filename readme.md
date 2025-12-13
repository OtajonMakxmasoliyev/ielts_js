# 🔐 IELTS JS - Authentication API Documentation

## Base URL
```
http://localhost:3000
```

---

## 📋 Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [API Endpoints](#api-endpoints)
   - [Register](#1-register)
   - [Login](#2-login)
   - [Get Devices](#3-get-devices)
   - [Delete Device](#4-delete-device)
   - [Refresh Token](#5-refresh-token)
3. [Token Management](#token-management)
4. [Error Codes](#error-codes)

---

## 🔄 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ 1. REGISTER  │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  2. LOGIN    │
    └──────┬───────┘
           │
           ├────► [Tanish qurilma] ──────► access_token + refresh_token ✅
           │
           └────► [Yangi qurilma] ───┐
                                      │
                                      ▼
                              ┌───────────────┐
                              │ 3. GET DEVICES│
                              └───────┬───────┘
                                      │
                                      ▼
                              ┌────────────────────┐
                              │ 4. DELETE DEVICE   │
                              │    (optional)      │
                              └─────────┬──────────┘
                                        │
                                        └──► Qaytadan LOGIN ga o'tish

    ┌──────────────────┐
    │ 5. REFRESH TOKEN │ ◄── access_token finishedda
    └──────────────────┘
```

---

## 📡 API Endpoints

### 1. REGISTER
Yangi foydalanuvchini ro'yxatdan o'tkazish

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "otajonmaxmasoliyev3112@gmail.com",
  "password": "string",
  "deviceId": "038f270ca678c66f5bf393f958e8eebcf98b049e5a0d32a69cabf46b576cabbf"
}
```

**Success Response (200):**
```json
{
  "email": "otajonmaxmasoliyev3112@gmail.com",
  "role": "student",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400):**
```json
{
  "error": {
    "code": "EXIST_USER",
    "message": "User already exist"
  }
}
```

**cURL Example:**
```bash
curl -X 'POST' \
  'http://localhost:3000/auth/register' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "otajonmaxmasoliyev3112@gmail.com",
  "password": "string",
  "deviceId": "038f270ca678c66f5bf393f958e8eebcf98b049e5a0d32a69cabf46b576cabbf"
}'
```

**Notes:**
- `deviceId` - Qurilmaning unikal hash identifikatori (SHA-256 format)
- Register muvaffaqiyatli bo'lsa, birinchi device avtomatik qo'shiladi
- Default role: `student`

---

### 2. LOGIN
Tizimga kirish

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "otajonmaxmasoliyev3112@gmail.com",
  "password": "string",
  "deviceId": "038f270ca678c66f5bf393f958e8eebcf98b049e5a0d32a69cabf46b576cabbf"
}
```

**Success Response - Tanish qurilma (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTRhNmU1ZmY4ZjQ1YmQ1YjJlNzIwNiIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzYyOTYxMTg1LCJleHAiOjE3NjMwNDc1ODV9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTRhNmU1ZmY4ZjQ1YmQ1YjJlNzIwNiIsImRldmljZUlkIjoiMDM4ZjI3MGNhNjc4YzY2ZjViZjM5M2Y5NThlOGVlYmNmOThiMDQ5ZTVhMGQzMmE2OWNhYmY0NmI1NzZjYWJiZiIsImlhdCI6MTc2Mjk2MTE4NSwiZXhwIjoxNzYzNTY1OTg1fQ...",
  "email": "otajonmaxmasoliyev3112@gmail.com"
}
```

**Response - Yangi qurilma aniqlandi (200):**
```json
{
  "redirect": "REFRESH_DEVICES"
}
```

**Error Response (400):**
```json
{
  "error": "Invalid credentials"
}
```

**cURL Example:**
```bash
curl -X 'POST' \
  'http://localhost:3000/auth/login' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "otajonmaxmasoliyev3112@gmail.com",
  "password": "string",
  "deviceId": "038f270ca678c66f5bf393f958e8eebcf98b049e5a0d32a69cabf46b576cabbf"
}'
```

**Important Logic:**
- Agar `deviceId` avval login qilingan qurilma bo'lsa → tokenlar qaytaradi
- Agar `deviceId` yangi qurilma bo'lsa → `redirect: "REFRESH_DEVICES"` qaytaradi
- `redirect` kelsa, `GET /auth/devices` endpointiga murojaat qiling

---

### 3. GET DEVICES
Foydalanuvchining barcha qurilmalarini olish

**Endpoint:** `POST /auth/devices`

**Request Body:**
```json
{
  "email": "otajonmaxmasoliyev3112@gmail.com"
}
```

**Success Response (200):**
```json
{
  "devices": [
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "deviceId": "038f270ca678c66f5bf393f958e8eebcf98b049e5a0d32a69cabf46b576cabbf", // Date gettimeni sha256ga o'girilgani
      "lastUsed": "2025-11-12T15:25:25.780Z",
      "_id": "6914a6e5ff8f45bd5b2e7208"
    }
  ]
}
```

**Error Response (404):**
```json
{
  "error": "User not found"
}
```

**cURL Example:**
```bash
curl -X 'POST' \
  'http://localhost:3000/auth/devices' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "otajonmaxmasoliyev3112@gmail.com"
}'
```

**Use Case:**
- Login vaqtida `redirect: "REFRESH_DEVICES"` kelganda chaqiriladi
- User barcha qurilmalarni ko'radi va o'chirmoqchi bo'lgan qurilmani tanlaydi
- Yoki hamma qurilmalarni tasdiqlaydi

---

### 4. DELETE DEVICE
Muayyan qurilmani o'chirish

**Endpoint:** `POST /auth/delete-device`

**Request Body:**
```json
{
  "email": "otajonmaxmasoliyev3112@gmail.com",
  "deviceId": "old-device-id-to-remove"
}
```

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Response (404):**
```json
{
  "error": "User not found"
}
```

**cURL Example:**
```bash
curl -X 'POST' \
  'http://localhost:3000/auth/delete-device' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "otajonmaxmasoliyev3112@gmail.com",
  "deviceId": "038f270ca678c66f5bf393f958e8eebcf98b049e5a0d32a69cabf46b576cabbf"
}
```

**Next Steps:**
- Qurilma o'chirilgandan keyin, qaytadan `POST /auth/login` ga murojaat qiling
- Bu safar yangi deviceId qo'shiladi va tokenlar beriladi

---

### 5. REFRESH TOKEN
Access tokenni yangilash

**Endpoint:** `POST /auth/refresh`

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "error": "Invalid refresh token"
}
```

**cURL Example:**
```bash
curl -X 'POST' \
  'http://localhost:3000/auth/refresh' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}'
```

**Use Case:**
- `access_token` expired_date finishedda (1 kun)
- Refresh token ham tugasa (7 kun) → qaytadan LOGIN qiling

---

## 🔑 Token Management

### Token Expiry Times

| Token Type | Expiry Time | Purpose | Refresh Method |
|-----------|-------------|---------|----------------|
| **Access Token** | 1 day (24 hours) | API requests uchun | `POST /auth/refresh` |
| **Refresh Token** | 7 days | Access token yangilash uchun | `POST /auth/login` |

### Token Structure

**Access Token Payload:**
```json
{
  "id": "6914a6e5ff8f45bd5b2e7206",
  "role": "student",
  "iat": 1762961185,
  "exp": 1763047585
}
```

**Refresh Token Payload:**
```json
{
  "id": "6914a6e5ff8f45bd5b2e7206",
  "deviceId": "038f270ca678c66f5bf393f958e8eebcf98b049e5a0d32a69cabf46b576cabbf",
  "iat": 1762961185,
  "exp": 1763565985
}
```

---

## 🛡️ Security Features

### Device Management
- Har bir user uchun multiple devices qo'llab-quvvatlanadi
- Har bir device uchun alohida refresh token saqlanadi
- `deviceId` - qurilmaning SHA-256 hash identifikatori

### Device ID Generation

**Browser (Frontend):**
```javascript
const deviceId = crypto.createHash('sha256')
  .update(navigator.userAgent + navigator.platform)
  .digest('hex');
```

**Mobile:**
- iOS: `identifierForVendor`
- Android: `Settings.Secure.ANDROID_ID`

### Device Authorization Flow
1. User yangi qurilmadan login qiladi
2. Server `redirect: "REFRESH_DEVICES"` qaytaradi
3. Frontend barcha qurilmalar ro'yxatini ko'rsatadi
4. User eski qurilmani o'chiradi yoki hamma qurilmani tasdiqlaydi
5. Qaytadan login qilib, tokenlarni oladi

---

## ❌ Error Codes

| HTTP Code | Error Type | Description |
|-----------|-----------|-------------|
| 200 | Success | Request muvaffaqiyatli bajarildi |
| 400 | Bad Request | Invalid credentials yoki ma'lumot xato |
| 404 | Not Found | User topilmadi |
| 401 | Unauthorized | Token yaroqsiz yoki expired_date finished |

---

## 📝 Response Headers Example

```
access-control-allow-origin: *
connection: keep-alive
content-type: application/json; charset=utf-8
date: Wed, 12 Nov 2025 15:26:25 GMT
x-powered-by: Express
```

---

## 🔄 Complete Integration Example

### Step-by-Step Frontend Integration

#### 1. User Registration
```javascript
const register = async (email, password) => {
  const deviceId = generateDeviceId();

  const response = await fetch('http://localhost:3000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, deviceId })
  });

  const data = await response.json();

  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
    return { success: true, data };
  }

  return { success: false, error: data.error };
};
```

#### 2. User Login
```javascript
const login = async (email, password) => {
  const deviceId = generateDeviceId();

  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, deviceId })
  });

  const data = await response.json();

  if (data.redirect === 'REFRESH_DEVICES') {
    // Show device management screen
    return { redirect: true };
  }

  if (data.access_token && data.refresh_token) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return { success: true };
  }

  return { success: false, error: data.error };
};
```

#### 3. Get Devices
```javascript
const getDevices = async (email) => {
  const response = await fetch('http://localhost:3000/auth/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await response.json();
  return data.devices;
};
```

#### 4. Delete Device
```javascript
const deleteDevice = async (email, deviceId) => {
  const response = await fetch('http://localhost:3000/auth/delete-device', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, deviceId })
  });

  const data = await response.json();
  return data.success;
};
```

#### 5. Refresh Token
```javascript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');

  const response = await fetch('http://localhost:3000/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${refreshToken}`
    },
    body: JSON.stringify({ refreshToken })
  });

  const data = await response.json();

  if (data.accessToken) {
    localStorage.setItem('access_token', data.accessToken);
    return true;
  }

  return false;
};
```

#### 6. Device ID Generator
```javascript
const generateDeviceId = () => {
  const data = navigator.userAgent + navigator.platform + screen.width + screen.height;

  // Simple hash function for browser
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16).padStart(64, '0');
};
```

---

---

## 🔧 Swagger UI - Token o'rnatish qo'llanmasi

Swagger UI'da JWT token bilan protected endpointlarni test qilish uchun:

### 1. Swagger UI'ni oching
```
http://localhost:3000/api-docs
```

### 2. Login qiling va token oling

1. **`POST /auth/login`** endpointini oching
2. "Try it out" tugmasini bosing
3. Request body'ga ma'lumotlaringizni kiriting:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "deviceId": "038f270ca678c66f5bf393f958e8eebcf98b049e5a0d32a69cabf46b576cabbf"
}
```
4. **Execute** tugmasini bosing
5. Response'dan `access_token` ni nusxalang (copy qiling)

### 3. Tokenni Swagger'ga o'rnating

1. Swagger UI'ning yuqori qismidagi **🔓 Authorize** tugmasini bosing
2. "bearerAuth" modal oynasi ochiladi
3. **Value** maydoniga `access_token` ni qo'ying (faqat token, "Bearer" so'zini qo'shmaslik kerak!)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTRh...
   ```
4. **Authorize** tugmasini bosing
5. **Close** tugmasini bosing

### 4. Protected endpointlarni test qiling

Endi `/questions/*` endpointlari tokenli ishlaydi:
- `/questions/list` - barcha savollarni olish
- `/questions/create` - yangi savol yaratish
- `/questions/get-one` - bitta savolni olish
- `/questions/update` - savolni yangilash
- `/questions/delete` - savolni o'chirish
- `/questions/check-answers` - javoblarni tekshirish

Har bir request'da avtomatik ravishda `Authorization: Bearer <token>` header qo'shiladi.

### 5. Tokenni o'chirish

Tokenni o'chirish uchun:
1. **🔓 Authorize** tugmasini bosing
2. **Logout** tugmasini bosing

---

## 📞 Support

Bu API IELTS JS backend tizimi uchun authentication va device management funksiyalarini ta'minlaydi.

**Base URL:** `http://localhost:3000`
**Swagger Docs:** `http://localhost:3000/api-docs`
**Version:** 1.0.0
**Last Updated:** 2025-11-12
