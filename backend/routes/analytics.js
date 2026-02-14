const express = require('express');
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { authenticate, isTeacher } = require('../middleware/auth');
const { analyzeLearningGaps } = require('../utils/learningGapAnalyzer');
const { analyzeTimePerformance } = require('../utils/timePerformanceAnalyzer');
const { detectMistakePatterns } = require('../utils/mistakePatternDetector');
const { calculateConfidenceScore } = require('../utils/confidenceScoreEngine');
const { generateImprovementPlan } = require('../utils/improvementPlanGenerator');
const { generateWeeklyReport } = require('../utils/weeklyProgressReport');
const { generateTeacherAlerts } = require('../utils/teacherAlertSystem');
const router = express.Router();

// @route   GET /api/analytics/quiz/:quizId
// @desc    Get analytics for a specific quiz
// @access  Private (Teacher)
router.get('/quiz/:quizId', authenticate, isTeacher, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const attempts = await Attempt.find({ quizId: req.params.quizId });

    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.answers.length === quiz.questions.length).length;
    const completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
    
    const averageAccuracy = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length
      : 0;

    const averageTime = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.timeSpent, 0) / attempts.length
      : 0;

    const topicStats = {};
    attempts.forEach(attempt => {
      attempt.answers.forEach((answer, index) => {
        const question = quiz.questions[index];
        const topic = question.topic;
        
        if (!topicStats[topic]) {
          topicStats[topic] = { correct: 0, total: 0 };
        }
        
        topicStats[topic].total++;
        if (answer.isCorrect) {
          topicStats[topic].correct++;
        }
      });
    });

    const topicPerformance = Object.keys(topicStats).map(topic => ({
      topic,
      accuracy: (topicStats[topic].correct / topicStats[topic].total) * 100,
      totalQuestions: topicStats[topic].total
    }));

    const difficultyStats = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
    attempts.forEach(attempt => {
      attempt.answers.forEach(answer => {
        const difficulty = answer.difficulty;
        difficultyStats[difficulty].total++;
        if (answer.isCorrect) {
          difficultyStats[difficulty].correct++;
        }
      });
    });

    const difficultyPerformance = Object.keys(difficultyStats).map(difficulty => ({
      difficulty,
      accuracy: difficultyStats[difficulty].total > 0
        ? (difficultyStats[difficulty].correct / difficultyStats[difficulty].total) * 100
        : 0,
      totalQuestions: difficultyStats[difficulty].total
    }));

    res.json({
      quiz: {
        id: quiz._id,
        title: quiz.title
      },
      metrics: {
        totalAttempts,
        completedAttempts,
        completionRate: Math.round(completionRate * 100) / 100,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100,
        averageTime: Math.round(averageTime)
      },
      topicPerformance,
      difficultyPerformance
    });
  } catch (error) {
    console.error('Get quiz analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/students
// @desc    Get student engagement analytics
// @access  Private (Teacher)
router.get('/students', authenticate, isTeacher, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    const attempts = await Attempt.find().populate('studentId', 'name email');

    const studentEngagement = students.map(student => {
      const studentAttempts = attempts.filter(a => 
        a.studentId._id.toString() === student._id.toString()
      );

      const recentAttempts = studentAttempts.filter(a => {
        const daysSince = (Date.now() - new Date(a.completedAt)) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });

      const engagementScore = Math.min(100, 
        (recentAttempts.length * 10) + 
        (student.totalQuizzesAttempted * 2) +
        (student.averageAccuracy * 0.5)
      );

      let dropOutRisk = 'low';
      const daysSinceLastAttempt = studentAttempts.length > 0
        ? (Date.now() - new Date(studentAttempts[0].completedAt)) / (1000 * 60 * 60 * 24)
        : 999;

      if (daysSinceLastAttempt > 14 && student.totalQuizzesAttempted < 3) {
        dropOutRisk = 'high';
      } else if (daysSinceLastAttempt > 7 || student.averageAccuracy < 30) {
        dropOutRisk = 'medium';
      }

      return {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          level: student.level
        },
        totalQuizzes: student.totalQuizzesAttempted,
        averageAccuracy: student.averageAccuracy,
        totalPoints: student.totalPoints,
        recentActivity: recentAttempts.length,
        engagementScore: Math.round(engagementScore),
        dropOutRisk
      };
    });

    const activeStudents = studentEngagement.filter(s => s.recentActivity > 0).length;
    const inactiveStudents = students.length - activeStudents;
    const averageEngagement = studentEngagement.length > 0
      ? studentEngagement.reduce((sum, s) => sum + s.engagementScore, 0) / studentEngagement.length
      : 0;

    res.json({
      overall: {
        totalStudents: students.length,
        activeStudents,
        inactiveStudents,
        averageEngagement: Math.round(averageEngagement)
      },
      students: studentEngagement.sort((a, b) => b.engagementScore - a.engagementScore)
    });
  } catch (error) {
    console.error('Get student analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/dashboard
// @desc    Get comprehensive dashboard data
// @access  Private (Teacher)
router.get('/dashboard', authenticate, isTeacher, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id });
    const students = await User.find({ role: 'student' });
    const attempts = await Attempt.find();

    const quizCompletion = await Promise.all(
      quizzes.map(async (quiz) => {
        const quizAttempts = await Attempt.find({ quizId: quiz._id });
        const completed = quizAttempts.filter(a => a.answers.length === quiz.questions.length).length;
        return {
          quizId: quiz._id,
          title: quiz.title,
          totalAttempts: quizAttempts.length,
          completedAttempts: completed,
          completionRate: quizAttempts.length > 0 ? (completed / quizAttempts.length) * 100 : 0
        };
      })
    );

    const consistencyData = students.map(student => {
      const studentAttempts = attempts.filter(a => 
        a.studentId.toString() === student._id.toString()
      ).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

      let consistencyScore = 0;
      if (studentAttempts.length >= 2) {
        const intervals = [];
        for (let i = 1; i < studentAttempts.length; i++) {
          const days = (new Date(studentAttempts[i].completedAt) - 
                       new Date(studentAttempts[i-1].completedAt)) / (1000 * 60 * 60 * 24);
          intervals.push(days);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        consistencyScore = Math.max(0, 100 - (avgInterval * 10));
      }

      return {
        studentId: student._id,
        name: student.name,
        consistencyScore: Math.round(consistencyScore)
      };
    });

    res.json({
      quizzes: {
        total: quizzes.length,
        completionRates: quizCompletion
      },
      students: {
        total: students.length,
        active: students.filter(s => s.totalQuizzesAttempted > 0).length
      },
      consistency: consistencyData.sort((a, b) => b.consistencyScore - a.consistencyScore)
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/student/:studentId/performance
// @desc    Get comprehensive student performance analytics
// @access  Private (Student or Teacher)
router.get('/student/:studentId/performance', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Check authorization
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const attempts = await Attempt.find({ studentId })
      .populate('quizId')
      .sort({ completedAt: 1 });

    const quizzes = await Quiz.find({ 
      _id: { $in: attempts.map(a => a.quizId._id) } 
    });

    // Learning gap analysis
    const gapAnalysis = await analyzeLearningGaps(attempts, quizzes);

    // Time performance analysis
    const timeAnalysis = analyzeTimePerformance(attempts, quizzes);

    // Mistake pattern detection
    const mistakePatterns = detectMistakePatterns(attempts, quizzes);

    // Confidence score
    const confidenceScore = calculateConfidenceScore(attempts, quizzes);

    // Improvement plan
    const improvementPlan = generateImprovementPlan(
      gapAnalysis,
      timeAnalysis,
      mistakePatterns,
      confidenceScore
    );

    res.json({
      student: {
        id: student._id,
        name: student.name,
        level: student.level,
        totalPoints: student.totalPoints
      },
      gapAnalysis,
      timeAnalysis,
      mistakePatterns,
      confidenceScore,
      improvementPlan
    });
  } catch (error) {
    console.error('Get student performance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/student/:studentId/graphs
// @desc    Get graph data for student performance
// @access  Private (Student or Teacher)
router.get('/student/:studentId/graphs', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const attempts = await Attempt.find({ studentId })
      .populate('quizId', 'title')
      .sort({ completedAt: 1 });

    // Get quizzes for topic analysis
    const quizzes = await Quiz.find({ 
      _id: { $in: attempts.map(a => a.quizId._id) } 
    });

    // Score vs Time Graph
    const scoreOverTime = attempts.map((attempt, index) => ({
      date: new Date(attempt.completedAt).toISOString().split('T')[0],
      score: attempt.totalScore,
      attemptNumber: index + 1,
      quizTitle: attempt.quizId?.title || 'Quiz'
    }));

    // Accuracy Trend Graph
    const accuracyTrend = attempts.map((attempt, index) => ({
      date: new Date(attempt.completedAt).toISOString().split('T')[0],
      accuracy: Math.round(attempt.accuracy),
      attemptNumber: index + 1
    }));

    // Topic-wise Performance
    const topicStats = {};
    attempts.forEach(attempt => {
      const quiz = quizzes.find(q => q._id.toString() === attempt.quizId._id.toString());
      if (!quiz) return;

      attempt.answers.forEach((answer, index) => {
        const question = quiz.questions[index];
        if (!question) return;

        const topic = question.topic;
        if (!topicStats[topic]) {
          topicStats[topic] = { correct: 0, total: 0 };
        }
        topicStats[topic].total++;
        if (answer.isCorrect) {
          topicStats[topic].correct++;
        }
      });
    });

    const topicPerformance = Object.keys(topicStats).map(topic => ({
      topic,
      accuracy: Math.round((topicStats[topic].correct / topicStats[topic].total) * 100),
      totalQuestions: topicStats[topic].total,
      status: (topicStats[topic].correct / topicStats[topic].total) >= 0.7 ? 'strong' :
              (topicStats[topic].correct / topicStats[topic].total) >= 0.5 ? 'average' : 'weak'
    }));

    // Confidence Score Trend
    const confidenceTrend = [];
    for (let i = 0; i < attempts.length; i++) {
      const recentAttempts = attempts.slice(0, i + 1);
      const confidence = calculateConfidenceScore(recentAttempts, []).score;
      confidenceTrend.push({
        date: new Date(attempts[i].completedAt).toISOString().split('T')[0],
        confidenceScore: confidence,
        attemptNumber: i + 1
      });
    }

    // Time vs Accuracy Graph
    const timeVsAccuracy = attempts.map(attempt => ({
      date: new Date(attempt.completedAt).toISOString().split('T')[0],
      accuracy: Math.round(attempt.accuracy),
      avgTime: Math.round(attempt.averageTimePerQuestion),
      category: attempt.accuracy >= 70 && attempt.averageTimePerQuestion < 25 ? 'fast_accurate' :
                attempt.accuracy >= 70 && attempt.averageTimePerQuestion >= 25 ? 'slow_accurate' :
                attempt.accuracy < 70 && attempt.averageTimePerQuestion < 25 ? 'fast_inaccurate' : 'slow_inaccurate'
    }));

    res.json({
      scoreOverTime,
      accuracyTrend,
      topicPerformance,
      confidenceTrend,
      timeVsAccuracy,
      insights: generateGraphInsights(scoreOverTime, accuracyTrend, confidenceTrend)
    });
  } catch (error) {
    console.error('Get student graphs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/student/:studentId/weekly-report
// @desc    Get weekly progress report
// @access  Private (Student or Teacher)
router.get('/student/:studentId/weekly-report', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const attempts = await Attempt.find({ studentId })
      .sort({ completedAt: -1 });

    // Get current week attempts (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const currentWeekAttempts = attempts.filter(a => 
      new Date(a.completedAt) >= weekAgo
    );

    // Get previous week attempts (7-14 days ago)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const previousWeekAttempts = attempts.filter(a => {
      const date = new Date(a.completedAt);
      return date >= twoWeeksAgo && date < weekAgo;
    });

    const quizzes = await Quiz.find({ 
      _id: { $in: attempts.map(a => a.quizId) } 
    });

    const report = generateWeeklyReport(currentWeekAttempts, quizzes, previousWeekAttempts);

    res.json(report);
  } catch (error) {
    console.error('Get weekly report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/teacher/alerts
// @desc    Get teacher alerts for students needing attention
// @access  Private (Teacher)
router.get('/teacher/alerts', authenticate, isTeacher, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    const attempts = await Attempt.find().populate('quizId');
    const quizzes = await Quiz.find();

    const alerts = await generateTeacherAlerts(students, attempts, quizzes);

    res.json({
      totalAlerts: alerts.length,
      highPriority: alerts.filter(a => a.severity === 'high').length,
      alerts: alerts.slice(0, 20) // Top 20 alerts
    });
  } catch (error) {
    console.error('Get teacher alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to generate graph insights
function generateGraphInsights(scoreOverTime, accuracyTrend, confidenceTrend) {
  const insights = [];

  if (scoreOverTime.length >= 2) {
    const firstScore = scoreOverTime[0].score;
    const lastScore = scoreOverTime[scoreOverTime.length - 1].score;
    const change = lastScore - firstScore;
    
    if (change > 0) {
      insights.push(`Your score improved by ${change} points over ${scoreOverTime.length} attempts.`);
    } else if (change < 0) {
      insights.push(`Your score decreased by ${Math.abs(change)} points. Focus on reviewing weak topics.`);
    }
  }

  if (accuracyTrend.length >= 3) {
    const recent3 = accuracyTrend.slice(-3);
    const older3 = accuracyTrend.slice(0, 3);
    
    if (recent3.length === 3 && older3.length === 3) {
      const recentAvg = recent3.reduce((sum, a) => sum + a.accuracy, 0) / 3;
      const olderAvg = older3.reduce((sum, a) => sum + a.accuracy, 0) / 3;
      const improvement = recentAvg - olderAvg;
      
      if (improvement > 5) {
        insights.push(`Your accuracy improved by ${Math.round(improvement)}% in the last 3 quizzes.`);
      }
    }
  }

  if (confidenceTrend.length >= 2) {
    const firstConf = confidenceTrend[0].confidenceScore;
    const lastConf = confidenceTrend[confidenceTrend.length - 1].confidenceScore;
    
    if (lastConf > firstConf + 10) {
      insights.push(`Your confidence score increased by ${lastConf - firstConf} points. Keep it up!`);
    }
  }

  return insights;
}

module.exports = router;
