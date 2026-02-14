const express = require('express');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const { authenticate, isStudent } = require('../middleware/auth');
const { getNextDifficulty, calculatePoints } = require('../utils/adaptiveDifficulty');
const { generateFeedback } = require('../utils/personalizedFeedback');
const router = express.Router();

// @route   POST /api/student/quiz/:quizId/attempt
// @desc    Submit quiz attempt
// @access  Private (Student)
router.post('/quiz/:quizId/attempt', authenticate, isStudent, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // Array of { questionIndex, selectedAnswer, timeTaken }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (!answers || answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: 'All questions must be answered' });
    }

    // Process answers and calculate scores
    const processedAnswers = [];
    const difficultyProgression = [];
    let currentDifficulty = quiz.difficulty;

    for (let i = 0; i < answers.length; i++) {
      const answerData = answers[i];
      const question = quiz.questions[i];
      const isCorrect = answerData.selectedAnswer === question.correctAnswer;
      
      // Calculate points with difficulty multiplier
      const pointsEarned = calculatePoints(
        isCorrect,
        question.difficulty,
        question.points,
        answerData.timeTaken,
        question.timeLimit
      );

      processedAnswers.push({
        questionId: question._id,
        selectedAnswer: answerData.selectedAnswer,
        isCorrect,
        timeTaken: answerData.timeTaken,
        difficulty: question.difficulty,
        pointsEarned
      });

      // Adaptive difficulty: adjust for next question based on performance so far
      if (i < answers.length - 1) { // Not the last question
        const answersSoFar = processedAnswers;
        const accuracy = (answersSoFar.filter(a => a.isCorrect).length / answersSoFar.length) * 100;
        const avgTime = answersSoFar.reduce((sum, a) => sum + a.timeTaken, 0) / answersSoFar.length;
        
        currentDifficulty = getNextDifficulty({
          accuracy,
          averageTime: avgTime,
          currentDifficulty: question.difficulty,
          timeThreshold: question.timeLimit * 0.6
        });
      }

      difficultyProgression.push(question.difficulty);
    }

    // Create attempt record
    const attempt = new Attempt({
      studentId: req.user._id,
      quizId: quiz._id,
      answers: processedAnswers,
      difficultyProgression
    });

    await attempt.save();

    // Generate personalized feedback
    const feedback = await generateFeedback(attempt, quiz);
    attempt.feedback = feedback;
    await attempt.save();

    // Update student stats
    const student = await User.findById(req.user._id);
    student.totalQuizzesAttempted += 1;
    
    // Update average accuracy
    const allAttempts = await Attempt.find({ studentId: student._id });
    const totalAccuracy = allAttempts.reduce((sum, a) => sum + a.accuracy, 0);
    student.averageAccuracy = totalAccuracy / allAttempts.length;

    // Update points and level
    student.totalPoints += attempt.totalScore;
    
    // Level up logic: 100 points per level
    const newLevel = Math.floor(student.totalPoints / 100) + 1;
    if (newLevel > student.level) {
      student.level = newLevel;
      // Award badge for leveling up
      if (!student.badges.includes(`Level ${newLevel}`)) {
        student.badges.push(`Level ${newLevel}`);
      }
    }

    // Award badges based on performance
    if (attempt.accuracy >= 90 && !student.badges.includes('Perfect Score')) {
      student.badges.push('Perfect Score');
    }
    if (attempt.accuracy >= 80 && !student.badges.includes('Excellent')) {
      student.badges.push('Excellent');
    }
    if (attempt.totalScore >= 100 && !student.badges.includes('High Scorer')) {
      student.badges.push('High Scorer');
    }

    await student.save();

    // Populate attempt with quiz details for response
    const populatedAttempt = await Attempt.findById(attempt._id)
      .populate('quizId', 'title')
      .populate('studentId', 'name level totalPoints badges');

    res.status(201).json({
      message: 'Quiz submitted successfully',
      attempt: populatedAttempt
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/student/attempts
// @desc    Get student's quiz attempts
// @access  Private (Student)
router.get('/attempts', authenticate, isStudent, async (req, res) => {
  try {
    const attempts = await Attempt.find({ studentId: req.user._id })
      .populate('quizId', 'title description')
      .sort({ completedAt: -1 });

    res.json(attempts);
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/student/attempts/:attemptId
// @desc    Get detailed attempt with feedback
// @access  Private (Student)
router.get('/attempts/:attemptId', authenticate, isStudent, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId)
      .populate('quizId')
      .populate('studentId', 'name level totalPoints badges');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Check if attempt belongs to student
    if (attempt.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(attempt);
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/student/profile
// @desc    Get student profile with stats
// @access  Private (Student)
router.get('/profile', authenticate, isStudent, async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    const attempts = await Attempt.find({ studentId: req.user._id });

    const stats = {
      totalQuizzes: attempts.length,
      averageAccuracy: student.averageAccuracy,
      totalPoints: student.totalPoints,
      level: student.level,
      badges: student.badges,
      recentAttempts: attempts.slice(0, 5).map(a => ({
        quizId: a.quizId,
        accuracy: a.accuracy,
        score: a.totalScore,
        completedAt: a.completedAt
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

