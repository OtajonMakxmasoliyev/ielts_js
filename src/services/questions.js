import Question from "../models/Question.js";
export async function checkAnswers({ questionId, answers }) {
    const question = await Question.findById(questionId).populate("parts");
    if (!question) {
        throw new Error("Question not found");
    }

    const parts = question.parts || [];
    if (parts.length === 0) {
        return { err: "No parts found" };
    }

    const results = [];
    const detailed = []; // har bir savol uchun batafsil
    let globalQuestionIndex = 0; // barcha partlar bo'yicha umumiy savol indeksi

    // parts ichidagi har bir savol
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const correctAnswers = part.answers; // array of answers per part

        if (!correctAnswers || correctAnswers.length === 0) {
            continue; // agar bu partda javoblar bo'lmasa, keyingisiga o'tamiz
        }

        for (let j = 0; j < correctAnswers.length; j++) {
            const correct = correctAnswers[j]; // har bir savol uchun to'g'ri javob
            const student = answers[globalQuestionIndex]; // student javobi (umumiy indeks bo'yicha)

            let percent = 0;
            let isCorrect = false;

            if (student !== undefined && student !== null && student !== "") {
                if (Array.isArray(correct)) {
                    // Agar to'g'ri javob array bo'lsa (masalan: ["answer1", "answer2"])
                    // Student bir yoki bir nechta javob bergan bo'lishi mumkin
                    const studentArray = Array.isArray(student) ? student : [student];

                    // Har bir student javobini tekshiramiz
                    const correctCount = studentArray.filter(s => {
                        if (!s) return false;
                        const studentLower = String(s).trim().toLowerCase();
                        return correct.some(item =>
                            item && String(item).trim().toLowerCase() === studentLower
                        );
                    }).length;

                    // Agar kamida bitta to'g'ri javob topilsa
                    if (correctCount > 0) {
                        percent = 100;
                        isCorrect = true;
                    }
                } else {
                    // Agar to'g'ri javob bitta string bo'lsa
                    const correctLower = String(correct).trim().toLowerCase();
                    const studentLower = String(student).trim().toLowerCase();

                    if (studentLower === correctLower) {
                        percent = 100;
                        isCorrect = true;
                    }
                }
            }

            results.push(percent);
            detailed.push({
                partIndex: i,
                questionIndex: j,
                globalIndex: globalQuestionIndex,
                correct,
                student: student || null,
                percent,
                isCorrect
            });

            globalQuestionIndex++; // keyingi savol uchun indeksni oshiramiz
        }
    }

    // Agar hech qanday natija topilmasa
    if (results.length === 0) {
        return {
            examId: questionId,
            questions: question,
            results: [],
            detailed: [],
            score: 0,
            total: 0,
            correctCount: 0,
            incorrectCount: 0,
            answers,
            submittedAt: new Date(),
        };
    }

    const totalPercent = results.reduce((acc, cur) => acc + cur, 0) / results.length;
    const correctCount = detailed.filter(item => item.isCorrect).length;
    const incorrectCount = detailed.length - correctCount;

    return {
        examId: questionId,
        questions: question,
        results: detailed.map(item => item.percent), // har bir savol uchun foiz
        detailed, // batafsil natija har bir savol bo'yicha
        score: Math.round(totalPercent * 100) / 100, // umumiy foiz (2 decimal)
        total: results.length, // jami savollar soni
        correctCount, // to'g'ri javoblar soni
        incorrectCount, // noto'g'ri javoblar soni
        answers, // foydalanuvchi javoblari
        submittedAt: new Date(),
    };
}
