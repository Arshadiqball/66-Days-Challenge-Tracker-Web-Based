import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Trophy } from 'lucide-react';
import { entities } from '@/api/entities';
import { normalizeMyEntryFieldLabel, shouldShowMyEntryCustomField } from '@/lib/myEntryFieldFilter';

const MoodButton = ({ mood, label, emoji, selected, onClick, readOnly }) => {
  const cls = `flex flex-col items-center gap-1 px-4 py-3 rounded-xl border text-sm font-medium ${
    selected
      ? 'border-yellow-500 bg-yellow-500/15 scale-105'
      : 'border-white/10 bg-white/5'
  } ${readOnly ? 'cursor-default opacity-90' : 'transition-all hover:border-yellow-500/40'}`;
  if (readOnly) {
    return (
      <div className={cls} style={{ color: selected ? '#E8C96A' : 'var(--text-muted)' }}>
        <span className="text-xl">{emoji}</span>
        <span>{label}</span>
      </div>
    );
  }
  return (
    <button type="button" onClick={() => onClick(mood)} className={cls}
      style={{ color: selected ? '#E8C96A' : 'var(--text-secondary)' }}>
      <span className="text-xl">{emoji}</span>
      <span>{label}</span>
    </button>
  );
};

function CustomFieldInput({ field, value, onChange, readOnly }) {
  const baseClasses = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-500/50 transition-colors';
  const baseStyle = { color: 'var(--text-primary)', caretColor: '#C9A84C' };

  if (field.field_type === 'checkbox') {
    return (
      <label className={`flex items-center gap-3 ${readOnly ? 'cursor-default opacity-90' : 'cursor-pointer'}`}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange(e.target.checked)}
          disabled={readOnly}
          className="w-5 h-5 rounded accent-yellow-500"
        />
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {field.field_label}
        </span>
      </label>
    );
  }

  if (field.field_type === 'select') {
    const options = (field.field_options || '').split(',').map(o => o.trim()).filter(Boolean);
    return (
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={readOnly}
        className={`${baseClasses} appearance-none`}
        style={{ ...baseStyle, backgroundImage: 'none', opacity: readOnly ? 0.85 : 1 }}
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (field.field_type === 'text') {
    return (
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={`Enter ${field.field_label.toLowerCase()}...`}
        className={baseClasses}
        style={{ ...baseStyle, opacity: readOnly ? 0.9 : 1 }}
      />
    );
  }

  // Default: textarea
  return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      readOnly={readOnly}
      placeholder={`Enter ${field.field_label.toLowerCase()}...`}
      rows={3}
      className={`${baseClasses} resize-none`}
      style={{ ...baseStyle, opacity: readOnly ? 0.9 : 1 }}
    />
  );
}

function isTitleOnlyField(field) {
  if (!field) return false;
  if (field.field_type === 'title') return true;
  // Backward compatibility: existing "My Daily Journal" custom fields should display as heading-only.
  return normalizeMyEntryFieldLabel(field.field_label) === 'my daily journal';
}

