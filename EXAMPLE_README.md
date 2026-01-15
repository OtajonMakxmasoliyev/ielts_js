# IELTS JS - To'liq Dokumentatsiya

Bu hujjat IELJS platformasining barcha xususiyatlari, API endpointlari va ishlash mantiqlarini o'z ichiga oladi.

---

## Mundarija

1. [Umumiy Ma'lumot](#umumiy-malumot)
2. [Arxitektura](#arxitektura)
3. [Avtorizatsiya Tizimi](#avtorizatsiya-tizimi)
4. [Tariflar va Obuna Tizimi](#tariflar-va-obuna-tizimi)
5. [Promokod va Referral Tizimi](#promokod-va-referral-tizimi)
6. [Testlar va Javoblar](#testlar-va-javoblar)
7. [Degree Based Filtrlash](#degree-based-filtrlash)
8. [API Reference](#api-reference)

---

## Umumiy Ma'lumot

**IELTS JS** - IELTS imtihoniga tayyorlanish uchun onlayn platforma.

### Texnologiyalar
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (JSON Web Token)
- **API Docs**: Swagger UI

### Port
- Development: `http://localhost:3000`
- API Docs: `http://localhost:3000/api-docs`

---

## Arxitektura

```
src/
├── models/              # Ma'lumotlar bazasi modellari
│   ├── User.js         # Foydalanuvchi
│   ├── Question.js     # Savol/Imtihon
│   ├── Part.js         # Savol qismlari
│   ├── Subscription.js # Obuna
│   ├── Tarif.js        # Narxlar
│   └── Promo.js        # Promokodlar
│
├── routes/             # API marshrutlari
│   ├── auth/          # Login, Register
│   ├── questions/     # Testlar
│   ├── subscription/  # Obuna boshqaruv
│   ├── tarif/         # Narxlar boshqaruv
│   └── promo/         # Promokodlar
│
├── services/           # Biznes mantiq
│   ├── auth.js        # Auth servis
│   └── questions.js   # Javob tekshirish
│
├── middleware/         # Middleware
│   └── auth.js        # JWT tekshiruv
│
├── utils/              # Yordamchi funksiyalar
│   └── validators.js  # Validatsiya
│
└── enums/              # Konstantalar
    └── error.enum.js  # Xatolik turlari
```

---

## Avtorizatsiya Tizimi

### JWT Tokenizatsiya

| Token | Muddat | Maqsad |
|-------|--------|--------|
| Access Token | 1 kun | API so'rovlari uchun |
| Refresh Token | 7 kun | Token yangilash uchun |

### Ro'yxatdan o'tish (Register)

Har qanday yangi foydalanuvchi ro'yxatdan o'tganda:

1. **Default FREE obuna** avtomatik yaratiladi
2. **5 ta bepul test** beriladi
3. Agar promokod kiritilsa - pulli obuna beriladi

#### Endpoint: `POST /auth/register`

```bash
# Promokodsiz ro'yxatdan o'tish (Free user)
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Promokod bilan ro'yxatdan o'tish
{
  "email": "user@example.com",
  "password": "password123",
  "promoCode": "INFLUENCER_CODE"
}
```

#### Response (Free User):
```json
{
  "email": "user@example.com",
  "role": "student",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "promoApplied": false,
  "hasFreeSubscription": true
}
```

#### Response (Promokod bilan):
```json
{
  "email": "user@example.com",
  "role": "student",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "promoApplied": true,
  "hasFreeSubscription": false
}
```

### Login qilish

#### Endpoint: `POST /auth/login`

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "role": "student"
}
```

### Token yangilash

#### Endpoint: `POST /auth/refresh`

```bash
POST /auth/refresh
Content-Type: application/json

{
  "userId": "USER_ID_HERE",
  "refreshToken": "REFRESH_TOKEN_HERE"
}
```

#### Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Joriy foydalanuvchi ma'lumotlari

#### Endpoint: `POST /auth/get-current-user`

```bash
POST /auth/get-current-user
Authorization: Bearer <access_token>
```

#### Response:
```json
{
  "_id": "65fa12ab34cd...",
  "email": "user@example.com",
  "role": "student",
  "active": true,
  "createdAt": "2025-01-15T10:00:00.000Z"
}
```

---

## Tariflar va Obuna Tizimi

### Tarif Turlari

| Turi | Tavsif | Testlar | Muddat |
|------|--------|---------|--------|
| **Free** | Bepul | 5 ta cheklangan | Muddatsiz |
| **Package** | Paket | Cheklangan (masalan: 50 ta) | Muddatsiz |
| **Premium** | Premium | Cheksiz | Ma'lum muddat (masalan: 30 kun) |

### Degree (Daraja) Tizimi

Har bir tarifda `degree` maydoni mavjud:

| Degree | Tavsif | Qachon beriladi |
|--------|--------|-----------------|
| `free` | Bepul testlar | Ro'yxatdan o'tganda |
| `limited` | Pulli testlar | Tarif sotib olinganda |

### Tariflar ro'yxati

#### Endpoint: `POST /tarif/list`

```bash
POST /tarif/list
```

#### Response:
```json
{
  "packages": [
    {
      "_id": "65fa12ab34cd...",
      "name": "Basic Package",
      "type": "package",
      "degree": "limited",
      "tests_count": 50,
      "price": 99000,
      "duration_days": null,
      "active": true
    }
  ],
  "premiums": [
    {
      "_id": "65fb98de12aa...",
      "name": "Monthly Premium",
      "type": "premium",
      "degree": "limited",
      "tests_count": null,
      "price": 149000,
      "duration_days": 30,
      "active": true
    }
  ],
  "all": [...]
}
```

### Tarif sotib olish

#### Endpoint: `POST /subscription/buy`

```bash
POST /subscription/buy
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "tarifId": "65fa12ab34cd..."
}
```

#### Response (Package):
```json
{
  "message": "Paket muvaffaqiyatli sotib olindi",
  "subscription": {
    "_id": "6600ab7789ff...",
    "userId": "65fa12ab34cd...",
    "tarifId": {
      "_id": "65fa12ab34cd...",
      "name": "Basic Package",
      "type": "package",
      "degree": "limited",
      "tests_count": 50,
      "price": 99000
    },
    "type": "package",
    "tests_count": 50,
    "active": true,
    "remaining_tests": 50
  }
}
```

#### Response (Premium):
```json
{
  "message": "Premium muvaffaqiyatli sotib olindi",
  "subscription": {
    "_id": "6600ab7789ff...",
    "userId": "65fa12ab34cd...",
    "tarifId": {
      "_id": "65fb98de12aa...",
      "name": "Monthly Premium",
      "type": "premium",
      "degree": "limited",
      "tests_count": null,
      "price": 149000,
      "duration_days": 30
    },
    "type": "premium",
    "tests_count": null,
    "active": true,
    "expired_date": "2026-02-14T10:00:00.000Z"
  }
}
```

### Mening obunam

#### Endpoint: `POST /subscription/my`

```bash
POST /subscription/my
Authorization: Bearer <access_token>
```

#### Response:
```json
{
  "_id": "6600ab7789ff...",
  "userId": "65fa12ab34cd...",
  "tarifId": {
    "_id": "65fa12ab34cd...",
    "name": "Basic Package",
    "type": "package",
    "degree": "limited",
    "tests_count": 50,
    "price": 99000
  },
  "type": "package",
  "tests_count": 50,
  "used": [],
  "active": true,
  "remaining_tests": 50,
  "finished": false
}
```

### Obunani tekshirish

#### Endpoint: `POST /subscription/check`

```bash
POST /subscription/check
Authorization: Bearer <access_token>
```

#### Response (Aktiv):
```json
{
  "canTakeTest": true,
  "message": "Paket aktiv. Qolgan: 45 ta test",
  "subscription": {
    "_id": "6600ab7789ff...",
    "type": "package",
    "tarifId": {...},
    "remaining_tests": 45
  }
}
```

#### Response (Tugagan):
```json
{
  "canTakeTest": false,
  "message": "Paket limiti tugagan. 50 ta testdan 50 tasi ishlangan.",
  "subscription": {
    "_id": "6600ab7789ff...",
    "type": "package",
    "finished": true
  }
}
```

### Testlar tarixi

#### Endpoint: `POST /subscription/history`

```bash
POST /subscription/history
Authorization: Bearer <access_token>
```

#### Response:
```json
{
  "subscriptions": [
    {
      "type": "package",
      "tarif": {
        "name": "Basic Package",
        "degree": "limited"
      },
      "tests_count": 50,
      "used_count": 5,
      "remaining_count": 45,
      "expired_date": null
    }
  ],
  "history": [
    {
      "_id": "6600ab7789ff...",
      "testId": {
        "_id": "65fa12ab34cd...",
        "title": "IELTS Reading Test",
        "type": "reading",
        "slug": "ielts-reading-test"
      },
      "score": 85.5,
      "used_time": "2025-01-15T10:30:00.000Z",
      "subscription_type": "package"
    }
  ]
}
```

---

## Promokod va Referral Tizimi

### Influencer Program

Tizim influencerlarni rag'batlantirish uchun promokod tizimiga ega:

1. **Influencer** o'z promokodini oladi
2. **Yangi foydalanuvchi** promokod bilan ro'yxatdan o'tadi
3. **Har 3 ta (sozlanishi mumkin)** odam kelganda - influencerga bonus testlar beriladi

### Promokod yaratish (Admin)

#### Endpoint: `POST /promo/create`

```bash
POST /promo/create
Content-Type: application/json

{
  "code": "UMID_IELTS",
  "tarifId": "65fa12ab34cd...",        // Yangi foydalanuvchi oladigan tarif
  "ownerId": "65fb98de12aa...",         // Influencer (User) ID
  "rewardTarifId": "6600ab7789ff...",   // Influencerga beriladigan paket
  "required_referrals": 5,              // Har 5 ta odamda bonus
  "usage_limit": 100,                   // Maksimal ishlatish
  "expire_date": "2026-12-31T23:59:59.000Z"
}
```

#### Response:
```json
{
  "_id": "6700bc8890aa...",
  "code": "UMID_IELTS",
  "tarifId": "65fa12ab34cd...",
  "ownerId": "65fb98de12aa...",
  "rewardTarifId": "6600ab7789ff...",
  "required_referrals": 5,
  "reward_tests": 10,
  "used_count": 0,
  "usage_limit": 100,
  "expire_date": "2026-12-31T23:59:59.000Z",
  "active": true
}
```

### Promokodlar ro'yxati

#### Endpoint: `POST /promo/list`

```bash
POST /promo/list
```

#### Response:
```json
[
  {
    "_id": "6700bc8890aa...",
    "code": "UMID_IELTS",
    "tarifId": {
      "name": "Basic Package",
      "type": "package",
      "tests_count": 50,
      "price": 99000
    },
    "ownerId": {
      "_id": "65fb98de12aa...",
      "email": "influencer@example.com",
      "role": "student"
    },
    "rewardTarifId": {
      "name": "Bonus Package",
      "type": "package",
      "tests_count": 10,
      "price": 0
    },
    "used_count": 12,
    "usage_limit": 100,
    "expire_date": "2026-12-31T23:59:59.000Z",
    "active": true
  }
]
```

### Promokod statistikasi

#### Endpoint: `POST /promo/stats`

```bash
POST /promo/stats
Content-Type: application/json

{
  "code": "UMID_IELTS"
}
```

#### Response:
```json
{
  "promo": {
    "_id": "6700bc8890aa...",
    "code": "UMID_IELTS",
    "used_count": 12,
    "required_referrals": 5,
    "usage_limit": 100
  },
  "stats": {
    "used_count": 12,
    "remaining": 88,
    "usage_limit": 100,
    "progress_to_next_reward": 3,
    "total_rewards_earned": 2,
    "is_active": true,
    "expired": false
  }
}
```

### Promokodni o'chirish

#### Endpoint: `POST /promo/deactivate`

```bash
POST /promo/deactivate
Content-Type: application/json

{
  "id": "6700bc8890aa..."
}
```

#### Response:
```json
{
  "message": "Promokod o'chirildi",
  "promo": {
    "_id": "6700bc8890aa...",
    "code": "UMID_IELTS",
    "active": false
  }
}
```

---

## Testlar va Javoblar

### Savol yaratish

#### Endpoint: `POST /questions/create`

```bash
POST /questions/create
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "IELTS Reading Test - Advanced",
  "type": "reading",
  "slug": "ielts-reading-advanced",
  "metadata": {
    "degree": "limited",
    "difficulty": "advanced",
    "duration": 60,
    "totalQuestions": 40
  },
  "tags": ["reading", "advanced", "practice"],
  "published": true,
  "parts": [
    {
      "markdown": "## Part 1: Multiple Choice\n\nRead the text and answer...",
      "answers": [
        "Britain",
        ["late 18th century", "18th century", "1700s"],
        ["rural", "rural societies"]
      ],
      "part_type": ["READING_MCQ"],
      "collection_id": "65fa12ab34cd..."
    },
    {
      "markdown": "## Part 2: True/False/Not Given\n\n...",
      "answers": [
        ["false", "f"],
        ["true", "t"],
        ["false", "f"],
        ["not given", "ng"],
        ["not given", "ng"]
      ],
      "part_type": ["READING_TFNG"],
      "collection_id": "65fa12ab34cd..."
    }
  ]
}
```

#### Response:
```json
{
  "_id": "6700bc8890bb...",
  "title": "IELTS Reading Test - Advanced",
  "type": "reading",
  "slug": "ielts-reading-advanced",
  "metadata": {
    "degree": "limited",
    "difficulty": "advanced",
    "duration": 60,
    "totalQuestions": 40
  },
  "tags": ["reading", "advanced", "practice"],
  "published": true,
  "parts": [
    "6700bc8890cc...",
    "6700bc8890dd..."
  ],
  "createdAt": "2025-01-15T10:00:00.000Z"
}
```

### Testlar ro'yxati (Degree bo'yicha)

#### Endpoint: `POST /questions/list`

```bash
POST /questions/list
Authorization: Bearer <access_token>
```

#### Response (Free user):
```json
{
  "degree": "free",
  "subscription": {
    "type": "package",
    "degree": "free",
    "remaining_tests": 5,
    "tarif_name": "Free"
  },
  "questions": [
    {
      "_id": "6700bc8890bb...",
      "title": "IELTS Reading Test - Basic",
      "type": "reading",
      "slug": "ielts-reading-basic",
      "metadata": {
        "degree": "free",
        "difficulty": "beginner",
        "duration": 20
      },
      "published": true
    }
  ],
  "total": 5
}
```

#### Response (Premium user):
```json
{
  "degree": "limited",
  "subscription": {
    "type": "premium",
    "degree": "limited",
    "remaining_tests": null,
    "tarif_name": "Monthly Premium"
  },
  "questions": [
    {
      "_id": "6700bc8890bb...",
      "title": "IELTS Reading Test - Advanced",
      "type": "reading",
      "slug": "ielts-reading-advanced",
      "metadata": {
        "degree": "limited",
        "difficulty": "advanced",
        "duration": 60
      },
      "published": true
    }
  ],
  "total": 50
}
```

### Bitta savolni olish

#### Endpoint: `POST /questions/get-one`

```bash
POST /questions/get-one
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "id": "6700bc8890bb..."
}
```

#### Response:
```json
{
  "_id": "6700bc8890bb...",
  "title": "IELTS Reading Test - Advanced",
  "type": "reading",
  "parts": [
    {
      "_id": "6700bc8890cc...",
      "markdown": "## Part 1: Multiple Choice\n\n...",
      "answers": [
        "Britain",
        ["late 18th century", "18th century", "1700s"]
      ],
      "part_type": ["READING_MCQ"],
      "collection_id": "6700bc8890bb..."
    }
  ],
  "metadata": {
    "degree": "limited",
    "difficulty": "advanced"
  }
}
```

### Javoblarni tekshirish

#### Endpoint: `POST /questions/check-answers`

```bash
POST /questions/check-answers
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "questionId": "6700bc8890bb...",
  "answers": [
    "Britain",
    "late 18th century",
    "rural",
    "false",
    "true",
    "false",
    "not given",
    "not given"
  ]
}
```

#### Response:
```json
{
  "examId": "6700bc8890bb...",
  "questions": {...},
  "results": [100, 100, 100, 100, 100, 100, 100, 100],
  "detailed": [
    {
      "partIndex": 0,
      "questionIndex": 0,
      "globalIndex": 0,
      "correct": "Britain",
      "student": "Britain",
      "percent": 100,
      "isCorrect": true
    },
    {
      "partIndex": 0,
      "questionIndex": 1,
      "globalIndex": 1,
      "correct": ["late 18th century", "18th century", "1700s"],
      "student": "late 18th century",
      "percent": 100,
      "isCorrect": true
    }
  ],
  "score": 100,
  "total": 8,
  "correctCount": 8,
  "incorrectCount": 0,
  "answers": [...],
  "submittedAt": "2025-01-15T10:30:00.000Z",
  "subscription_info": {
    "type": "package",
    "remaining_tests": 4,
    "used_total": 1,
    "expires_at": null
  }
}
```

---

## Degree Based Filtrlash

### Ishlash Mantiqi

```
┌─────────────────────────────────────────────────────────────┐
│                    Yangi User                               │
│                    Register                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  FREE obuna yaratiladi│
            │  - 5 ta bepul test    │
            │  - degree: "free"     │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   Testlar ro'yxati     │
            │   metadata.degree:    │
            │   "free"              │
            └───────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│                   Promokod bilan                           │
│                   Register                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   FREE obuna yaratiladi│
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Promokod tekshiriladi │
            │  Pulli obuna beriladi  │
            │  FREE o'chiriladi      │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   Testlar ro'yxati     │
            │   metadata.degree:    │
            │   "limited"            │
            └───────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│                   Tarif Sotib Olsa                         │
│                   (Package/Premium)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │    Yangi obuna        │
            │    degree: "limited"  │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   Testlar ro'yxati     │
            │   metadata.degree:    │
            │   "limited"            │
            │   (yaxshiroq testlar)  │
            └───────────────────────┘
```

### Testlarni Degree bilan yaratish

#### Free test (bepul):
```javascript
await Question.create({
    title: "IELTS Reading - Basic Test",
    type: "reading",
    slug: "ielts-reading-basic",
    metadata: {
        degree: "free",        // free uchun
        difficulty: "beginner",
        duration: 20,
        totalQuestions: 20
    },
    parts: [...],
    published: true
});
```

#### Limited test (pulli):
```javascript
await Question.create({
    title: "IELTS Reading - Advanced Test",
    type: "reading",
    slug: "ielts-reading-advanced",
    metadata: {
        degree: "limited",     // pulli uchun
        difficulty: "advanced",
        duration: 60,
        totalQuestions: 40
    },
    parts: [...],
    published: true
});
```

### Degree Farqi

| Xususiyat | Free | Limited |
|-----------|------|---------|
| Ro'yxatdan o'tganda | + Avtomatik | - Promokod kerak |
| Testlar sifati | Oddiy | Yaxshi |
| `metadata.degree` | "free" | "limited" |
| Testlar soni | 5 ta cheklangan | Ko'proq/cheksiz |
| Narxi | Bepul | Pulli |

---

## API Reference

### Auth Endpoints

| Endpoint | Method | Tavsif | Auth |
|----------|--------|--------|------|
| `/auth/register` | POST | Ro'yxatdan o'tish | - |
| `/auth/login` | POST | Login qilish | - |
| `/auth/refresh` | POST | Token yangilash | - |
| `/auth/get-current-user` | POST | Joriy user | + |

### Tarif Endpoints

| Endpoint | Method | Tavsif | Auth |
|----------|--------|--------|------|
| `/tarif/list` | POST | Barcha aktiv tariflar | - |
| `/tarif/get-one` | POST | Bitta tarif | - |
| `/tarif/create` | POST | Yangi tarif (admin) | + |
| `/tarif/update` | POST | Yangilash (admin) | + |
| `/tarif/delete` | POST | O'chirish (admin) | + |
| `/tarif/all` | POST | Barcha tariflar (admin) | + |

### Subscription Endpoints

| Endpoint | Method | Tavsif | Auth |
|----------|--------|--------|------|
| `/subscription/buy` | POST | Tarif sotib olish | + |
| `/subscription/my` | POST | Mening obunam | + |
| `/subscription/check` | POST | Obunani tekshirish | + |
| `/subscription/history` | POST | Testlar tarixi | + |

### Promo Endpoints

| Endpoint | Method | Tavsif | Auth |
|----------|--------|--------|------|
| `/promo/create` | POST | Promokod yaratish | - |
| `/promo/list` | POST | Promokodlar ro'yxati | + |
| `/promo/stats` | POST | Promokod statistikasi | - |
| `/promo/deactivate` | POST | Promokodni o'chirish | - |

### Questions Endpoints

| Endpoint | Method | Tavsif | Auth |
|----------|--------|--------|------|
| `/questions/create` | POST | Savol yaratish | + |
| `/questions/list` | POST | Savollar ro'yxati | + |
| `/questions/get-one` | POST | Bitta savol | + |
| `/questions/update` | POST | Savolni yangilash | + |
| `/questions/delete` | POST | Savolni o'chirish | + |
| `/questions/check-answers` | POST | Javoblarni tekshirish | + |

---

## Javob Tekshirish Tizimi

### Xususiyatlar

1. **Case-insensitive**: "Britain" = "britain" = "BRITAIN"
2. **Trimming**: " Britain " = "Britain"
3. **Alternative answers**: Array ichidagi istalgan variant
4. **Empty answers**: Bo'sh javoblar 0% hisoblanadi
5. **Global indexing**: Barcha partlar bo'yicha indekslash

### Test Scenarios

#### Scenario 1: 100% to'g'ri
```json
{
  "answers": [
    "Britain",
    "late 18th century",
    "rural",
    "false",
    "true",
    "false",
    "not given",
    "not given"
  ]
}
```
**Result**: `score: 100, correctCount: 8`

#### Scenario 2: 50% to'g'ri
```json
{
  "answers": [
    "Britain",          // ✓
    "19th century",     // ✗
    "rural",            // ✓
    "true",             // ✗
    "true",             // ✓
    "false",            // ✓
    "false",            // ✗
    "not given"         // ✓
  ]
}
```
**Result**: `score: 62.5, correctCount: 5`

#### Scenario 3: Alternative javoblar
```json
{
  "answers": [
    "Britain",
    "18th century",     // alternative
    "rural societies",  // alternative
    "f",                // qisqa variant
    "t",                // qisqa variant
    "f",
    "ng",
    "ng"
  ]
}
```
**Result**: `score: 100, correctCount: 8`

---

## Virtual Fieldlar

### Subscription Model

| Virtual | Tavsif |
|---------|--------|
| `remaining_tests` | Qolgan testlar soni (package uchun) |
| `finished` | Tugaganligini tekshiradi |

#### `finished` mantiqi:
```javascript
// Package uchun:
finished = (used.length >= tests_count)

// Premium uchun:
finished = (new Date() > expired_date)
```

---

## Validatsiya

### Email Validatsiya
```javascript
// src/utils/validators.js
isValidEmail("user@example.com")  // true
isValidEmail("invalid")           // false
```

### Promokod Validatsiya
```javascript
// 3-50 ta belgi, faqat harf va raqam
isValidPromoCode("CODE123")      // true
isValidPromoCode("AB")           // false (juda qisqa)
```

### ObjectId Validatsiya
```javascript
isValidObjectId("65fa12ab34cd...")  // true
isValidObjectId("invalid")           // false
```

---

## Xatolik Kodlari

| Kod | Tavsif |
|-----|--------|
| `U11000` | User allaqachon mavjud |
| `U1110` | Avtorizatsiya talab qilinadi |
| `NO_ACTIVE_SUBSCRIPTION` | Aktiv obuna yo'q |

---

## Swagger Documentation

API hujjatlarini ko'rish:
```
http://localhost:3000/api-docs
```

---

## Serverni Ishga Tushirish

```bash
# O'rnash
npm install

# Development rejim
npm run dev

# Server: http://localhost:3000
# Docs: http://localhost:3000/api-docs
```

---

## Muhim Eslatmalar

1. **CORS** - Barcha domendan ruxsat (`origin: "*"`)
2. **JWT Secret** - Environment o'zgaruvchilardan olinadi
3. **Default Free Tarif** - Yo'q qo'lsa avtomatik yaratiladi
4. **Promokodlar** - Har doim katta harfda saqlanadi
5. **Usage Limit** - Promokodlar uchun tekshiriladi

---

## Backend Architecture Notes

### PromoService Class
```javascript
class PromoService {
    static validatePromo(code)
    static grantUserSubscription(userId, promo)
    static grantInfluencerReward(influencerId, rewardTarif)
    static processPromo(promo, newUserId)
}
```

### Middleware
```javascript
// JWT tekshiruv
export function authMiddleware(req, res, next) {
    // Authorization header tekshirish
    // Token validatsiya
    // req.user ga user ma'lumotlarni qo'shish
}
```

---

## Qo'shimcha Resurslar

- **MongoDB**: [mongodb.com](https://www.mongodb.com)
- **Express.js**: [expressjs.com](https://expressjs.com)
- **Mongoose**: [mongoosejs.com](https://mongoosejs.com)
- **JWT**: [jwt.io](https://jwt.io)

---

*Hujjat oxiri - v1.3.0*
