import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Trophy } from 'lucide-react';
import { entities } from '@/api/entities';
import { normalizeMyEntryFieldLabel, shouldShowMyEntryCustomField } from '@/lib/myEntryFieldFilter';

function normalizeForFixedOrder(label) {
  return String(label || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const FIXED_ENTRY_FIELD_ORDER = [
  "Today's Intention",
  'My Mini-Action for Today',
  'My Win of the Day',
  'Self-Reflection',
  'How I Honored',
  'Other Lessons Learned',
  "Instead of Today's Assigned Habit, I Feel More Aligned",
  'Why This Habit is Important to Me',
  "Today's Action Plan to Work on This Habit",
  'Notes',
];

const FIXED_ENTRY_FIELD_ORDER_NORMALIZED = FIXED_ENTRY_FIELD_ORDER.map(label =>
  normalizeForFixedOrder(label)
);

function matchesFixedKey(norm, key) {
  if (!norm || !key) return false;
  if (norm === key) return true;
  if (norm.startsWith(key + ' ')) return true;
  if (norm.endsWith(' ' + key)) return true;
  if (norm.includes(' ' + key + ' ')) return true;
  return false;
}

function getFixedOrderRank(fieldLabel) {
  const norm = normalizeForFixedOrder(fieldLabel);
  if (!norm) return Number.MAX_SAFE_INTEGER;
  let bestIdx = -1;
  let bestLen = -1;
  for (let i = 0; i < FIXED_ENTRY_FIELD_ORDER_NORMALIZED.length; i++) {
    const key = FIXED_ENTRY_FIELD_ORDER_NORMALIZED[i];
    if (!key) continue;
    if (matchesFixedKey(norm, key)) {
      if (key.length > bestLen) {
        bestLen = key.length;
        bestIdx = i;
      }
    }
  }
  return bestIdx === -1 ? Number.MAX_SAFE_INTEGER : bestIdx;
}

function sortInputFields(fields) {
  return [...fields].sort((a, b) => {
    const aRank = getFixedOrderRank(a.field_label);
    const bRank = getFixedOrderRank(b.field_label);
    if (aRank !== bRank) return aRank - bRank;
    const aSort = a.sort_order ?? 0;
    const bSort = b.sort_order ?? 0;
    if (aSort !== bSort) return aSort - bSort;
    return String(a.field_label || '').localeCompare(String(b.field_label || ''));
  });
}

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

function isMyDailyJournalLabel(label) {
  const norm = normalizeForFixedOrder(label);
  return norm === 'my daily journal' || norm.startsWith('my daily journal ');
}

function isTitleOnlyField(field) {
  if (!field) return false;
  if (field.field_type === 'title') return true;
  // Backward compatibility: any custom field whose label starts with "My Daily Journal"
  // is treated as the journal heading (no text input is rendered).
  return isMyDailyJournalLabel(field.field_label);
}

export default function HabitLogForm({ dayContent, existingLog, userEmail, onSave }) {
  const isDay1 = dayContent?.day_number === 1;

  const [form, setForm] = useState({
    completed: existingLog?.completed ?? false,
    habit_stacked: existingLog?.habit_stacked ?? (isDay1 ? 'na' : 'no'),
    feeling_before: existingLog?.feeling_before ?? '',
    feeling_after: existingLog?.feeling_after ?? '',
    mood_before: existingLog?.mood_before ?? '',
    mood: existingLog?.mood ?? '',
    notes: existingLog?.notes ?? '',
  });
  const [customData, setCustomData] = useState(existingLog?.custom_data ?? {});
  const [customFields, setCustomFields] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const titleFields = customFields.filter(isTitleOnlyField);
  const inputFields = sortInputFields(customFields.filter(cf => !isTitleOnlyField(cf)));
  const beforeFeelingCustomFields = inputFields.filter(cf => getFixedOrderRank(cf.field_label) <= 2);
  const afterFeelingCustomFields = inputFields.filter(cf => getFixedOrderRank(cf.field_label) > 2);

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
        mood_before: '',
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
      mood_before: existingLog.mood_before ?? '',
      mood: existingLog.mood ?? '',
      notes: existingLog.notes ?? '',
    });
    setCustomData(existingLog.custom_data ?? {});
  }, [existingLog, isDay1, dayContent?.day_number, dayContent?.is_bonus]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleCustomChange = (fieldId, value) => {
    setCustomData(prev => ({ ...prev, [fieldId]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
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

  const journalSaveWarning = (
    <div
      className="rounded-2xl px-4 py-3 text-sm font-semibold border"
      style={{ background: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.45)', color: '#f87171' }}
    >
      Please be sure and click &quot;Save&quot; at the bottom of the page before leaving.
    </div>
  );
  const hasJournalTitle = titleFields.some(cf => isMyDailyJournalLabel(cf.field_label));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Title-only custom fields shown at top */}
      {titleFields.map(cf => {
        const isJournal = isMyDailyJournalLabel(cf.field_label);
        const headingLabel = isJournal ? 'My Daily Journal' : cf.field_label;
        return (
          <React.Fragment key={cf.id}>
            <div className="glass-card rounded-2xl p-5 border border-gold">
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
                {headingLabel}
              </p>
            </div>
            {isJournal && journalSaveWarning}
          </React.Fragment>
        );
      })}
      {!hasJournalTitle && journalSaveWarning}

      {/* Completion Toggle */}
      <div className="glass-card rounded-2xl p-5 border border-gold">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Day Completion</p>
        <button
          type="button"
          onClick={() => handleChange('completed', !form.completed)}
          className={`flex items-center gap-3 w-full px-5 py-4 rounded-xl border-2 font-semibold text-sm ${
            form.completed
              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
          } transition-all`}
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
              onClick={() => handleChange('habit_stacked', opt.value)}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium ${
                form.habit_stacked === opt.value
                  ? 'border-yellow-500 bg-yellow-500/15 text-yellow-400'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              } transition-all`}
              style={{ color: form.habit_stacked === opt.value ? '#E8C96A' : 'var(--text-secondary)' }}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Fields before feeling questions */}
      {beforeFeelingCustomFields.map(cf => (
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
            readOnly={false}
          />
        </div>
      ))}

      {/* Feeling Before + Mood */}
      <div className="glass-card rounded-2xl p-5 border border-gold">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
          How Did I Feel Before Completing Today&apos;s Challenge
        </p>
        <textarea
          value={form.feeling_before}
          onChange={e => handleChange('feeling_before', e.target.value)}
          placeholder="How did you feel before completing today's challenge?"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-yellow-500/50 transition-colors mb-4"
          style={{ color: 'var(--text-primary)', caretColor: '#C9A84C' }}
        />
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Select Your Mood</p>
        <div className="flex gap-3">
          <MoodButton mood="positive" label="Positive" emoji="😊" selected={form.mood_before === 'positive'} onClick={v => handleChange('mood_before', v)} readOnly={false} />
          <MoodButton mood="neutral" label="Neutral" emoji="😐" selected={form.mood_before === 'neutral'} onClick={v => handleChange('mood_before', v)} readOnly={false} />
          <MoodButton mood="negative" label="Negative" emoji="😔" selected={form.mood_before === 'negative'} onClick={v => handleChange('mood_before', v)} readOnly={false} />
        </div>
      </div>

      {/* Feeling After + Mood */}
      <div className="glass-card rounded-2xl p-5 border border-gold">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
          How Did I Feel After Completing Today&apos;s Challenge
        </p>
        <textarea
          value={form.feeling_after}
          onChange={e => handleChange('feeling_after', e.target.value)}
          placeholder="How did you feel after completing today's challenge?"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-yellow-500/50 transition-colors mb-4"
          style={{ color: 'var(--text-primary)', caretColor: '#C9A84C' }}
        />
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Select Your Mood</p>
        <div className="flex gap-3">
          <MoodButton mood="positive" label="Positive" emoji="😊" selected={form.mood === 'positive'} onClick={v => handleChange('mood', v)} readOnly={false} />
          <MoodButton mood="neutral" label="Neutral" emoji="😐" selected={form.mood === 'neutral'} onClick={v => handleChange('mood', v)} readOnly={false} />
          <MoodButton mood="negative" label="Negative" emoji="😔" selected={form.mood === 'negative'} onClick={v => handleChange('mood', v)} readOnly={false} />
        </div>
      </div>

      {/* Remaining Custom Fields (display_in = my_entry) */}
      {afterFeelingCustomFields.map(cf => (
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
            readOnly={false}
          />
        </div>
      ))}

      {/* Save Button */}
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
    </div>
  );
}
