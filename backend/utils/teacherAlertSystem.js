/**
 * TEACHER ALERT SYSTEM
 * 
 * Flags students when:
 * - Engagement drops
 * - Confidence score decreases
 * - Same topic weak across quizzes
 * 
 * Provides simple intervention suggestions
 */

const generateTeacherAlerts = async (students, attempts, quizzes) => {
  const alerts = [];

  for (const student of students) {
    const studentAttempts = attempts.filter(a => 
      a.studentId.toString() === student._id.toString()
    );

    if (studentAttempts.length === 0) continue;

    // Sort by date
    studentAttempts.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    // Alert 1: Engagement drop
    const recentAttempts = studentAttempts.filter(a => {
      const daysSince = (Date.now() - new Date(a.completedAt)) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });

    const previousWeekAttempts = studentAttempts.filter(a => {
      const daysSince = (Date.now() - new Date(a.completedAt)) / (1000 * 60 * 60 * 24);
      return daysSince > 7 && daysSince <= 14;
    });

    if (recentAttempts.length < previousWeekAttempts.length * 0.5 && previousWeekAttempts.length > 0) {
      alerts.push({
        studentId: student._id,
        studentName: student.name,
        type: 'engagement_drop',
        severity: 'medium',
        message: `${student.name} has reduced quiz activity. Engagement dropped by ${Math.round((1 - recentAttempts.length / previousWeekAttempts.length) * 100)}%.`,
        intervention: 'Reach out to check if they need help or motivation. Consider assigning easier quizzes to rebuild confidence.',
        data: {
          recentAttempts: recentAttempts.length,
          previousAttempts: previousWeekAttempts.length
        }
      });
    }

    // Alert 2: Confidence score decrease
    if (studentAttempts.length >= 3) {
      const recent3 = studentAttempts.slice(0, 3);
      const older3 = studentAttempts.slice(3, 6);

      if (older3.length >= 3) {
        const recentConfidence = calculateConfidenceFromAttempts(recent3);
        const olderConfidence = calculateConfidenceFromAttempts(older3);

        if (recentConfidence < olderConfidence - 15) {
          alerts.push({
            studentId: student._id,
            studentName: student.name,
            type: 'confidence_drop',
            severity: 'high',
            message: `${student.name}'s confidence score dropped by ${Math.round(olderConfidence - recentConfidence)} points.`,
            intervention: 'Review recent quiz attempts to identify struggling topics. Provide targeted practice and encouragement.',
            data: {
              recentConfidence: Math.round(recentConfidence),
              previousConfidence: Math.round(olderConfidence)
            }
          });
        }
      }
    }

    // Alert 3: Same topic weak across quizzes
    const topicPerformance = {};
    studentAttempts.forEach(attempt => {
      const quiz = quizzes.find(q => q._id.toString() === attempt.quizId.toString());
      if (!quiz) return;

      attempt.answers.forEach((answer, index) => {
        const question = quiz.questions[index];
        if (!question) return;

        const topic = question.topic;
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { total: 0, correct: 0, quizzes: new Set() };
        }

        topicPerformance[topic].total++;
        topicPerformance[topic].quizzes.add(quiz._id.toString());
        if (answer.isCorrect) {
          topicPerformance[topic].correct++;
        }
      });
    });

    Object.keys(topicPerformance).forEach(topic => {
      const stats = topicPerformance[topic];
      const accuracy = (stats.correct / stats.total) * 100;
      
      if (accuracy < 50 && stats.quizzes.size >= 2) {
        alerts.push({
          studentId: student._id,
          studentName: student.name,
          type: 'persistent_weakness',
          severity: 'high',
          message: `${student.name} is struggling with "${topic}" across ${stats.quizzes.size} quiz(es) (${Math.round(accuracy)}% accuracy).`,
          intervention: `Provide additional resources and practice questions for ${topic}. Consider one-on-one support if needed.`,
          data: {
            topic,
            accuracy: Math.round(accuracy),
            quizCount: stats.quizzes.size,
            totalQuestions: stats.total
          }
        });
      }
    });

    // Alert 4: No recent activity
    if (studentAttempts.length > 0) {
      const lastAttempt = studentAttempts[0];
      const daysSince = (Date.now() - new Date(lastAttempt.completedAt)) / (1000 * 60 * 60 * 24);
      
      if (daysSince > 14) {
        alerts.push({
          studentId: student._id,
          studentName: student.name,
          type: 'inactivity',
          severity: 'medium',
          message: `${student.name} hasn't attempted any quizzes in ${Math.round(daysSince)} days.`,
          intervention: 'Send a reminder or check if they\'re facing any issues. Re-engage with easier content.',
          data: {
            daysSince: Math.round(daysSince),
            lastAttempt: lastAttempt.completedAt
          }
        });
      }
    }
  }

  // Sort by severity
  const severityOrder = { high: 3, medium: 2, low: 1 };
  alerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  return alerts;
};

function calculateConfidenceFromAttempts(attempts) {
  if (attempts.length === 0) return 0;
  const avgAccuracy = attempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / attempts.length;
  return avgAccuracy;
}

module.exports = { generateTeacherAlerts };

