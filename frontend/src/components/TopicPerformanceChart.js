import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const TopicPerformanceChart = ({ data }) => {
  const getColor = (accuracy) => {
    if (accuracy >= 70) return '#28a745'; // Green - Strong
    if (accuracy >= 50) return '#ffc107'; // Yellow - Average
    return '#dc3545'; // Red - Weak
  };

  const chartData = data.map(item => ({
    ...item,
    color: getColor(item.accuracy)
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="topic" 
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis 
          label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
          domain={[0, 100]}
        />
        <Tooltip 
          formatter={(value) => [`${value}%`, 'Accuracy']}
        />
        <Legend />
        <Bar dataKey="accuracy" name="Accuracy">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopicPerformanceChart;

