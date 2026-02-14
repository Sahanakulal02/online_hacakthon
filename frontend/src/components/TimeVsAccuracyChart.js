import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const TimeVsAccuracyChart = ({ data }) => {
  const getColor = (category) => {
    switch (category) {
      case 'fast_accurate': return '#28a745'; // Green
      case 'slow_accurate': return '#17a2b8'; // Blue
      case 'fast_inaccurate': return '#ffc107'; // Yellow
      case 'slow_inaccurate': return '#dc3545'; // Red
      default: return '#6c757d';
    }
  };

  const chartData = data.map((item, index) => ({
    ...item,
    color: getColor(item.category)
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number"
            dataKey="avgTime" 
            name="Average Time"
            label={{ value: 'Average Time per Question (seconds)', position: 'insideBottom', offset: -5 }}
            domain={[0, 60]}
          />
          <YAxis 
            type="number"
            dataKey="accuracy" 
            name="Accuracy"
            label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value, name) => {
              if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
              if (name === 'avgTime') return [`${value}s`, 'Avg Time'];
              return [value, name];
            }}
          />
          <Legend />
          <Scatter name="Performance" data={chartData} fill="#667eea">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <span style={{ color: '#28a745' }}>●</span> Fast & Accurate | 
        <span style={{ color: '#17a2b8' }}>●</span> Slow & Accurate | 
        <span style={{ color: '#ffc107' }}>●</span> Fast & Inaccurate | 
        <span style={{ color: '#dc3545' }}>●</span> Slow & Inaccurate
      </div>
    </div>
  );
};

export default TimeVsAccuracyChart;

