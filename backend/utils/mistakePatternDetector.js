/**
 * MISTAKE PATTERN DETECTION
 * 
 * Detects:
 * - Repeated wrong answers on same concept
 * - Option-bias (choosing same option repeatedly)
 * - Mistake patterns mapped to concepts
 */

const detectMistakePatterns = (attempts, quizzes) => {
  const patterns = {
    repeatedMistakes: [],
    optionBias: {},
    conceptMistakes: {},
    patterns: []
  };

  // Track mistakes by concept
  const conceptMistakeMap = {};
  const optionChoices = {};

  attempts.forEach(attempt => {
    const quiz = quizzes.find(q => q._id.toString() === attempt.quizId.toString());
    if (!quiz) return;

    attempt.answers.forEach((answer, index) => {
      const question = quiz.questions[index];
      if (!question) return;

      const topic = question.topic;
      const questionKey = `${topic}_${question.questionText.substring(0, 50)}`;

      // Track option choices
      if (!optionChoices[topic]) {
        optionChoices[topic] = { A: 0, B: 0, C: 0, D: 0 };
      }
      const optionLetter = String.fromCharCode(65 + answer.selectedAnswer);
      optionChoices[topic][optionLetter]++;

      // Track mistakes
      if (!answer.isCorrect) {
        if (!conceptMistakeMap[topic]) {
          conceptMistakeMap[topic] = [];
        }

        conceptMistakeMap[topic].push({
          question: question.questionText,
          selected: question.options[answer.selectedAnswer],
          correct: question.options[question.correctAnswer],
          attemptId: attempt._id,
          date: attempt.completedAt
        });
      }
    });
  });

  // Detect repeated mistakes
  Object.keys(conceptMistakeMap).forEach(topic => {
    const mistakes = conceptMistakeMap[topic];
    
    if (mistakes.length >= 2) {
      // Group similar mistakes
      const mistakeGroups = {};
      mistakes.forEach(mistake => {
        const key = mistake.question.substring(0, 30);
        if (!mistakeGroups[key]) {
          mistakeGroups[key] = [];
        }
        mistakeGroups[key].push(mistake);
      });

      Object.keys(mistakeGroups).forEach(key => {
        if (mistakeGroups[key].length >= 2) {
          patterns.repeatedMistakes.push({
            topic,
            count: mistakeGroups[key].length,
            question: key,
            pattern: 'Repeated mistakes on same concept',
            severity: mistakeGroups[key].length >= 3 ? 'high' : 'medium'
          });
        }
      });
    }

    patterns.conceptMistakes[topic] = {
      totalMistakes: mistakes.length,
      uniqueMistakes: new Set(mistakes.map(m => m.question)).size
    };
  });

  // Detect option bias
  Object.keys(optionChoices).forEach(topic => {
    const choices = optionChoices[topic];
    const total = choices.A + choices.B + choices.C + choices.D;
    
    if (total > 0) {
      const percentages = {
        A: (choices.A / total) * 100,
        B: (choices.B / total) * 100,
        C: (choices.C / total) * 100,
        D: (choices.D / total) * 100
      };

      // Check if one option is chosen > 40% of the time
      Object.keys(percentages).forEach(option => {
        if (percentages[option] > 40 && total >= 5) {
          patterns.optionBias[topic] = {
            biasedOption: option,
            percentage: Math.round(percentages[option]),
            message: `You tend to choose option ${option} frequently. Try to analyze each question carefully.`
          };
        }
      });
    }
  });

  // Generate pattern insights
  if (patterns.repeatedMistakes.length > 0) {
    patterns.patterns.push({
      type: 'repeated_mistakes',
      message: `You're making repeated mistakes in ${patterns.repeatedMistakes.length} topic(s). Focus on understanding these concepts.`,
      topics: [...new Set(patterns.repeatedMistakes.map(m => m.topic))]
    });
  }

  if (Object.keys(patterns.optionBias).length > 0) {
    patterns.patterns.push({
      type: 'option_bias',
      message: 'You show a tendency to choose certain options. Read questions carefully before selecting answers.',
      topics: Object.keys(patterns.optionBias)
    });
  }

  return patterns;
};

module.exports = { detectMistakePatterns };

