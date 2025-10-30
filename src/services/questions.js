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

    // parts ichidagi har bir savol
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const correctAnswers = part.answers; // array of answers per part

        for (let j = 0; j < correctAnswers.length; j++) {
            const correct = correctAnswers[j]; // har bir savol uchun to'g'ri javob
            const student = answers[j];        // student javobi

            let percent = 0;

            if (student) {
                if (Array.isArray(correct)) {
                    const studentArray = Array.isArray(student) ? student : [student];
                    const correctCount = studentArray.filter(s => correct.map(item => item.toLowerCase()).includes(s.toLowerCase())).length;
                    percent = (correctCount / correct.length) * 100;
                } else {
                    percent = student.toLowerCase() === correct.toLowerCase() ? 100 : 0;
                }
            }

            results.push(percent);
            detailed.push({
                questionIndex: j,
                correct,
                student,
                percent
            });
        }
    }

    const totalPercent = results.reduce((acc, cur) => acc + cur, 0) / results.length;

    return {
        examId: questionId,
        questions: question,
        results: detailed.map(item => item.percent),          // har bir savol uchun foiz
        detailed,         // batafsil natija har bir savol bo'yicha
        score: totalPercent, // umumiy foiz
        total: results.length, // jami savollar soni
        answers,          // foydalanuvchi javoblari
        submittedAt: new Date(),
    };
}
