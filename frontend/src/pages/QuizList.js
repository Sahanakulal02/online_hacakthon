import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const QuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get(`${API_URL}/quiz`);
      setQuizzes(response.data);
    } catch (error) {
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'hard': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Available Quizzes 📚</h1>
      
      {quizzes.length === 0 ? (
        <div className="card">
          <p>No quizzes available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="card fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <h2>{quiz.title}</h2>
                <span className={`badge ${getDifficultyColor(quiz.difficulty)}`}>
                  {quiz.difficulty.toUpperCase()}
                </span>
              </div>
              {quiz.description && (
                <p style={{ color: '#666', marginBottom: '15px' }}>{quiz.description}</p>
              )}
              <div style={{ marginBottom: '15px' }}>
                <p><strong>Questions:</strong> {quiz.questions?.length || 0}</p>
                <p><strong>Total Points:</strong> {quiz.totalPoints || 0}</p>
              </div>
              <Link 
                to={`/student/quiz/${quiz._id}`} 
                className="btn btn-primary"
                style={{ width: '100%', textAlign: 'center', display: 'block' }}
              >
                Start Quiz
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizList;

