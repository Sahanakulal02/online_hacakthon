/**
 * LEARNING GAP ANALYZER
 * 
 * Analyzes student performance to identify:
 * - Weak topics and sub-topics
 * - Root causes (low accuracy / slow speed / concept confusion)
 * - Repeated wrong attempts
 */

const analyzeLearningGaps = async (attempts, quizzes) => {
  const gapAnalysis = {
    weakAreas: [],
    rootCauses: [],
    topicPerformance: {},
    recommendations: []
  };

  // Topic-wise analysis
  const topicStats = {};
  const topicMistakes = {};

  attempts.forEach(attempt => {
    const quiz = quizzes.find(q => q._id.toString() === attempt.quizId.toString());
    if (!quiz) return;

    attempt.answers.forEach((answer, index) => {
      const question = quiz.questions[index];
      if (!question) return;

      const topic = question.topic;
      
      // Initialize topic stats
      if (!topicStats[topic]) {
        topicStats[topic] = {
          total: 0,
          correct: 0,
          totalTime: 0,
          wrongAttempts: 0,
          repeatedMistakes: 0
        };
        topicMistakes[topic] = [];
      }

      topicStats[topic].total++;
      topicStats[topic].totalTime += answer.timeTaken;

      if (answer.isCorrect) {
        topicStats[topic].correct++;
      } else {
        topicStats[topic].wrongAttempts++;
        topicMistakes[topic].push({
          question: question.questionText,
          selectedAnswer: question.options[answer.selectedAnswer],
          correctAnswer: question.options[question.correctAnswer],
          timeTaken: answer.timeTaken
        });
      }
    });
  });

  // Calculate metrics and identify weak areas
  Object.keys(topicStats).forEach(topic => {
    const stats = topicStats[topic];
    const accuracy = (stats.correct / stats.total) * 100;
    const avgTime = stats.totalTime / stats.total;
    const mistakeRate = (stats.wrongAttempts / stats.total) * 100;

    topicStats[topic].accuracy = accuracy;
    topicStats[topic].avgTime = avgTime;
    topicStats[topic].mistakeRate = mistakeRate;

    // Identify weak areas (accuracy < 60% OR high mistake rate)
    if (accuracy < 60 || mistakeRate > 40) {
      gapAnalysis.weakAreas.push({
        topic,
        accuracy: Math.round(accuracy),
        avgTime: Math.round(avgTime),
        mistakeRate: Math.round(mistakeRate),
        totalQuestions: stats.total
      });

      // Determine root cause
      const rootCauses = [];
      
      if (accuracy < 50) {
        rootCauses.push('Low accuracy - Concept not understood');
      }
      
      if (avgTime > 45) {
        rootCauses.push('Slow response - Needs more practice');
      }
      
      if (mistakeRate > 50) {
        rootCauses.push('High mistake rate - Concept confusion');
      }

      if (topicMistakes[topic].length > 3) {
        rootCauses.push('Repeated mistakes - Needs revision');
      }

      gapAnalysis.rootCauses.push({
        topic,
        causes: rootCauses,
        severity: accuracy < 40 ? 'high' : accuracy < 60 ? 'medium' : 'low'
      });
    }
  });

  gapAnalysis.topicPerformance = topicStats;

  // Generate recommendations
  gapAnalysis.weakAreas.forEach(area => {
    const rootCause = gapAnalysis.rootCauses.find(rc => rc.topic === area.topic);
    const recommendations = [];

    if (area.accuracy < 50) {
      recommendations.push({
        action: 'Revise fundamentals',
        difficulty: 'easy',
        questions: Math.ceil(area.totalQuestions * 1.5),
        priority: 'high'
      });
    } else if (area.avgTime > 45) {
      recommendations.push({
        action: 'Practice for speed',
        difficulty: 'medium',
        questions: area.totalQuestions,
        priority: 'medium'
      });
    } else {
      recommendations.push({
        action: 'Practice more questions',
        difficulty: 'medium',
        questions: Math.ceil(area.totalQuestions * 0.8),
        priority: 'low'
      });
    }

    gapAnalysis.recommendations.push({
      topic: area.topic,
      recommendations
    });
  });

  return gapAnalysis;
};

module.exports = { analyzeLearningGaps };