export default function HabitLogForm({ dayContent, existingLog, userEmail, onSave }) {
  const isDay1 = dayContent?.day_number === 1;
  const locked = Boolean(existingLog?.id);

  const [form, setForm] = useState({
    completed: existingLog?.completed ?? false,
    habit_stacked: existingLog?.habit_stacked ?? (isDay1 ? 'na' : 'no'),
    feeling_before: existingLog?.feeling_before ?? '',
    feeling_after: existingLog?.feeling_after ?? '',
    mood: existingLog?.mood ?? '',
    notes: existingLog?.notes ?? '',
  });
  const [customData, setCustomData] = useState(existingLog?.custom_data ?? {});
  const [customFields, setCustomFields] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const titleFields = customFields.filter(isTitleOnlyField);
  const inputFields = customFields.filter(cf => !isTitleOnlyField(cf));

  useEffect(() => {
    entities.CustomField.filter({ is_active: true, display_in: 'my_entry' })
      .then(fields => {
        const sorted = [...fields]
          .filter(shouldShowMyEntryCustomField)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setCustomFields(sorted);
      })
      .catch(() => setCustomFields([]));
  }, []);

  useEffect(() => {
    if (!existingLog) {
      setForm({
        completed: false,
        habit_stacked: isDay1 ? 'na' : 'no',
        feeling_before: '',
        feeling_after: '',
        mood: '',
        notes: '',
      });
      setCustomData({});
      return;
    }
    setForm({
      completed: existingLog.completed ?? false,
      habit_stacked: existingLog.habit_stacked ?? (isDay1 ? 'na' : 'no'),
      feeling_before: existingLog.feeling_before ?? '',
      feeling_after: existingLog.feeling_after ?? '',
      mood: existingLog.mood ?? '',
      notes: existingLog.notes ?? '',
    });
    setCustomData(existingLog.custom_data ?? {});
  }, [existingLog, isDay1, dayContent?.day_number, dayContent?.is_bonus]);

  const handleChange = (field, value) => {
    if (locked) return;
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleCustomChange = (fieldId, value) => {
    if (locked) return;
    setCustomData(prev => ({ ...prev, [fieldId]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (locked) return;
    setSaving(true);
    const trophy = form.completed && form.habit_stacked === 'yes';
    const allowedIds = new Set(inputFields.map(cf => cf.id));
    const custom_data = {};
    for (const id of allowedIds) {
      if (Object.prototype.hasOwnProperty.call(customData, id)) {
        custom_data[id] = customData[id];
      }
    }
    const payload = {
      ...form,
      custom_data,
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
      {locked && (
        <div className="rounded-2xl px-4 py-3 text-sm border"
          style={{ background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.25)', color: 'var(--text-secondary)' }}>
          This day&apos;s entry is <strong style={{ color: '#E8C96A' }}>submitted and locked</strong>. It cannot be edited.
        </div>
      )}

      {/* Title-only custom fields shown at top */}
      {titleFields.map(cf => (
        <div key={cf.id} className="glass-card rounded-2xl p-5 border border-gold">
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
            {cf.field_label}
          </p>
        </div>
      ))}

      {/* Completion Toggle */}
      <div className="glass-card rounded-2xl p-5 border border-gold">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Day Completion</p>
        <button
          type="button"
          disabled={locked}
          onClick={() => handleChange('completed', !form.completed)}
          className={`flex items-center gap-3 w-full px-5 py-4 rounded-xl border-2 font-semibold text-sm ${
            form.completed
              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
          } ${locked ? 'cursor-default opacity-90' : 'transition-all'}`}
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
              type="button"
              key={opt.value}
              disabled={locked}
              onClick={() => handleChange('habit_stacked', opt.value)}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium ${
                form.habit_stacked === opt.value
                  ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              } ${locked ? 'cursor-default opacity-90' : 'transition-all'}`}
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
          readOnly={locked}
          placeholder="How are you feeling right now, before starting this habit?"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-yellow-500/50 transition-colors"
          style={{ color: 'var(--text-primary)', caretColor: '#C9A84C', opacity: locked ? 0.9 : 1 }}
        />
      </div>

      {/* Feeling After + Mood */}
      <div className="glass-card rounded-2xl p-5 border border-gold">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Feeling After the Habit</p>
        <textarea
          value={form.feeling_after}
          onChange={e => handleChange('feeling_after', e.target.value)}
          readOnly={locked}
          placeholder="How do you feel now that you've completed it?"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-yellow-500/50 transition-colors mb-4"
          style={{ color: 'var(--text-primary)', caretColor: '#C9A84C', opacity: locked ? 0.9 : 1 }}
        />
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Select Your Mood</p>
        <div className="flex gap-3">
          <MoodButton mood="positive" label="Positive" emoji="😊" selected={form.mood === 'positive'} onClick={v => handleChange('mood', v)} readOnly={locked} />
          <MoodButton mood="neutral" label="Neutral" emoji="😐" selected={form.mood === 'neutral'} onClick={v => handleChange('mood', v)} readOnly={locked} />
          <MoodButton mood="negative" label="Negative" emoji="😔" selected={form.mood === 'negative'} onClick={v => handleChange('mood', v)} readOnly={locked} />
        </div>
      </div>

      {/* Custom Fields (display_in = my_entry) */}
      {inputFields.map(cf => (
        <div key={cf.id} className="glass-card rounded-2xl p-5 border border-gold">
          {cf.field_type !== 'checkbox' && (
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
              {cf.field_label}
            </p>
          )}
          <CustomFieldInput
            field={cf}
            value={customData[cf.id]}
            onChange={val => handleCustomChange(cf.id, val)}
            readOnly={locked}
          />
        </div>
      ))}

      {/* Notes */}
      <div className="glass-card rounded-2xl p-5 border border-gold">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Notes (Optional)</p>
        <textarea
          value={form.notes}
          onChange={e => handleChange('notes', e.target.value)}
          readOnly={locked}
          placeholder="Any additional thoughts, reflections, or wins from today..."
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-yellow-500/50 transition-colors"
          style={{ color: 'var(--text-primary)', caretColor: '#C9A84C', opacity: locked ? 0.9 : 1 }}
        />
      </div>

      {/* Save Button */}
      {!locked && (
        <button
          type="button"
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
      )}
    </div>
  );
}
