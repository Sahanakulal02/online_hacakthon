import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PerformanceLineChart = ({ data, dataKey, name, color = '#667eea', showDots = true }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="attemptNumber" 
          label={{ value: 'Attempt Number', position: 'insideBottom', offset: -5 }}
        />
        <YAxis 
          label={{ value: name, angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          formatter={(value) => [`${value}`, name]}
          labelFormatter={(label) => `Attempt ${label}`}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={2}
          dot={showDots ? { r: 4 } : false}
          name={name}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PerformanceLineChart;

