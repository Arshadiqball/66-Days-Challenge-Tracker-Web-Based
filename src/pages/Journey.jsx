import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, Trophy, Layers, ChevronRight, Search } from 'lucide-react';

export default function Journey() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [contents, setContents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const init = async () => {
        const [l, c] = await Promise.all([
          entities.HabitLog.filter({ user_email: user.email }),
          entities.DayContent.list('day_number', 100),
        ]);
      setLogs(l);
      setContents(c);
    };
    init();
  }, [user]);

  const logMap = {};
  logs.forEach(l => { logMap[l.day_number] = l; });
  const contentMap = {};
  contents.forEach(c => { contentMap[c.day_number] = c; });

  const allDays = Array.from({ length: 66 }, (_, i) => i + 1);
  const bonusDays = [67, 68, 69, 70, 71];
  const allEntries = [...allDays.map(d => ({ day: d, isBonus: false })), ...bonusDays.map(d => ({ day: d, isBonus: true }))];

  const filtered = allEntries.filter(({ day, isBonus }) => {
    const log = logMap[day];
    const content = contentMap[day];
    if (filter === 'completed' && !log?.completed) return false;
    if (filter === 'pending' && log?.completed) return false;
    if (filter === 'trophy' && !log?.trophy_earned) return false;
    if (search) {
      const title = content?.habit_title || '';
      if (!title.toLowerCase().includes(search.toLowerCase()) && !String(day).includes(search)) return false;
    }
    return true;
  });

  const handleDayClick = (day, isBonus) => {
    navigate(createPageUrl(`DayDetail?day=${day}&bonus=${isBonus ? '1' : '0'}`));
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-playfair" style={{ color: 'var(--text-primary)' }}>
          Your 66-Day Journey
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Click any day to log or review your entry
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search habits..."
            className="w-full pl-8 pr-4 py-2 rounded-xl text-sm border outline-none"
            style={{ background: 'rgba(30,42,69,0.6)', borderColor: 'rgba(201,168,76,0.15)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'completed', label: '✅ Done' },
            { key: 'pending', label: '⏳ Pending' },
            { key: 'trophy', label: '🏆 Trophy' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-3 py-2 rounded-xl text-xs font-medium border transition-all"
              style={{
                background: filter === f.key ? 'rgba(201,168,76,0.2)' : 'rgba(30,42,69,0.6)',
                borderColor: filter === f.key ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.15)',
                color: filter === f.key ? '#E8C96A' : 'var(--text-secondary)',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Days list */}
      <div className="space-y-2">
        {filtered.map(({ day, isBonus }) => {
          const log = logMap[day];
          const content = contentMap[day];
          const completed = log?.completed;
          const trophy = log?.trophy_earned;

          return (
            <button key={`${day}-${isBonus}`}
              onClick={() => handleDayClick(day, isBonus)}
              className="day-card w-full glass-card rounded-2xl p-4 border flex items-center gap-4 text-left"
              style={{ borderColor: completed ? (trophy ? 'rgba(201,168,76,0.4)' : 'rgba(74,222,128,0.3)') : 'rgba(201,168,76,0.1)' }}>
              {/* Day badge */}
              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-sm"
                style={{
                  background: completed ? (trophy ? 'linear-gradient(135deg, rgba(201,168,76,0.3), rgba(168,136,42,0.2))' : 'rgba(74,222,128,0.15)') : 'rgba(255,255,255,0.05)',
                  color: completed ? (trophy ? '#E8C96A' : '#4ade80') : 'var(--text-muted)',
                }}>
                {isBonus ? `B${day - 66}` : day}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {content?.habit_title || (isBonus ? `Bonus Day ${day - 66}` : `Day ${day}`)}
                  {content?.habit_emoji ? ` ${content.habit_emoji}` : ''}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {completed ? (
                    <span className="text-xs flex items-center gap-1" style={{ color: '#4ade80' }}>
                      <CheckCircle size={10} /> Completed
                    </span>
                  ) : log ? (
                    <span className="text-xs" style={{ color: '#f87171' }}>Logged – not completed</span>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Not started</span>
                  )}
                  {trophy && <span className="text-xs">🏆 Trophy</span>}
                  {log?.habit_stacked === 'yes' && (
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--brand-gold)' }}>
                      <Layers size={10} /> Stacked
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}