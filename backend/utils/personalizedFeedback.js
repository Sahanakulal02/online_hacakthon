/**
 * PERSONALIZED FEEDBACK ENGINE
 * 
 * Analyzes student performance and generates personalized feedback
 * including strengths, weaknesses, and suggestions
 */

const generateFeedback = async (attempt, quiz) => {
  const feedback = {
    strengths: [],
    weaknesses: [],
    suggestions: [],
    personalizedMessage: ''
  };

  // Topic-wise performance analysis
  const topicPerformance = {};
  const topicStats = {
    correct: {},
    total: {},
    avgTime: {}
  };

  attempt.answers.forEach((answer, index) => {
    const question = quiz.questions[index];
    const topic = question.topic;

    if (!topicPerformance[topic]) {
      topicPerformance[topic] = { correct: 0, total: 0, totalTime: 0 };
    }

    topicPerformance[topic].total++;
    topicPerformance[topic].totalTime += answer.timeTaken;

    if (answer.isCorrect) {
      topicPerformance[topic].correct++;
    }
  });

  // Calculate topic-wise accuracy
  const topicAccuracy = {};
  Object.keys(topicPerformance).forEach(topic => {
    const stats = topicPerformance[topic];
    topicAccuracy[topic] = {
      accuracy: (stats.correct / stats.total) * 100,
      avgTime: stats.totalTime / stats.total,
      totalQuestions: stats.total
    };
  });

  // Identify strengths (accuracy > 70%)
  Object.keys(topicAccuracy).forEach(topic => {
    if (topicAccuracy[topic].accuracy >= 70) {
      feedback.strengths.push(topic);
    }
  });

  // Identify weaknesses (accuracy < 50%)
  Object.keys(topicAccuracy).forEach(topic => {
    if (topicAccuracy[topic].accuracy < 50) {
      feedback.weaknesses.push(topic);
    }
  });

  // Generate suggestions
  if (feedback.weaknesses.length > 0) {
    feedback.suggestions.push(
      `Focus on revising: ${feedback.weaknesses.join(', ')}`
    );
  }

  if (attempt.averageTimePerQuestion > 30) {
    feedback.suggestions.push(
      'Try to improve your speed while maintaining accuracy. Practice more to build confidence.'
    );
  }

  if (attempt.accuracy < 50) {
    feedback.suggestions.push(
      'Consider reviewing the fundamental concepts before attempting more quizzes.'
    );
  } else if (attempt.accuracy >= 80) {
    feedback.suggestions.push(
      'Excellent performance! You\'re ready for more challenging questions.'
    );
  }

  // Generate personalized message
  let message = '';
  
  if (attempt.accuracy >= 90) {
    message = `Outstanding work! You scored ${attempt.accuracy.toFixed(1)}% with excellent understanding. `;
    if (feedback.strengths.length > 0) {
      message += `You're particularly strong in ${feedback.strengths.join(', ')}. `;
    }
    message += 'Keep up the great work!';
  } else if (attempt.accuracy >= 70) {
    message = `Good job! You scored ${attempt.accuracy.toFixed(1)}%. `;
    if (feedback.strengths.length > 0) {
      message += `You showed strong understanding in ${feedback.strengths.join(', ')}. `;
    }
    if (feedback.weaknesses.length > 0) {
      message += `Consider reviewing ${feedback.weaknesses.join(', ')} to improve further.`;
    }
  } else if (attempt.accuracy >= 50) {
    message = `You scored ${attempt.accuracy.toFixed(1)}%. `;
    if (feedback.weaknesses.length > 0) {
      message += `You need more practice in ${feedback.weaknesses.join(', ')}. `;
    }
    message += 'Review the concepts and try again. You can do it!';
  } else {
    message = `You scored ${attempt.accuracy.toFixed(1)}%. `;
    if (feedback.weaknesses.length > 0) {
      message += `Focus on strengthening your understanding of ${feedback.weaknesses.join(', ')}. `;
    }
    message += 'Don\'t give up! Review the material and practice more.';
  }

  feedback.personalizedMessage = message;

  return feedback;
};

module.exports = { generateFeedback };

