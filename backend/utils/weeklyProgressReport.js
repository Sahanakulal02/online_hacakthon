/**
 * WEEKLY PROGRESS REPORT GENERATOR
 * 
 * Generates weekly performance summary:
 * - Accuracy trend
 * - Improvement areas
 * - Confidence change
 * - Teacher insights
 */

const generateWeeklyReport = (attempts, quizzes, previousWeekAttempts = []) => {
  const report = {
    week: getWeekNumber(new Date()),
    dateRange: getWeekDateRange(),
    student: {},
    teacher: {},
    trends: {}
  };

  // Current week metrics
  const currentWeekAccuracy = calculateAverageAccuracy(attempts);
  const currentWeekScore = calculateAverageScore(attempts);
  const currentWeekConfidence = calculateConfidenceFromAttempts(attempts);

  // Previous week metrics (if available)
  const previousWeekAccuracy = previousWeekAttempts.length > 0
    ? calculateAverageAccuracy(previousWeekAttempts)
    : null;
  const previousWeekScore = previousWeekAttempts.length > 0
    ? calculateAverageScore(previousWeekAttempts)
    : null;
  const previousWeekConfidence = previousWeekAttempts.length > 0
    ? calculateConfidenceFromAttempts(previousWeekAttempts)
    : null;

  // Calculate trends
  report.trends = {
    accuracy: {
      current: Math.round(currentWeekAccuracy),
      previous: previousWeekAccuracy ? Math.round(previousWeekAccuracy) : null,
      change: previousWeekAccuracy 
        ? Math.round(currentWeekAccuracy - previousWeekAccuracy)
        : null,
      direction: previousWeekAccuracy 
        ? (currentWeekAccuracy > previousWeekAccuracy ? 'up' : 'down')
        : 'new'
    },
    score: {
      current: Math.round(currentWeekScore),
      previous: previousWeekScore ? Math.round(previousWeekScore) : null,
      change: previousWeekScore 
        ? Math.round(currentWeekScore - previousWeekScore)
        : null,
      direction: previousWeekScore 
        ? (currentWeekScore > previousWeekScore ? 'up' : 'down')
        : 'new'
    },
    confidence: {
      current: Math.round(currentWeekConfidence),
      previous: previousWeekConfidence ? Math.round(previousWeekConfidence) : null,
      change: previousWeekConfidence 
        ? Math.round(currentWeekConfidence - previousWeekConfidence)
        : null,
      direction: previousWeekConfidence 
        ? (currentWeekConfidence > previousWeekConfidence ? 'up' : 'down')
        : 'new'
    }
  };

  // Student view
  report.student = {
    summary: generateStudentSummary(report.trends),
    achievements: identifyAchievements(attempts, previousWeekAttempts),
    improvementAreas: identifyImprovementAreas(attempts, quizzes),
    nextSteps: generateNextSteps(report.trends)
  };

  // Teacher view
  report.teacher = {
    needsAttention: report.trends.accuracy.change < -10 || 
                    report.trends.confidence.change < -15,
    attentionReason: generateAttentionReason(report.trends),
    intervention: generateIntervention(report.trends),
    strengths: identifyStrengths(attempts, quizzes)
  };

  return report;
};

// Helper functions
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeekDateRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek;
  const start = new Date(now.setDate(diff));
  const end = new Date(now.setDate(diff + 6));
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

function calculateAverageAccuracy(attempts) {
  if (attempts.length === 0) return 0;
  return attempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / attempts.length;
}

function calculateAverageScore(attempts) {
  if (attempts.length === 0) return 0;
  return attempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) / attempts.length;
}

function calculateConfidenceFromAttempts(attempts) {
  if (attempts.length === 0) return 0;
  const avgAccuracy = calculateAverageAccuracy(attempts);
  const consistency = calculateConsistency(attempts);
  return (avgAccuracy * 0.6 + consistency * 0.4);
}

function calculateConsistency(attempts) {
  if (attempts.length < 2) return 50;
  const accuracies = attempts.map(a => a.accuracy || 0);
  const avg = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  const variance = accuracies.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / accuracies.length;
  const stdDev = Math.sqrt(variance);
  return Math.max(0, 100 - stdDev);
}

function generateStudentSummary(trends) {
  const parts = [];
  
  if (trends.accuracy.direction === 'up') {
    parts.push(`Your accuracy improved by ${trends.accuracy.change}% this week!`);
  } else if (trends.accuracy.direction === 'down') {
    parts.push(`Your accuracy decreased by ${Math.abs(trends.accuracy.change)}% this week.`);
  }
  
  if (trends.confidence.direction === 'up') {
    parts.push(`Your confidence score increased by ${trends.confidence.change} points.`);
  }
  
  return parts.join(' ') || 'Keep up the great work!';
}

function identifyAchievements(currentAttempts, previousAttempts) {
  const achievements = [];
  
  if (currentAttempts.length > previousAttempts.length) {
    achievements.push(`Completed ${currentAttempts.length - previousAttempts.length} more quiz(es) this week!`);
  }
  
  const highScores = currentAttempts.filter(a => a.accuracy >= 90);
  if (highScores.length > 0) {
    achievements.push(`Achieved ${highScores.length} excellent score(s) (90%+)!`);
  }
  
  return achievements;
}

function identifyImprovementAreas(attempts, quizzes) {
  // Simplified - would use gap analysis in production
  return ['Continue practicing difficult topics', 'Focus on time management'];
}

function generateNextSteps(trends) {
  if (trends.accuracy.direction === 'down') {
    return 'Review the topics where you struggled and practice more questions.';
  }
  return 'Great progress! Try more challenging questions to continue improving.';
}

function generateAttentionReason(trends) {
  if (trends.accuracy.change < -10) {
    return 'Significant drop in accuracy';
  }
  if (trends.confidence.change < -15) {
    return 'Confidence score decreased significantly';
  }
  return null;
}

function generateIntervention(trends) {
  if (trends.accuracy.change < -10) {
    return 'Schedule a review session to identify struggling topics and provide additional support.';
  }
  return 'Monitor progress and provide encouragement.';
}

function identifyStrengths(attempts, quizzes) {
  // Simplified
  return ['Consistent participation', 'Good time management'];
}

module.exports = { generateWeeklyReport };

