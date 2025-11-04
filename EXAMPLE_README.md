# IELTS Question & Answer Examples

Bu fayllar `checkAnswers` funksiyasini test qilish uchun namuna JSON'lardir.

## Files

### 1. `example-question.json`
Savol yaratish uchun namuna. Ikkita part (qism) mavjud:
- **Part 1**: Multiple Choice (3 ta savol)
- **Part 2**: True/False/Not Given (5 ta savol)

**Jami**: 8 ta savol

### 2. `example-answers.json`
Student javoblari uchun namuna. 8 ta javob mavjud.

## Qanday ishlatish

### 1. Savolni bazaga qo'shish (MongoDB shell yoki code orqali):

```javascript
// Part 1 ni yaratish
const part1 = await Part.create({
  markdown: "## Part 1: Multiple Choice\n\n...",
  answers: [
    "Britain",
    ["late 18th century", "18th century", "1700s"],
    ["rural", "rural societies"]
  ],
  part_type: ["READING_MCQ"],
  collection_id: new mongoose.Types.ObjectId()
});

// Part 2 ni yaratish
const part2 = await Part.create({
  markdown: "## Part 2: True/False/Not Given\n\n...",
  answers: [
    ["false", "f"],
    ["true", "t"],
    ["false", "f"],
    ["not given", "ng"],
    ["not given", "ng"]
  ],
  part_type: ["READING_TFNG"],
  collection_id: part1.collection_id
});

// Question yaratish
const question = await Question.create({
  title: "IELTS Reading Test - Sample Questions",
  type: "reading",
  published: true,
  tags: ["reading", "practice", "beginner"],
  parts: [part1._id, part2._id],
  metadata: {
    duration: 20,
    difficulty: "intermediate",
    totalQuestions: 8
  }
});

console.log("Question ID:", question._id);
```

### 2. Javoblarni tekshirish (API orqali):

```bash
POST /api/questions/check-answers
Content-Type: application/json

{
  "questionId": "QUESTION_ID_HERE",
  "email": "student@example.com",
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

### 3. Kutilgan natija:

```json
{
  "examId": "QUESTION_ID_HERE",
  "score": 100,
  "total": 8,
  "correctCount": 8,
  "incorrectCount": 0,
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
    // ... qolgan javoblar
  ],
  "answers": [...],
  "submittedAt": "2025-11-04T10:30:00.000Z"
}
```

## Test Scenarios

### Scenario 1: 100% to'g'ri javoblar
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
**Kutilgan**: score = 100, correctCount = 8

### Scenario 2: 50% to'g'ri javoblar
```json
{
  "answers": [
    "Britain",          // ✓ to'g'ri
    "19th century",     // ✗ noto'g'ri
    "rural",            // ✓ to'g'ri
    "true",             // ✗ noto'g'ri
    "true",             // ✓ to'g'ri
    "false",            // ✓ to'g'ri
    "false",            // ✗ noto'g'ri
    "not given"         // ✓ to'g'ri
  ]
}
```
**Kutilgan**: score = 62.5, correctCount = 5

### Scenario 3: Alternative javoblar
```json
{
  "answers": [
    "Britain",
    "18th century",     // alternative javob
    "rural societies",  // alternative javob
    "f",                // qisqa variant
    "t",                // qisqa variant
    "f",
    "ng",
    "ng"
  ]
}
```
**Kutilgan**: score = 100, correctCount = 8

## Important Notes

1. **Case-insensitive**: "Britain" = "britain" = "BRITAIN"
2. **Trimming**: " Britain " = "Britain"
3. **Alternative answers**: Array ichidagi istalgan variantni yozish mumkin
4. **Empty answers**: Bo'sh javoblar 0% hisoblanadi
5. **Global indexing**: Barcha partlar bo'yicha javoblar ketma-ket indekslanadi