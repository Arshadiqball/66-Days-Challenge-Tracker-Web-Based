import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl px-3 py-2 text-xs border-gold">
        <p style={{ color: 'var(--brand-gold)' }} className="font-semibold">{label}</p>
        <p style={{ color: 'var(--text-secondary)' }}>{payload[0].value} entries</p>
      </div>
    );
  }
  return null;
};

export default function MoodChart({ logs }) {
  const moodCounts = { positive: 0, neutral: 0, negative: 0 };
  logs.forEach(log => {
    if (log.mood && moodCounts[log.mood] !== undefined) moodCounts[log.mood]++;
  });

  const data = [
    { name: '😊 Positive', value: moodCounts.positive, color: '#4ade80' },
    { name: '😐 Neutral', value: moodCounts.neutral, color: '#C9A84C' },
    { name: '😔 Negative', value: moodCounts.negative, color: '#f87171' },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 border border-gold">
      <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--brand-gold)' }}>Mood Overview</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={32}>
          <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,168,76,0.05)' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}