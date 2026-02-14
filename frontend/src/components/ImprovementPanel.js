import React from 'react';
import './ImprovementPanel.css';

const ImprovementPanel = ({ performanceData }) => {
  if (!performanceData) {
    return <div className="improvement-panel">Loading improvement insights...</div>;
  }

  const { gapAnalysis, timeAnalysis, mistakePatterns, improvementPlan, confidenceScore } = performanceData;

  return (
    <div className="improvement-panel">
      <h2>📊 How to Improve</h2>

      {/* What Went Wrong */}
      {gapAnalysis?.weakAreas && gapAnalysis.weakAreas.length > 0 && (
        <div className="improvement-section">
          <h3>❌ What Went Wrong</h3>
          <div className="weak-areas">
            {gapAnalysis.weakAreas.slice(0, 3).map((area, index) => (
              <div key={index} className="weak-area-item">
                <strong>{area.topic}</strong>
                <span className="badge badge-danger">{area.accuracy}% accuracy</span>
                <p>{area.mistakeRate > 40 ? 'High mistake rate - concept needs revision' : 'Low accuracy - needs more practice'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why It Happened */}
      {gapAnalysis?.rootCauses && gapAnalysis.rootCauses.length > 0 && (
        <div className="improvement-section">
          <h3>🔍 Why It Happened</h3>
          <ul className="root-causes">
            {gapAnalysis.rootCauses.slice(0, 3).map((cause, index) => (
              <li key={index}>
                <strong>{cause.topic}:</strong> {cause.causes.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Time Analysis Insights */}
      {timeAnalysis?.insights && timeAnalysis.insights.length > 0 && (
        <div className="improvement-section">
          <h3>⏱️ Speed vs Understanding</h3>
          {timeAnalysis.insights.map((insight, index) => (
            <div key={index} className={`insight insight-${insight.type}`}>
              <p>{insight.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mistake Patterns */}
      {mistakePatterns?.patterns && mistakePatterns.patterns.length > 0 && (
        <div className="improvement-section">
          <h3>🔄 Mistake Patterns</h3>
          {mistakePatterns.patterns.map((pattern, index) => (
            <div key={index} className="pattern-item">
              <p>{pattern.message}</p>
              {pattern.topics && (
                <div className="pattern-topics">
                  {pattern.topics.map((topic, i) => (
                    <span key={i} className="badge badge-warning">{topic}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* What to Revise */}
      {improvementPlan?.practicePlan && improvementPlan.practicePlan.length > 0 && (
        <div className="improvement-section">
          <h3>📚 What to Revise</h3>
          {improvementPlan.practicePlan.slice(0, 3).map((plan, index) => (
            <div key={index} className="practice-plan-item">
              <div className="plan-header">
                <strong>{plan.topic}</strong>
                <span className={`badge badge-${plan.priority === 'high' ? 'danger' : plan.priority === 'medium' ? 'warning' : 'info'}`}>
                  {plan.priority} priority
                </span>
              </div>
              <p className="plan-message">{plan.message}</p>
              <div className="plan-recommendations">
                {plan.recommendations.map((rec, i) => (
                  <div key={i} className="recommendation">
                    <span className="badge badge-primary">{rec.difficulty}</span>
                    <span>{rec.questions} questions</span>
                    <span className="reason">{rec.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confidence Score */}
      {confidenceScore && (
        <div className="improvement-section confidence-section">
          <h3>💪 Confidence Score</h3>
          <div className="confidence-display">
            <div className={`confidence-badge confidence-${confidenceScore.category}`}>
              <h4>{confidenceScore.score}/100</h4>
              <p>{confidenceScore.category.toUpperCase()}</p>
            </div>
            <p className="confidence-explanation">{confidenceScore.explanation}</p>
            <div className="confidence-factors">
              <div>Accuracy: {confidenceScore.factors.accuracy} pts</div>
              <div>Time Consistency: {confidenceScore.factors.timeConsistency} pts</div>
              <div>Difficulty Progression: {confidenceScore.factors.difficultyProgression} pts</div>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {improvementPlan?.summary && (
        <div className="improvement-summary">
          <h3>📋 Summary</h3>
          <p>{improvementPlan.summary}</p>
        </div>
      )}
    </div>
  );
};

export default ImprovementPanel;

