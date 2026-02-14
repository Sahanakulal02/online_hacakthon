import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Leaderboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState(null);
  const [type, setType] = useState('global');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
    if (type === 'global') {
      fetchGlobalLeaderboard();
    } else if (type === 'class') {
      fetchClassLeaderboard();
    }
  }, [type]);

  useEffect(() => {
    if (selectedQuiz && type === 'quiz') {
      fetchQuizLeaderboard(selectedQuiz);
    }
  }, [selectedQuiz, type]);

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get(`${API_URL}/quiz`);
      setQuizzes(response.data);
      if (response.data.length > 0 && type === 'quiz') {
        setSelectedQuiz(response.data[0]._id);
      }
    } catch (error) {
      toast.error('Failed to load quizzes');
    }
  };

  const fetchGlobalLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/leaderboard/global`);
      setLeaderboard(response.data);
    } catch (error) {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/leaderboard/class`);
      setLeaderboard(response.data);
    } catch (error) {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizLeaderboard = async (quizId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/leaderboard/quiz/${quizId}`);
      setLeaderboard(response.data);
    } catch (error) {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="container">
      <h1 className="page-title">Leaderboard 🏆</h1>

      <div className="leaderboard-tabs">
        <button
          className={`tab-btn ${type === 'global' ? 'active' : ''}`}
          onClick={() => setType('global')}
        >
          Global
        </button>
        <button
          className={`tab-btn ${type === 'class' ? 'active' : ''}`}
          onClick={() => setType('class')}
        >
          Class
        </button>
        <button
          className={`tab-btn ${type === 'quiz' ? 'active' : ''}`}
          onClick={() => setType('quiz')}
        >
          Quiz-wise
        </button>
      </div>

      {type === 'quiz' && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <label>Select Quiz:</label>
          <select
            value={selectedQuiz || ''}
            onChange={(e) => setSelectedQuiz(e.target.value)}
            className="form-group select"
            style={{ marginTop: '10px' }}
          >
            {quizzes.map((quiz) => (
              <option key={quiz._id} value={quiz._id}>
                {quiz.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {leaderboard && (
        <div className="card">
          {leaderboard.quiz && (
            <h2 style={{ marginBottom: '20px' }}>{leaderboard.quiz.title}</h2>
          )}
          <div className="leaderboard-table">
            <div className="leaderboard-header">
              <div>Rank</div>
              <div>Student</div>
              <div>Level</div>
              {type === 'quiz' ? (
                <>
                  <div>Score</div>
                  <div>Accuracy</div>
                  <div>Time</div>
                </>
              ) : (
                <>
                  <div>Total Points</div>
                  <div>Quizzes</div>
                  <div>Avg Accuracy</div>
                </>
              )}
            </div>
            {(leaderboard.leaderboard || []).map((entry, index) => (
              <div
                key={entry.student?.id || index}
                className={`leaderboard-row ${index < 3 ? 'top-three' : ''}`}
              >
                <div className="rank-cell">
                  <span className="rank-icon">{getRankIcon(index + 1)}</span>
                </div>
                <div className="student-cell">
                  <strong>{entry.student?.name || 'Unknown'}</strong>
                  {entry.student?.badges && entry.student.badges.length > 0 && (
                    <div className="badges">
                      {entry.student.badges.slice(0, 3).map((badge, i) => (
                        <span key={i} className="badge badge-primary" style={{ fontSize: '10px' }}>
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>{entry.student?.level || '-'}</div>
                {type === 'quiz' ? (
                  <>
                    <div><strong>{entry.score?.toFixed(1) || entry.totalScore || 0}</strong></div>
                    <div>{entry.accuracy?.toFixed(1) || 0}%</div>
                    <div>{Math.floor((entry.timeSpent || 0) / 60)}m {(entry.timeSpent || 0) % 60}s</div>
                  </>
                ) : (
                  <>
                    <div><strong>{entry.totalPoints || entry.leaderboardScore?.toFixed(1) || 0}</strong></div>
                    <div>{entry.totalQuizzes || 0}</div>
                    <div>{entry.averageAccuracy?.toFixed(1) || 0}%</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

