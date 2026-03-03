import React from 'react';

export default function StatsCard({ icon: Icon, label, value, subtitle, color = 'gold' }) {
  const colorMap = {
    gold: 'from-yellow-900/30 to-yellow-800/10 border-yellow-600/20',
    green: 'from-emerald-900/30 to-emerald-800/10 border-emerald-600/20',
    blue: 'from-blue-900/30 to-blue-800/10 border-blue-600/20',
    purple: 'from-purple-900/30 to-purple-800/10 border-purple-600/20',
  };
  const iconColorMap = {
    gold: 'text-yellow-400',
    green: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
  };

  return (
    <div className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${colorMap[color]} border animate-fade-in-up`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {subtitle && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-black/20 ${iconColorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}