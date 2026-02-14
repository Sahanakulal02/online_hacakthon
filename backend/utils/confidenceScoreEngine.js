/**
 * CONFIDENCE SCORE ENGINE
 * 
 * Calculates confidence score (0-100) using:
 * - Accuracy
 * - Time consistency
 * - Difficulty progression
 * 
 * Categorizes: Low / Medium / High confidence
 */

const calculateConfidenceScore = (attempts, quizzes) => {
  if (!attempts || attempts.length === 0) {
    return {
      score: 0,
      category: 'low',
      factors: {
        accuracy: 0,
        timeConsistency: 0,
        difficultyProgression: 0
      },
      explanation: 'No attempts yet. Start taking quizzes to build confidence!'
    };
  }

  // Calculate accuracy factor (0-40 points)
  const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.answers.length, 0);
  const correctAnswers = attempts.reduce((sum, attempt) => 
    sum + attempt.answers.filter(a => a.isCorrect).length, 0
  );
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const accuracyScore = (accuracy / 100) * 40; // Max 40 points

  // Calculate time consistency (0-30 points)
  const timeDeviations = [];
  attempts.forEach(attempt => {
    const avgTime = attempt.averageTimePerQuestion || 0;
    attempt.answers.forEach(answer => {
      const deviation = Math.abs(answer.timeTaken - avgTime) / avgTime;
      timeDeviations.push(deviation);
    });
  });
  
  const avgDeviation = timeDeviations.length > 0
    ? timeDeviations.reduce((a, b) => a + b, 0) / timeDeviations.length
    : 1;
  
  // Lower deviation = more consistent = higher score
  const consistencyScore = Math.max(0, 30 * (1 - avgDeviation));

  // Calculate difficulty progression (0-30 points)
  let progressionScore = 0;
  if (attempts.length >= 2) {
    const recentAttempts = attempts.slice(-5); // Last 5 attempts
    const difficultyWeights = { easy: 1, medium: 2, hard: 3 };
    
    let progressionCount = 0;
    for (let i = 1; i < recentAttempts.length; i++) {
      const prev = recentAttempts[i - 1];
      const curr = recentAttempts[i];
      
      // Check if student is attempting harder questions
      const prevAvgDiff = prev.difficultyProgression.reduce((sum, d) => 
        sum + (difficultyWeights[d] || 2), 0
      ) / prev.difficultyProgression.length;
      
      const currAvgDiff = curr.difficultyProgression.reduce((sum, d) => 
        sum + (difficultyWeights[d] || 2), 0
      ) / curr.difficultyProgression.length;
      
      if (currAvgDiff >= prevAvgDiff && curr.accuracy >= prev.accuracy) {
        progressionCount++;
      }
    }
    
    progressionScore = (progressionCount / (recentAttempts.length - 1)) * 30;
  }

  // Total confidence score
  const totalScore = Math.min(100, Math.round(accuracyScore + consistencyScore + progressionScore));

  // Categorize
  let category = 'low';
  if (totalScore >= 70) {
    category = 'high';
  } else if (totalScore >= 40) {
    category = 'medium';
  }

  // Generate explanation
  let explanation = '';
  if (category === 'high') {
    explanation = 'Excellent! You show high confidence with consistent performance and good accuracy.';
  } else if (category === 'medium') {
    explanation = 'You\'re making good progress. Focus on consistency and accuracy to boost confidence further.';
  } else {
    explanation = 'Keep practicing! Focus on understanding concepts and maintaining consistent timing.';
  }

  return {
    score: totalScore,
    category,
    factors: {
      accuracy: Math.round(accuracyScore),
      timeConsistency: Math.round(consistencyScore),
      difficultyProgression: Math.round(progressionScore)
    },
    explanation,
    breakdown: {
      accuracy: Math.round(accuracy),
      avgTimeDeviation: Math.round(avgDeviation * 100) / 100,
      recentAttempts: attempts.length
    }
  };
};

module.exports = { calculateConfidenceScore };

