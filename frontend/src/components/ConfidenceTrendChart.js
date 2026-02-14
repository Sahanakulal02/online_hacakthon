import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const ConfidenceTrendChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="attemptNumber" 
          label={{ value: 'Attempt Number', position: 'insideBottom', offset: -5 }}
        />
        <YAxis 
          label={{ value: 'Confidence Score', angle: -90, position: 'insideLeft' }}
          domain={[0, 100]}
        />
        <Tooltip 
          formatter={(value) => [`${value}`, 'Confidence Score']}
          labelFormatter={(label) => `Attempt ${label}`}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="confidenceScore" 
          stroke="#667eea" 
          fillOpacity={1}
          fill="url(#colorConfidence)"
          name="Confidence Score"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ConfidenceTrendChart;

