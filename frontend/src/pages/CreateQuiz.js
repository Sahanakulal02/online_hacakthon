import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import './CreateQuiz.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    questions: [
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        difficulty: 'medium',
        topic: '',
        points: 10,
        timeLimit: 30
      }
    ]
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          difficulty: 'medium',
          topic: '',
          points: 10,
          timeLimit: 30
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    if (formData.questions.length > 1) {
      const newQuestions = formData.questions.filter((_, i) => i !== index);
      setFormData({ ...formData, questions: newQuestions });
    } else {
      toast.error('At least one question is required');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Quiz title is required');
      return;
    }

    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        toast.error(`Question ${i + 1} must have all 4 options filled`);
        return;
      }
      if (!q.topic.trim()) {
        toast.error(`Question ${i + 1} topic is required`);
        return;
      }
    }

    try {
      await axios.post(`${API_URL}/quiz`, formData);
      toast.success('Quiz created successfully!');
      navigate('/teacher/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create quiz');
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Create New Quiz 📝</h1>

      <form onSubmit={handleSubmit} className="create-quiz-form">
        <div className="card">
          <h2>Quiz Information</h2>
          <div className="form-group">
            <label>Quiz Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., JavaScript Fundamentals"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Brief description of the quiz"
            />
          </div>
          <div className="form-group">
            <label>Overall Difficulty</label>
            <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Questions ({formData.questions.length})</h2>
            <button type="button" onClick={addQuestion} className="btn btn-success">
              + Add Question
            </button>
          </div>

          {formData.questions.map((question, qIndex) => (
            <div key={qIndex} className="question-editor">
              <div className="question-header">
                <h3>Question {qIndex + 1}</h3>
                {formData.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="btn btn-danger btn-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Question Text *</label>
                <textarea
                  value={question.questionText}
                  onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                  required
                  rows="2"
                  placeholder="Enter the question"
                />
              </div>

              <div className="form-group">
                <label>Topic *</label>
                <input
                  type="text"
                  value={question.topic}
                  onChange={(e) => handleQuestionChange(qIndex, 'topic', e.target.value)}
                  required
                  placeholder="e.g., Variables, Arrays, Objects"
                />
              </div>

              <div className="form-group">
                <label>Options *</label>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="option-input-group">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={question.correctAnswer === oIndex}
                      onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      required
                      placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                      className="option-input"
                    />
                  </div>
                ))}
              </div>

              <div className="question-meta">
                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    value={question.difficulty}
                    onChange={(e) => handleQuestionChange(qIndex, 'difficulty', e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Points</label>
                  <input
                    type="number"
                    value={question.points}
                    onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Time Limit (seconds)</label>
                  <input
                    type="number"
                    value={question.timeLimit}
                    onChange={(e) => handleQuestionChange(qIndex, 'timeLimit', parseInt(e.target.value))}
                    min="10"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-large">
            Create Quiz
          </button>
          <button
            type="button"
            onClick={() => navigate('/teacher/dashboard')}
            className="btn btn-secondary btn-large"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuiz;

