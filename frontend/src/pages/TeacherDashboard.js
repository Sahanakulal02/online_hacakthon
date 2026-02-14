import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import './TeacherDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];

const TeacherDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [studentEngagement, setStudentEngagement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchStudentEngagement();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentEngagement = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/students`);
      setStudentEngagement(response.data);
    } catch (error) {
      toast.error('Failed to load student engagement data');
    }
  };

  const fetchQuizAnalytics = async (quizId) => {
    try {
      const response = await axios.get(`${API_URL}/analytics/quiz/${quizId}`);
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load quiz analytics');
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  const getDropOutRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      default: return 'badge-success';
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Teacher Dashboard 📊</h1>

      {dashboardData && (
        <>
          <div className="grid grid-3">
            <div className="stats-card">
              <h3>{dashboardData.quizzes?.total || 0}</h3>
              <p>Total Quizzes</p>
            </div>
            <div className="stats-card">
              <h3>{dashboardData.students?.total || 0}</h3>
              <p>Total Students</p>
            </div>
            <div className="stats-card">
              <h3>{dashboardData.students?.active || 0}</h3>
              <p>Active Students</p>
            </div>
          </div>

          {dashboardData.quizzes?.completionRates && dashboardData.quizzes.completionRates.length > 0 && (
            <div className="card">
              <h2>Quiz Completion Rates</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.quizzes.completionRates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completionRate" fill="#667eea" name="Completion Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {studentEngagement && (
        <>
          <div className="card">
            <h2>Student Engagement Overview</h2>
            <div className="grid grid-2" style={{ marginBottom: '20px' }}>
              <div>
                <p><strong>Total Students:</strong> {studentEngagement.overall?.totalStudents || 0}</p>
                <p><strong>Active Students:</strong> {studentEngagement.overall?.activeStudents || 0}</p>
              </div>
              <div>
                <p><strong>Inactive Students:</strong> {studentEngagement.overall?.inactiveStudents || 0}</p>
                <p><strong>Average Engagement:</strong> {studentEngagement.overall?.averageEngagement || 0}%</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Student Performance & Engagement</h2>
            <div className="students-table">
              <div className="table-header">
                <div>Student</div>
                <div>Quizzes</div>
                <div>Avg Accuracy</div>
                <div>Points</div>
                <div>Engagement</div>
                <div>Risk</div>
              </div>
              {studentEngagement.students?.slice(0, 10).map((student, index) => (
                <div key={index} className="table-row">
                  <div><strong>{student.student.name}</strong></div>
                  <div>{student.totalQuizzes}</div>
                  <div>{student.averageAccuracy?.toFixed(1) || 0}%</div>
                  <div>{student.totalPoints}</div>
                  <div>
                    <div className="engagement-bar">
                      <div 
                        className="engagement-fill" 
                        style={{ width: `${student.engagementScore}%` }}
                      >
                        {student.engagementScore}%
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className={`badge ${getDropOutRiskColor(student.dropOutRisk)}`}>
                      {student.dropOutRisk.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="card">
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/teacher/create-quiz" className="btn btn-primary">
            Create New Quiz
          </Link>
          <Link to="/teacher/alerts" className="btn btn-danger">
            View Alerts
          </Link>
          <Link to="/leaderboard" className="btn btn-secondary">
            View Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

