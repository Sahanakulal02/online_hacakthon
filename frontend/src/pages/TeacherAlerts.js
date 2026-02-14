import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './TeacherAlerts.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TeacherAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/teacher/alerts`);
      setAlerts(response.data);
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'alert-high';
      case 'medium': return 'alert-medium';
      case 'low': return 'alert-low';
      default: return '';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return 'ℹ️';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'engagement_drop': return '📉';
      case 'confidence_drop': return '😟';
      case 'persistent_weakness': return '⚠️';
      case 'inactivity': return '⏸️';
      default: return '📌';
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Student Alerts 🚨</h1>

      {alerts && (
        <>
          <div className="alerts-summary">
            <div className="summary-card">
              <h3>{alerts.totalAlerts}</h3>
              <p>Total Alerts</p>
            </div>
            <div className="summary-card summary-high">
              <h3>{alerts.highPriority}</h3>
              <p>High Priority</p>
            </div>
          </div>

          {alerts.alerts && alerts.alerts.length > 0 ? (
            <div className="alerts-list">
              {alerts.alerts.map((alert, index) => (
                <div key={index} className={`alert-card ${getSeverityColor(alert.severity)}`}>
                  <div className="alert-header">
                    <div className="alert-icon">
                      {getSeverityIcon(alert.severity)} {getTypeIcon(alert.type)}
                    </div>
                    <div className="alert-title">
                      <h3>{alert.studentName}</h3>
                      <span className={`badge badge-${alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'info'}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="alert-message">
                    <p>{alert.message}</p>
                  </div>

                  <div className="alert-intervention">
                    <strong>💡 Intervention Suggestion:</strong>
                    <p>{alert.intervention}</p>
                  </div>

                  {alert.data && (
                    <div className="alert-data">
                      {Object.entries(alert.data).map(([key, value]) => (
                        <div key={key} className="data-item">
                          <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>
                🎉 No alerts! All students are performing well.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherAlerts;

