import React from 'react';
import { Trophy, CheckCircle, Circle, Lock } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function DayGrid({ logs, totalDays = 66, onDayClick }) {
  const logMap = {};
  logs.forEach(l => { logMap[l.day_number] = l; });

  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const bonusDays = [67, 68, 69, 70, 71];

  const renderDay = (dayNum, isBonus = false) => {
    const log = logMap[dayNum];
    const completed = log?.completed;
    const trophy = log?.trophy_earned;
    const hasEntry = !!log;

    let bg = 'rgba(30,42,69,0.6)';
    let border = 'rgba(201,168,76,0.1)';
    let textColor = 'var(--text-muted)';

    if (completed && trophy) {
      bg = 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(168,136,42,0.15))';
      border = 'rgba(201,168,76,0.5)';
      textColor = '#E8C96A';
    } else if (completed) {
      bg = 'rgba(74,222,128,0.1)';
      border = 'rgba(74,222,128,0.3)';
      textColor = '#4ade80';
    } else if (hasEntry) {
      bg = 'rgba(248,113,113,0.08)';
      border = 'rgba(248,113,113,0.2)';
      textColor = '#f87171';
    }

    return (
      <button
        key={dayNum}
        onClick={() => onDayClick(dayNum, isBonus)}
        className="day-card relative rounded-xl p-2 flex flex-col items-center justify-center aspect-square cursor-pointer border"
        style={{ background: bg, borderColor: border, minHeight: 56 }}
      >
        {trophy && (
          <span className="absolute -top-1.5 -right-1.5 text-sm">🏆</span>
        )}
        <span className="text-xs font-semibold" style={{ color: textColor }}>
          {isBonus ? `B${dayNum - 66}` : dayNum}
        </span>
        {completed ? (
          <CheckCircle size={12} className="mt-0.5" style={{ color: textColor }} />
        ) : hasEntry ? (
          <Circle size={12} className="mt-0.5" style={{ color: textColor }} />
        ) : null}
      </button>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-gold">
      <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--brand-gold)' }}>
        66-Day Journey
      </h3>
      <div className="grid grid-cols-11 gap-1.5">
        {days.map(d => renderDay(d))}
      </div>
      <div className="mt-4 pt-4 border-t border-gold">
        <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Bonus Days</p>
        <div className="flex gap-1.5">
          {bonusDays.map(d => renderDay(d, true))}
        </div>
      </div>
      <div className="mt-4 flex gap-4 flex-wrap">
        {[
          { color: '#4ade80', label: 'Completed' },
          { color: '#E8C96A', label: 'Trophy Earned' },
          { color: '#f87171', label: 'Logged / Missed' },
          { color: 'rgba(201,168,76,0.15)', label: 'Not started' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}