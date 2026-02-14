/**
 * TIME-BASED PERFORMANCE ANALYSIS
 * 
 * Identifies:
 * - Correct but slow answers (understanding but needs practice)
 * - Wrong but fast answers (guessing or misconception)
 * - Speed vs understanding correlation
 */

const analyzeTimePerformance = (attempts, quizzes) => {
  const analysis = {
    slowButCorrect: [],
    fastButWrong: [],
    speedUnderstanding: {
      fastAccurate: 0,    // Fast and correct (strong)
      fastInaccurate: 0, // Fast but wrong (guessing)
      slowAccurate: 0,   // Slow but correct (needs practice)
      slowInaccurate: 0  // Slow and wrong (weak concept)
    },
    insights: []
  };

  attempts.forEach(attempt => {
    const quiz = quizzes.find(q => q._id.toString() === attempt.quizId.toString());
    if (!quiz) return;

    attempt.answers.forEach((answer, index) => {
      const question = quiz.questions[index];
      if (!question) return;

      const timeLimit = question.timeLimit || 30;
      const timeRatio = answer.timeTaken / timeLimit;
      const isFast = timeRatio < 0.6; // Used less than 60% of time
      const isSlow = timeRatio > 0.8;  // Used more than 80% of time

      if (answer.isCorrect && isSlow) {
        analysis.slowButCorrect.push({
          topic: question.topic,
          question: question.questionText,
          timeTaken: answer.timeTaken,
          timeLimit: timeLimit,
          message: 'You got it right but took longer. More practice will improve your speed.'
        });
        analysis.speedUnderstanding.slowAccurate++;
      }

      if (!answer.isCorrect && isFast) {
        analysis.fastButWrong.push({
          topic: question.topic,
          question: question.questionText,
          timeTaken: answer.timeTaken,
          selectedAnswer: question.options[answer.selectedAnswer],
          message: 'You answered quickly but incorrectly. Take time to understand the concept.'
        });
        analysis.speedUnderstanding.fastInaccurate++;
      }

      if (answer.isCorrect && isFast) {
        analysis.speedUnderstanding.fastAccurate++;
      }

      if (!answer.isCorrect && isSlow) {
        analysis.speedUnderstanding.slowInaccurate++;
      }
    });
  });

  // Generate insights
  const total = analysis.speedUnderstanding.fastAccurate + 
                analysis.speedUnderstanding.fastInaccurate +
                analysis.speedUnderstanding.slowAccurate +
                analysis.speedUnderstanding.slowInaccurate;

  if (total > 0) {
    const fastAccuratePct = (analysis.speedUnderstanding.fastAccurate / total) * 100;
    const slowAccuratePct = (analysis.speedUnderstanding.slowAccurate / total) * 100;
    const fastInaccuratePct = (analysis.speedUnderstanding.fastInaccurate / total) * 100;

    if (fastAccuratePct > 50) {
      analysis.insights.push({
        type: 'strength',
        message: 'You demonstrate strong understanding with quick, accurate answers. Great work!'
      });
    }

    if (slowAccuratePct > 30) {
      analysis.insights.push({
        type: 'improvement',
        message: 'You understand the concepts but need practice to answer faster. Focus on speed drills.'
      });
    }

    if (fastInaccuratePct > 25) {
      analysis.insights.push({
        type: 'warning',
        message: 'You\'re answering too quickly without understanding. Slow down and think through each question.'
      });
    }
  }

  return analysis;
};

module.exports = { analyzeTimePerformance };

