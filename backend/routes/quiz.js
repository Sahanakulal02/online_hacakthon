const express = require('express');
const { body, validationResult } = require('express-validator');
const Quiz = require('../models/Quiz');
const { authenticate, isTeacher } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/quiz
// @desc    Get all active quizzes
// @access  Public (for demo, can be made private)
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isActive: true })
      .populate('createdBy', 'name email')
      .select('-questions.correctAnswer') // Don't send correct answers
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quiz/:id
// @desc    Get quiz by ID (without answers for students)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'name email')
      .select('-questions.correctAnswer');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/quiz
// @desc    Create a new quiz (Teacher only)
// @access  Private (Teacher)
router.post('/', authenticate, isTeacher, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional(),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
  body('questions.*.questionText').notEmpty().withMessage('Question text is required'),
  body('questions.*.options').isArray({ min: 2 }).withMessage('At least 2 options required'),
  body('questions.*.correctAnswer').isInt({ min: 0 }).withMessage('Valid correct answer index required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, questions, difficulty } = req.body;

    const quiz = new Quiz({
      title,
      description,
      questions,
      difficulty: difficulty || 'medium',
      createdBy: req.user._id
    });

    await quiz.save();

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz: await Quiz.findById(quiz._id).populate('createdBy', 'name email')
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/quiz/:id
// @desc    Update quiz (Teacher only)
// @access  Private (Teacher)
router.put('/:id', authenticate, isTeacher, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if user created this quiz
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this quiz' });
    }

    Object.assign(quiz, req.body);
    await quiz.save();

    res.json({
      message: 'Quiz updated successfully',
      quiz
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/quiz/:id
// @desc    Delete quiz (Teacher only)
// @access  Private (Teacher)
router.delete('/:id', authenticate, isTeacher, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if user created this quiz
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this quiz' });
    }

    await quiz.deleteOne();

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

