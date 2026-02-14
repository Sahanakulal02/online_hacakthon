import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/student/profile`);
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="container">
      <h1 className="page-title">Welcome, {user?.name}! 🎮</h1>
      
      <div className="grid grid-3">
        <div className="stats-card">
          <h3>{stats?.level || 1}</h3>
          <p>Level</p>
        </div>
        <div className="stats-card">
          <h3>{stats?.totalPoints || 0}</h3>
          <p>Total Points</p>
        </div>
        <div className="stats-card">
          <h3>{stats?.averageAccuracy?.toFixed(1) || 0}%</h3>
          <p>Average Accuracy</p>
        </div>
      </div>

      <div className="card">
        <h2>Your Badges 🏆</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
          {stats?.badges && stats.badges.length > 0 ? (
            stats.badges.map((badge, index) => (
              <span key={index} className="badge badge-primary">
                {badge}
              </span>
            ))
          ) : (
            <p>No badges yet. Complete quizzes to earn badges!</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }}>
          <Link to="/student/quizzes" className="btn btn-primary">
            Browse Quizzes
          </Link>
          <Link to="/student/analytics" className="btn btn-success">
            View Analytics
          </Link>
          <Link to="/leaderboard" className="btn btn-secondary">
            View Leaderboard
          </Link>
        </div>
      </div>

      {stats?.recentAttempts && stats.recentAttempts.length > 0 && (
        <div className="card">
          <h2>Recent Attempts</h2>
          <div style={{ marginTop: '20px' }}>
            {stats.recentAttempts.map((attempt, index) => (
              <div key={index} style={{ 
                padding: '15px', 
                border: '1px solid #e0e0e0', 
                borderRadius: '8px', 
                marginBottom: '10px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{attempt.quizId?.title || 'Quiz'}</strong>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      Accuracy: {attempt.accuracy?.toFixed(1)}% | Score: {attempt.score}
                    </p>
                  </div>
                  <span className="badge badge-success">
                    {new Date(attempt.completedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

