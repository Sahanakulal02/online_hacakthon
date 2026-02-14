import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import './TakeQuiz.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions[currentQuestion]) {
      const timeLimit = quiz.questions[currentQuestion].timeLimit || 30;
      setTimeLeft(timeLimit);
      setQuestionStartTime(Date.now());
      setSelectedAnswer(null);
    }
  }, [currentQuestion, quiz]);

  useEffect(() => {
    if (timeLeft <= 0 && quiz) {
      handleNext();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quiz]);

  const fetchQuiz = async () => {
    try {
      const response = await axios.get(`${API_URL}/quiz/${quizId}`);
      setQuiz(response.data);
      setAnswers(new Array(response.data.questions.length).fill(null));
    } catch (error) {
      toast.error('Failed to load quiz');
      navigate('/student/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (index) => {
    setSelectedAnswer(index);
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestion] = index;
      return newAnswers;
    });
  };

  const handleNext = () => {
    if (selectedAnswer === null && answers[currentQuestion] === null) {
      toast.error('Please select an answer');
      return;
    }

    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const answerData = {
      questionIndex: currentQuestion,
      selectedAnswer: selectedAnswer !== null ? selectedAnswer : answers[currentQuestion],
      timeTaken
    };

    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestion] = answerData;
      return newAnswers;
    });

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      // Calculate time for last question if not set
      const finalAnswers = answers.map((ans, idx) => {
        if (ans && typeof ans === 'object') return ans;
        const timeTaken = idx === currentQuestion 
          ? Math.floor((Date.now() - questionStartTime) / 1000)
          : 30;
        return {
          questionIndex: idx,
          selectedAnswer: ans !== null ? ans : 0,
          timeTaken
        };
      });

      const response = await axios.post(
        `${API_URL}/student/quiz/${quizId}/attempt`,
        { answers: finalAnswers }
      );

      toast.success('Quiz submitted successfully!');
      navigate(`/student/result/${response.data.attempt._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (!quiz) {
    return <div className="container">Quiz not found</div>;
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h1>{quiz.title}</h1>
        <div className="quiz-meta">
          <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
          <span className={`timer ${timeLeft <= 10 ? 'timer-warning' : ''}`}>
            ⏱️ {timeLeft}s
          </span>
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="question-card fade-in">
        <div className="question-header">
          <span className={`badge badge-${question.difficulty === 'easy' ? 'success' : question.difficulty === 'medium' ? 'warning' : 'danger'}`}>
            {question.difficulty.toUpperCase()}
          </span>
          <span className="points">Points: {question.points}</span>
        </div>
        
        <h2 className="question-text">{question.questionText}</h2>
        
        <div className="options">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`option-btn ${
                selectedAnswer === index || answers[currentQuestion] === index
                  ? 'option-selected'
                  : ''
              }`}
              onClick={() => handleAnswerSelect(index)}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>

        <div className="quiz-actions">
          {currentQuestion > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setCurrentQuestion(currentQuestion - 1);
                setSelectedAnswer(answers[currentQuestion - 1]);
              }}
            >
              Previous
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={submitting}
          >
            {currentQuestion === quiz.questions.length - 1 ? 'Submit Quiz' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;

