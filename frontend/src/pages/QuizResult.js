import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import './QuizResult.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const QuizResult = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      const response = await axios.get(`${API_URL}/student/attempts/${attemptId}`);
      setAttempt(response.data);
    } catch (error) {
      toast.error('Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (!attempt) {
    return <div className="container">Result not found</div>;
  }

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'success';
    if (accuracy >= 60) return 'warning';
    return 'danger';
  };

  return (
    <div className="container">
      <div className="result-header">
        <h1>Quiz Results 🎯</h1>
        <div className={`accuracy-badge accuracy-${getAccuracyColor(attempt.accuracy)}`}>
          <h2>{attempt.accuracy.toFixed(1)}%</h2>
          <p>Accuracy</p>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="stats-card">
          <h3>{attempt.totalScore}</h3>
          <p>Total Score</p>
        </div>
        <div className="stats-card">
          <h3>{attempt.totalPoints}</h3>
          <p>Total Points</p>
        </div>
        <div className="stats-card">
          <h3>{Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s</h3>
          <p>Time Spent</p>
        </div>
      </div>

      {attempt.feedback && (
        <div className="card feedback-card">
          <h2>Personalized Feedback 💡</h2>
          <p className="feedback-message">{attempt.feedback.personalizedMessage}</p>
          
          {attempt.feedback.strengths && attempt.feedback.strengths.length > 0 && (
            <div className="feedback-section">
              <h3>✅ Strengths</h3>
              <div className="feedback-tags">
                {attempt.feedback.strengths.map((strength, index) => (
                  <span key={index} className="badge badge-success">
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          )}

          {attempt.feedback.weaknesses && attempt.feedback.weaknesses.length > 0 && (
            <div className="feedback-section">
              <h3>⚠️ Areas to Improve</h3>
              <div className="feedback-tags">
                {attempt.feedback.weaknesses.map((weakness, index) => (
                  <span key={index} className="badge badge-warning">
                    {weakness}
                  </span>
                ))}
              </div>
            </div>
          )}

          {attempt.feedback.suggestions && attempt.feedback.suggestions.length > 0 && (
            <div className="feedback-section">
              <h3>💡 Suggestions</h3>
              <ul>
                {attempt.feedback.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2>Question Review</h2>
        <div className="questions-review">
          {attempt.answers && attempt.quizId && attempt.quizId.questions && attempt.answers.map((answer, index) => {
            const question = attempt.quizId.questions[index];
            return (
              <div 
                key={index} 
                className={`question-review-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}
              >
                <div className="question-review-header">
                  <span className="question-number">Q{index + 1}</span>
                  <span className={`status-badge ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                    {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                  <span className="points-earned">
                    {answer.pointsEarned} pts | {answer.timeTaken}s
                  </span>
                </div>
                <p className="question-text">{question.questionText}</p>
                <div className="answer-details">
                  <p><strong>Your Answer:</strong> {question.options[answer.selectedAnswer]}</p>
                  {!answer.isCorrect && (
                    <p><strong>Correct Answer:</strong> {question.options[question.correctAnswer]}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="result-actions">
        <Link to="/student/quizzes" className="btn btn-primary">
          Take Another Quiz
        </Link>
        <Link to="/student/analytics" className="btn btn-success">
          View Analytics
        </Link>
        <Link to="/student/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
        <Link to="/leaderboard" className="btn btn-secondary">
          View Leaderboard
        </Link>
      </div>
    </div>
  );
};

export default QuizResult;

