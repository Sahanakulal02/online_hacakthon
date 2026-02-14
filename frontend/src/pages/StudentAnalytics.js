import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import PerformanceLineChart from '../components/PerformanceLineChart';
import TopicPerformanceChart from '../components/TopicPerformanceChart';
import ConfidenceTrendChart from '../components/ConfidenceTrendChart';
import TimeVsAccuracyChart from '../components/TimeVsAccuracyChart';
import ImprovementPanel from '../components/ImprovementPanel';
import './StudentAnalytics.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const StudentAnalytics = () => {
  const { user } = useAuth();
  const [graphData, setGraphData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('graphs');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const userId = user.id || user._id;
      const [graphsResponse, performanceResponse] = await Promise.all([
        axios.get(`${API_URL}/analytics/student/${userId}/graphs`),
        axios.get(`${API_URL}/analytics/student/${userId}/performance`)
      ]);

      setGraphData(graphsResponse.data);
      setPerformanceData(performanceResponse.data);
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="container">
      <h1 className="page-title">Your Performance Analytics 📈</h1>

      <div className="analytics-tabs">
        <button
          className={`tab-btn ${activeTab === 'graphs' ? 'active' : ''}`}
          onClick={() => setActiveTab('graphs')}
        >
          📊 Graphs
        </button>
        <button
          className={`tab-btn ${activeTab === 'improvement' ? 'active' : ''}`}
          onClick={() => setActiveTab('improvement')}
        >
          💡 How to Improve
        </button>
      </div>

      {activeTab === 'graphs' && graphData && (
        <div className="analytics-content">
          {/* Insights */}
          {graphData.insights && graphData.insights.length > 0 && (
            <div className="insights-card">
              <h3>🎯 Key Insights</h3>
              <ul>
                {graphData.insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Score Over Time */}
          {graphData.scoreOverTime && graphData.scoreOverTime.length > 0 && (
            <div className="card">
              <h2>Score Over Time</h2>
              <p className="chart-description">
                Track your quiz scores across multiple attempts. See if you're improving!
              </p>
              <PerformanceLineChart
                data={graphData.scoreOverTime}
                dataKey="score"
                name="Score"
                color="#667eea"
              />
            </div>
          )}

          {/* Accuracy Trend */}
          {graphData.accuracyTrend && graphData.accuracyTrend.length > 0 && (
            <div className="card">
              <h2>Accuracy Trend</h2>
              <p className="chart-description">
                Your accuracy percentage over time. Aim for consistent improvement!
              </p>
              <PerformanceLineChart
                data={graphData.accuracyTrend}
                dataKey="accuracy"
                name="Accuracy (%)"
                color="#28a745"
              />
            </div>
          )}

          {/* Topic Performance */}
          {graphData.topicPerformance && graphData.topicPerformance.length > 0 && (
            <div className="card">
              <h2>Topic-wise Performance</h2>
              <p className="chart-description">
                See which topics you're strong in (green) and which need more practice (red).
              </p>
              <TopicPerformanceChart data={graphData.topicPerformance} />
              <div className="topic-legend">
                {graphData.topicPerformance.map((topic, index) => (
                  <div key={index} className="topic-item">
                    <span className={`topic-status topic-${topic.status}`}></span>
                    <span>{topic.topic}: {topic.accuracy}% ({topic.totalQuestions} questions)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Trend */}
          {graphData.confidenceTrend && graphData.confidenceTrend.length > 0 && (
            <div className="card">
              <h2>Confidence Score Trend</h2>
              <p className="chart-description">
                Your confidence score based on accuracy, time consistency, and difficulty progression.
              </p>
              <ConfidenceTrendChart data={graphData.confidenceTrend} />
            </div>
          )}

          {/* Time vs Accuracy */}
          {graphData.timeVsAccuracy && graphData.timeVsAccuracy.length > 0 && (
            <div className="card">
              <h2>Time vs Accuracy Analysis</h2>
              <p className="chart-description">
                Identify if you're fast & accurate (ideal), slow but accurate (needs speed practice), 
                or fast but inaccurate (needs understanding).
              </p>
              <TimeVsAccuracyChart data={graphData.timeVsAccuracy} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'improvement' && (
        <div className="analytics-content">
          <ImprovementPanel performanceData={performanceData} />
        </div>
      )}
    </div>
  );
};

export default StudentAnalytics;

