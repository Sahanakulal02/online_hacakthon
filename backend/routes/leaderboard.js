const express = require('express');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const router = express.Router();

/**
 * Calculate leaderboard score based on:
 * - Accuracy (weight: 40%)
 * - Difficulty weight (easy: 1x, medium: 1.5x, hard: 2x)
 * - Time bonus (faster = more bonus, up to 20%)
 */
const calculateLeaderboardScore = (attempt) => {
  const accuracyScore = attempt.accuracy * 0.4;
  
  // Difficulty weight based on average difficulty
  const difficultyWeights = { easy: 1.0, medium: 1.5, hard: 2.0 };
  const avgDifficulty = attempt.difficultyProgression.reduce((sum, d, i, arr) => {
    return sum + (difficultyWeights[d] || 1.0);
  }, 0) / attempt.difficultyProgression.length;
  
  const difficultyScore = (attempt.totalScore / attempt.totalPoints) * 100 * avgDifficulty * 0.4;
  
  // Time bonus: faster completion = more bonus
  const timeBonus = Math.max(0, (1 - attempt.averageTimePerQuestion / 30) * 20);
  
  return accuracyScore + difficultyScore + timeBonus;
};

// @route   GET /api/leaderboard/quiz/:quizId
// @desc    Get leaderboard for a specific quiz
// @access  Public
router.get('/quiz/:quizId', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const attempts = await Attempt.find({ quizId: req.params.quizId })
      .populate('studentId', 'name email level badges')
      .lean();

    // Calculate leaderboard scores
    const leaderboard = attempts.map(attempt => ({
      student: {
        id: attempt.studentId._id,
        name: attempt.studentId.name,
        email: attempt.studentId.email,
        level: attempt.studentId.level,
        badges: attempt.studentId.badges
      },
      score: calculateLeaderboardScore(attempt),
      accuracy: attempt.accuracy,
      totalScore: attempt.totalScore,
      timeSpent: attempt.timeSpent,
      completedAt: attempt.completedAt
    }));

    // Sort by score (descending)
    leaderboard.sort((a, b) => b.score - a.score);

    res.json({
      quiz: {
        id: quiz._id,
        title: quiz.title
      },
      leaderboard: leaderboard.slice(0, 100) // Top 100
    });
  } catch (error) {
    console.error('Get quiz leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/global
// @desc    Get global leaderboard (all students)
// @access  Public
router.get('/global', async (req, res) => {
  try {
    // Use MongoDB aggregation for efficient leaderboard calculation
    const leaderboard = await Attempt.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $match: {
          'student.role': 'student'
        }
      },
      {
        $group: {
          _id: '$studentId',
          student: {
            $first: {
              id: '$student._id',
              name: '$student.name',
              email: '$student.email',
              level: '$student.level',
              badges: '$student.badges'
            }
          },
          totalQuizzes: { $sum: 1 },
          averageAccuracy: { $avg: '$accuracy' },
          totalPoints: { $sum: '$totalScore' },
          bestScore: { $max: '$totalScore' }
        }
      },
      {
        $project: {
          _id: 0,
          student: 1,
          totalQuizzes: 1,
          averageAccuracy: { $round: ['$averageAccuracy', 2] },
          totalPoints: 1,
          bestScore: 1,
          leaderboardScore: {
            $add: [
              { $multiply: ['$averageAccuracy', 0.5] },
              { $multiply: [{ $divide: ['$totalPoints', 100] }, 0.5] }
            ]
          }
        }
      },
      {
        $sort: { leaderboardScore: -1 }
      },
      {
        $limit: 100
      }
    ]);

    res.json({
      leaderboard
    });
  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaderboard/class
// @desc    Get class-wise leaderboard (all students ranked)
// @access  Public
router.get('/class', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email level totalPoints badges totalQuizzesAttempted averageAccuracy')
      .sort({ totalPoints: -1 })
      .limit(100);

    const leaderboard = students.map((student, index) => ({
      rank: index + 1,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        level: student.level,
        badges: student.badges
      },
      totalPoints: student.totalPoints,
      totalQuizzes: student.totalQuizzesAttempted,
      averageAccuracy: student.averageAccuracy
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get class leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

