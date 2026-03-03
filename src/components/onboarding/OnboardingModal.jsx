import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Trophy, BarChart2, BookOpen, Layers } from 'lucide-react';

const steps = [
  {
    icon: BookOpen,
    title: 'Welcome to Your 66 Days Challenge',
    subtitle: 'Your digital habit-tracking journal',
    body: 'Over the next 66 days, you\'ll build powerful habits that transform your life. Each day has a dedicated habit to practice, reflect on, and track. Science shows it takes 66 days to form a lasting habit — so let\'s get started!',
    color: '#C9A84C',
  },
  {
    icon: Layers,
    title: 'Habit Stacking',
    subtitle: 'Build momentum by stacking',
    body: 'Habit stacking means connecting each new habit to the ones you\'ve already built. From Day 2 onwards, you\'ll be asked: "Did I stack this habit with the previous days?" Stacking habits accelerates your progress and earns you trophies!',
    color: '#818cf8',
  },
  {
    icon: BarChart2,
    title: 'Mood & Reflection Tracking',
    subtitle: 'Understand your inner journey',
    body: 'Each day you\'ll record how you feel before and after your habit. This helps you understand the emotional impact of your habits and track your overall wellbeing over time. Select Positive, Neutral, or Negative to log your mood.',
    color: '#4ade80',
  },
  {
    icon: Trophy,
    title: 'Trophies & Progress',
    subtitle: 'Celebrate your wins',
    body: 'Earn a 🏆 trophy each time you complete a day AND stack your habit. Your dashboard tracks your total trophies, streak, completion rate, and a full visual of all 66 days so you can see your journey at a glance.',
    color: '#C9A84C',
  },
];

export default function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-card rounded-3xl border border-gold w-full max-w-md p-8 relative animate-fade-in-up"
        style={{ background: 'rgba(22,33,62,0.97)' }}>
        <button onClick={onClose} className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <X size={16} style={{ color: 'var(--text-muted)' }} />
        </button>

        {/* Progress dots */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className="h-1 rounded-full transition-all"
              style={{
                width: i === step ? 32 : 8,
                background: i === step ? current.color : 'rgba(255,255,255,0.1)',
              }} />
          ))}
        </div>

        <div className="flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: `${current.color}20`, border: `1px solid ${current.color}40` }}>
            <Icon size={28} style={{ color: current.color }} />
          </div>

          <div>
            <h2 className="text-xl font-bold font-playfair" style={{ color: 'var(--text-primary)' }}>{current.title}</h2>
            <p className="text-sm mt-1" style={{ color: current.color }}>{current.subtitle}</p>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{current.body}</p>
        </div>

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-xl border text-sm font-medium transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
              <ChevronLeft size={16} className="inline mr-1" /> Back
            </button>
          )}
          <button
            onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : onClose()}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: `linear-gradient(135deg, ${current.color}, ${current.color}99)`, color: '#1A1A2E' }}>
            {step < steps.length - 1 ? <>Next <ChevronRight size={16} className="inline ml-1" /></> : "Let's Begin! 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}