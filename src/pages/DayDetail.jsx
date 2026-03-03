import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { ArrowLeft, Trophy, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import DayContentCard from '../components/day/DayContentCard';
import HabitLogForm from '../components/day/HabitLogForm';

export default function DayDetail() {
  const { user } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const dayNum  = parseInt(urlParams.get('day') || '1');
  const isBonus = urlParams.get('bonus') === '1';

  const [dayContent,   setDayContent]   = useState(null);
  const [existingLog,  setExistingLog]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState('content');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const [contents, logs] = await Promise.all([
      entities.DayContent.filter({ day_number: dayNum }),
      user
        ? entities.HabitLog.filter({ user_email: user.email, day_number: dayNum })
        : Promise.resolve([]),
    ]);

    setDayContent(contents[0] || {
      day_number: dayNum,
      is_bonus: isBonus,
      habit_title: isBonus ? `Bonus Day ${dayNum - 66}` : `Day ${dayNum}`,
    });
    setExistingLog(logs[0] || null);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [dayNum, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const completed = existingLog?.completed;
  const trophy = existingLog?.trophy_earned;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(createPageUrl('Journey'))}
        className="flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition-opacity"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> Back to Journey
      </button>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 border border-gold mb-6 animate-fade-in-up"
        style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(30,42,69,0.9))' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>
                {isBonus ? `Bonus Day ${dayNum - 66}` : `Day ${dayNum}`}
              </span>
              {dayContent?.category && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  {dayContent.category}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold font-playfair" style={{ color: 'var(--text-primary)' }}>
              {dayContent?.habit_title} {dayContent?.habit_emoji}
            </h1>
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            {trophy ? (
              <span className="text-3xl">🏆</span>
            ) : completed ? (
              <Star size={28} style={{ color: '#4ade80' }} />
            ) : null}
          </div>
        </div>

        {/* Status bar */}
        {existingLog && (
          <div className="flex gap-3 mt-4 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${completed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {completed ? '✅ Completed' : '❌ Not Completed'}
            </span>
            {existingLog.mood && (
              <span className="text-xs px-2.5 py-1 rounded-lg font-medium bg-white/5"
                style={{ color: 'var(--text-secondary)' }}>
                {existingLog.mood === 'positive' ? '😊' : existingLog.mood === 'neutral' ? '😐' : '😔'} {existingLog.mood}
              </span>
            )}
            {existingLog.habit_stacked === 'yes' && (
              <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
                style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                🔗 Stacked
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6"
        style={{ background: 'rgba(30,42,69,0.6)', border: '1px solid rgba(201,168,76,0.1)' }}>
        {[
          { key: 'content', label: "Today's Habit" },
          { key: 'log', label: 'My Entry' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(168,136,42,0.15))' : 'transparent',
              color: tab === t.key ? '#E8C96A' : 'var(--text-muted)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'content' ? (
        <DayContentCard dayContent={dayContent} />
      ) : (
        <HabitLogForm
          dayContent={dayContent}
          existingLog={existingLog}
          userEmail={user?.email}
          onSave={load}
        />
      )}
    </div>
  );
}