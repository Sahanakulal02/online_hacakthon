const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedAnswer: {
    type: Number, // Index of selected option
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  timeTaken: {
    type: Number, // seconds
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard']
  },
  pointsEarned: {
    type: Number,
    default: 0
  }
});

const attemptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  answers: [answerSchema],
  totalScore: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number, // percentage
    default: 0
  },
  timeSpent: {
    type: Number, // total seconds
    default: 0
  },
  averageTimePerQuestion: {
    type: Number,
    default: 0
  },
  difficultyProgression: [{
    type: String,
    enum: ['easy', 'medium', 'hard']
  }],
  feedback: {
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    personalizedMessage: String
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate metrics before saving
attemptSchema.pre('save', function(next) {
  if (this.answers.length > 0) {
    const correctAnswers = this.answers.filter(a => a.isCorrect).length;
    this.accuracy = (correctAnswers / this.answers.length) * 100;
    this.totalScore = this.answers.reduce((sum, a) => sum + a.pointsEarned, 0);
    this.totalPoints = this.answers.reduce((sum, a) => sum + (a.pointsEarned > 0 ? 10 : 0), 0);
    this.timeSpent = this.answers.reduce((sum, a) => sum + a.timeTaken, 0);
    this.averageTimePerQuestion = this.timeSpent / this.answers.length;
  }
  next();
});

module.exports = mongoose.model('Attempt', attemptSchema);

