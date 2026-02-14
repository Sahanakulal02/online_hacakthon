const express = require('express');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const { authenticate, isTeacher } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/teacher/quizzes
// @desc    Get all quizzes created by teacher
// @access  Private (Teacher)
router.get('/quizzes', authenticate, isTeacher, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (error) {
    console.error('Get teacher quizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teacher/quiz/:quizId/attempts
// @desc    Get all attempts for a quiz
// @access  Private (Teacher)
router.get('/quiz/:quizId/attempts', authenticate, isTeacher, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if teacher created this quiz
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const attempts = await Attempt.find({ quizId: req.params.quizId })
      .populate('studentId', 'name email level totalPoints')
      .sort({ completedAt: -1 });

    res.json(attempts);
  } catch (error) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teacher/students
// @desc    Get all students
// @access  Private (Teacher)
router.get('/students', authenticate, isTeacher, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ totalPoints: -1 });

    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teacher/student/:studentId
// @desc    Get student details with all attempts
// @access  Private (Teacher)
router.get('/student/:studentId', authenticate, isTeacher, async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId)
      .select('-password');

    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const attempts = await Attempt.find({ studentId: req.params.studentId })
      .populate('quizId', 'title')
      .sort({ completedAt: -1 });

    res.json({
      student,
      attempts
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

