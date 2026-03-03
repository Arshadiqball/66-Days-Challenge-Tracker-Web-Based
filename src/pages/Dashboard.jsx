import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { Trophy, CheckCircle, Layers, Flame, TrendingUp } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import CircularProgress from '../components/dashboard/CircularProgress';
import MoodChart from '../components/dashboard/MoodChart';
import DayGrid from '../components/dashboard/DayGrid';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const init = async () => {
      const allLogs = await entities.HabitLog.filter({ user_email: user.email });
      setLogs(allLogs);

      const seen = localStorage.getItem(`onboarding_seen_${user.id}`);
      if (!seen) {
        setShowOnboarding(true);
        localStorage.setItem(`onboarding_seen_${user.id}`, '1');
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const totalDays = 66;
  const completed = logs.filter(l => l.completed && !l.is_bonus).length;
  const trophies = logs.filter(l => l.trophy_earned).length;
  const stacked = logs.filter(l => l.habit_stacked === 'yes').length;
  const completionPct = Math.round((completed / totalDays) * 100);
  const stackPct = completed > 0 ? Math.round((stacked / completed) * 100) : 0;

  // Streak calculation
  const logMap = {};
  logs.forEach(l => { logMap[l.day_number] = l; });
  let streak = 0;
  for (let i = totalDays; i >= 1; i--) {
    if (logMap[i]?.completed) streak++;
    else if (logMap[i]) break;
    else if (i < totalDays) break;
  }
  // Forward streak
  streak = 0;
  let streakBroken = false;
  for (let i = 1; i <= totalDays; i++) {
    if (logMap[i]?.completed) {
      if (!streakBroken) streak++;
    } else if (logMap[i]) {
      streakBroken = true;
    } else {
      break;
    }
  }

  const handleDayClick = (dayNum, isBonus) => {
    navigate(createPageUrl(`DayDetail?day=${dayNum}&bonus=${isBonus ? '1' : '0'}`));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading your journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-playfair" style={{ color: 'var(--text-primary)' }}>
            {user?.full_name ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Your Dashboard'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Track your 66-day habit journey
          </p>
        </div>
        <button
          onClick={() => setShowOnboarding(true)}
          className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-white/5"
          style={{ borderColor: 'rgba(201,168,76,0.3)', color: 'var(--brand-gold)' }}>
          How it works
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard icon={CheckCircle} label="Days Completed" value={`${completed}/66`} subtitle={`${completionPct}% done`} color="green" />
        <StatsCard icon={Trophy} label="Trophies Earned" value={trophies} subtitle="Complete + Stack" color="gold" />
        <StatsCard icon={Layers} label="Habits Stacked" value={stacked} subtitle={`${stackPct}% stack rate`} color="purple" />
        <StatsCard icon={Flame} label="Current Streak" value={`${streak} days`} subtitle="Keep it going!" color="blue" />
      </div>

      {/* Circular progress row */}
      <div className="glass-card rounded-2xl p-6 border border-gold">
        <h3 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--brand-gold)' }}>
          Progress Overview
        </h3>
        <div className="flex flex-wrap justify-around gap-6">
          <CircularProgress percentage={completionPct} label="Completion Rate" color="#4ade80" />
          <CircularProgress percentage={stackPct} label="Stack Rate" color="#C9A84C" />
          <CircularProgress
            percentage={Math.round((trophies / Math.max(completed, 1)) * 100)}
            label="Trophy Rate"
            color="#818cf8"
          />
        </div>
      </div>

      {/* Grid + Mood */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DayGrid logs={logs} onDayClick={handleDayClick} />
        </div>
        <div>
          <MoodChart logs={logs} />
          {/* Trophy summary */}
          <div className="glass-card rounded-2xl p-5 border border-gold mt-4"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.08), transparent)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🏆</span>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#E8C96A' }}>{trophies}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Trophies</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Earned by completing a day AND stacking the habit. Keep the chain going!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}