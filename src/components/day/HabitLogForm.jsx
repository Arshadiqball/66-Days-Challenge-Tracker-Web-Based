import React, { useState } from 'react';
import { CheckCircle, Circle, Trophy, ChevronDown } from 'lucide-react';
import { entities } from '@/api/entities';

const MoodButton = ({ mood, label, emoji, selected, onClick }) => (
  <button
    onClick={() => onClick(mood)}
    className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
      selected
        ? 'border-yellow-500 bg-yellow-500/15 scale-105'
        : 'border-white/10 bg-white/5 hover:border-yellow-500/40'
    }`}
    style={{ color: selected ? '#E8C96A' : 'var(--text-secondary)' }}
  >
    <span className="text-xl">{emoji}</span>
    <span>{label}</span>
  </button>
);

export default function HabitLogForm({ dayContent, existingLog, userEmail, onSave }) {
  const isDay1 = dayContent?.day_number === 1;

  const [form, setForm] = useState({
    completed: existingLog?.completed ?? false,
    habit_stacked: existingLog?.habit_stacked ?? (isDay1 ? 'na' : 'no'),
    feeling_before: existingLog?.feeling_before ?? '',
    feeling_after: existingLog?.feeling_after ?? '',
    mood: existingLog?.mood ?? '',
    notes: existingLog?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const trophy = form.completed && form.habit_stacked === 'yes';
    const payload = {
      ...form,
      trophy_earned: trophy,
      user_email: userEmail,
      day_number: dayContent.day_number,
      is_bonus: dayContent.is_bonus ?? false,
      log_date: new Date().toISOString().split('T')[0],
    };
    if (existingLog?.id) {
      await entities.HabitLog.update(existingLog.id, payload);
    } else {
      await entities.HabitLog.create(payload);
    }
    setSaving(false);
    setSaved(true);
    onSave && onSave();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Completion Toggle */}
      <div className="glass-card rounded-2xl p-5 border border-gold">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Day Completion</p>
        <button
          onClick={() => handleChange('completed', !form.completed)}
          className={`flex items-center gap-3 w-full px-5 py-4 rounded-xl border-2 transition-all font-semibold text-sm ${
            form.completed
              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
          }`}
        >
          {form.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
          {form.completed ? '✅ Day Completed!' : 'Mark as Completed'}
          {form.completed && form.habit_stacked === 'yes' && (
            <span className="ml-auto text-lg">🏆</span>
          )}
        </button>
      </div>

      {/* Habit Stacking */}
      <div className="glass-card rounded-2xl p-5 border border-gold">
        <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Habit Stacking</p>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Did I stack this habit with the previous days?</p>
        <div className="flex gap-3">
          {[
            { value: 'yes', label: 'Yes', emoji: '✅' },
            { value: 'no', label: 'No', emoji: '❌' },
            { value: 'na', label: 'N/A', emoji: '—' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => handleChange('habit_stacked', opt.value)}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                form.habit_stacked === opt.value
                  ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
              style={{ color: form.habit_stacked === opt.value ? '#E8C96A' : 'var(--text-secondary)' }}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feeling Before */}
      <div className="glass-card rounded-2xl p-5 border border-gold">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Feeling Before the Habit</p>
        <textarea
          value={form.feeling_before}
          onChange={e => handleChange('feeling_before', e.target.value)}
          placeholder="How are you feeling right now, before starting this habit?"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-yellow-500/50 transition-colors"
          style={{ color: 'var(--text-primary)', caretColor: '#C9A84C' }}
        />
      </div>

      {/* Feeling After + Mood */}
      <div className="glass-card rounded-2xl p-5 border border-gold">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Feeling After the Habit</p>
        <textarea
          value={form.feeling_after}
          onChange={e => handleChange('feeling_after', e.target.value)}
          placeholder="How do you feel now that you've completed it?"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-yellow-500/50 transition-colors mb-4"
          style={{ color: 'var(--text-primary)', caretColor: '#C9A84C' }}
        />
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Select Your Mood</p>
        <div className="flex gap-3">
          <MoodButton mood="positive" label="Positive" emoji="😊" selected={form.mood === 'positive'} onClick={v => handleChange('mood', v)} />
          <MoodButton mood="neutral" label="Neutral" emoji="😐" selected={form.mood === 'neutral'} onClick={v => handleChange('mood', v)} />
          <MoodButton mood="negative" label="Negative" emoji="😔" selected={form.mood === 'negative'} onClick={v => handleChange('mood', v)} />
        </div>
      </div>

      {/* Notes */}
      <div className="glass-card rounded-2xl p-5 border border-gold">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Notes (Optional)</p>
        <textarea
          value={form.notes}
          onChange={e => handleChange('notes', e.target.value)}
          placeholder="Any additional thoughts, reflections, or wins from today..."
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-yellow-500/50 transition-colors"
          style={{ color: 'var(--text-primary)', caretColor: '#C9A84C' }}
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all"
        style={{
          background: saved
            ? 'linear-gradient(135deg, #4ade80, #22c55e)'
            : 'linear-gradient(135deg, #C9A84C, #A8882A)',
          color: saved ? '#fff' : '#1A1A2E',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Today\'s Entry'}
      </button>
    </div>
  );
}