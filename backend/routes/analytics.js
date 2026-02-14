const express = require('express');
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { authenticate, isTeacher } = require('../middleware/auth');
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

    // Check if teacher created this quiz
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const attempts = await Attempt.find({ quizId: req.params.quizId });

    // Calculate metrics
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.answers.length === quiz.questions.length).length;
    const completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
    
    const averageAccuracy = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length
      : 0;

    const averageTime = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.timeSpent, 0) / attempts.length
      : 0;

    // Topic-wise performance
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

    // Difficulty-wise performance
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

    // Calculate engagement metrics
    const studentEngagement = students.map(student => {
      const studentAttempts = attempts.filter(a => 
        a.studentId._id.toString() === student._id.toString()
      );

      const recentAttempts = studentAttempts.filter(a => {
        const daysSince = (Date.now() - new Date(a.completedAt)) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });

      // Engagement score: based on recent activity and consistency
      const engagementScore = Math.min(100, 
        (recentAttempts.length * 10) + 
        (student.totalQuizzesAttempted * 2) +
        (student.averageAccuracy * 0.5)
      );

      // Drop-out risk indicator (rule-based)
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

    // Overall metrics
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

    // Quiz completion rates
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

    // Learning consistency score (based on regular attempts)
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
        // Lower average interval = more consistent (max score for daily attempts)
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

module.exports = router;

