import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronUp } from 'lucide-react';

const emptyContent = {
  day_number: '',
  is_bonus: false,
  habit_title: '',
  habit_emoji: '',
  quote_of_day: '',
  quote_author: '',
  why_this_habit: '',
  action_plan: '',
  affirmation: '',
  category: 'Morning',
};

const emptyField = { field_label: '', field_type: 'textarea', field_options: '', is_active: true, sort_order: 0 };

export default function Admin() {
  const { user } = useAuth();
  const [days, setDays] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [activeTab, setActiveTab] = useState('days');
  const [editingDay, setEditingDay] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const init = async () => {
      const [d, f] = await Promise.all([
        entities.DayContent.list('day_number', 100),
        entities.CustomField.list('sort_order', 50),
      ]);
      setDays(d);
      setCustomFields(f);
    };
    init();
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass-card rounded-2xl p-8 border border-gold text-center max-w-sm">
          <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Admin Access Only</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const saveDay = async () => {
    setSaving(true);
    if (editingDay.id) {
      const updated = await entities.DayContent.update(editingDay.id, editingDay);
      setDays(prev => prev.map(d => d.id === updated.id ? updated : d));
    } else {
      const created = await entities.DayContent.create(editingDay);
      setDays(prev => [...prev, created].sort((a, b) => a.day_number - b.day_number));
    }
    setEditingDay(null);
    setSaving(false);
  };

  const deleteDay = async (id) => {
    await entities.DayContent.delete(id);
    setDays(prev => prev.filter(d => d.id !== id));
  };

  const saveField = async () => {
    setSaving(true);
    if (editingField.id) {
      const updated = await entities.CustomField.update(editingField.id, editingField);
      setCustomFields(prev => prev.map(f => f.id === updated.id ? updated : f));
    } else {
      const created = await entities.CustomField.create(editingField);
      setCustomFields(prev => [...prev, created]);
    }
    setEditingField(null);
    setSaving(false);
  };

  const deleteField = async (id) => {
    await entities.CustomField.delete(id);
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const toggleFieldActive = async (field) => {
    const updated = await entities.CustomField.update(field.id, { is_active: !field.is_active });
    setCustomFields(prev => prev.map(f => f.id === updated.id ? updated : f));
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-playfair" style={{ color: 'var(--text-primary)' }}>
          Content Management
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage daily habit content and custom entry fields
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ background: 'rgba(30,42,69,0.6)', border: '1px solid rgba(201,168,76,0.1)' }}>
        {[
          { key: 'days', label: 'Daily Content' },
          { key: 'fields', label: 'Custom Fields' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === t.key ? 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(168,136,42,0.15))' : 'transparent',
              color: activeTab === t.key ? '#E8C96A' : 'var(--text-muted)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* DAYS TAB */}
      {activeTab === 'days' && (
        <div className="space-y-4">
          <button onClick={() => setEditingDay({ ...emptyContent })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8882A)', color: '#1A1A2E' }}>
            <Plus size={16} /> Add Day Content
          </button>

          {/* Edit Form */}
          {editingDay && (
            <div className="glass-card rounded-2xl p-6 border-gold border animate-fade-in-up">
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {editingDay.id ? 'Edit' : 'New'} Day Content
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'day_number', label: 'Day Number', type: 'number' },
                  { key: 'habit_title', label: 'Habit Title', type: 'text' },
                  { key: 'habit_emoji', label: 'Emoji', type: 'text' },
                  { key: 'quote_author', label: 'Quote Author', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                    <input type={f.type} value={editingDay[f.key] || ''}
                      onChange={e => setEditingDay(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Category</label>
                  <select value={editingDay.category || 'Morning'}
                    onChange={e => setEditingDay(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ background: 'rgba(22,33,62,0.9)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}>
                    {['Morning', 'Movement', 'Nutrition', 'Mindset', 'Evening', 'Social', 'Learning', 'Bonus'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input type="checkbox" checked={editingDay.is_bonus || false}
                    onChange={e => setEditingDay(prev => ({ ...prev, is_bonus: e.target.checked }))}
                    className="w-4 h-4" />
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Bonus Day</label>
                </div>
              </div>
              {[
                { key: 'quote_of_day', label: 'Quote of the Day' },
                { key: 'why_this_habit', label: 'Why This Habit Matters' },
                { key: 'action_plan', label: "Today's Action Plan" },
                { key: 'affirmation', label: "Today's Affirmation" },
              ].map(f => (
                <div key={f.key} className="mt-4">
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                  <textarea value={editingDay[f.key] || ''}
                    onChange={e => setEditingDay(prev => ({ ...prev, [f.key]: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                  />
                </div>
              ))}
              <div className="flex gap-3 mt-5">
                <button onClick={saveDay} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #A8882A)', color: '#1A1A2E' }}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditingDay(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Days list */}
          <div className="space-y-2">
            {days.map(day => (
              <div key={day.id} className="glass-card rounded-xl border border-gold">
                <button className="w-full flex items-center gap-4 px-4 py-3 text-left"
                  onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ background: 'rgba(201,168,76,0.15)', color: '#E8C96A' }}>
                    {day.is_bonus ? `B${day.day_number - 66}` : day.day_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {day.habit_title} {day.habit_emoji}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{day.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={e => { e.stopPropagation(); setEditingDay({ ...day }); }}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      style={{ color: 'var(--brand-gold)' }}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteDay(day.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      style={{ color: '#f87171' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {expandedDay === day.id ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                </button>
                {expandedDay === day.id && (
                  <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: 'rgba(201,168,76,0.1)' }}>
                    {day.quote_of_day && <p className="text-xs italic mt-3" style={{ color: 'var(--text-secondary)' }}>"{day.quote_of_day}"</p>}
                    {day.why_this_habit && <p className="text-xs" style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-secondary)' }}>Why:</strong> {day.why_this_habit}</p>}
                    {day.action_plan && <p className="text-xs" style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-secondary)' }}>Action:</strong> {day.action_plan}</p>}
                  </div>
                )}
              </div>
            ))}
            {days.length === 0 && (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <p className="text-sm">No day content added yet.</p>
                <p className="text-xs mt-1">Click "Add Day Content" to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUSTOM FIELDS TAB */}
      {activeTab === 'fields' && (
        <div className="space-y-4">
          <button onClick={() => setEditingField({ ...emptyField })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8882A)', color: '#1A1A2E' }}>
            <Plus size={16} /> Add Custom Field
          </button>

          {editingField && (
            <div className="glass-card rounded-2xl p-6 border-gold border animate-fade-in-up">
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {editingField.id ? 'Edit' : 'New'} Custom Field
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Field Label</label>
                  <input value={editingField.field_label}
                    onChange={e => setEditingField(p => ({ ...p, field_label: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Field Type</label>
                  <select value={editingField.field_type}
                    onChange={e => setEditingField(p => ({ ...p, field_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ background: 'rgba(22,33,62,0.9)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}>
                    <option value="text">Short Text</option>
                    <option value="textarea">Long Text</option>
                    <option value="select">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                </div>
                {editingField.field_type === 'select' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Options (comma-separated)</label>
                    <input value={editingField.field_options || ''}
                      onChange={e => setEditingField(p => ({ ...p, field_options: e.target.value }))}
                      placeholder="Option 1, Option 2, Option 3"
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Sort Order</label>
                  <input type="number" value={editingField.sort_order || 0}
                    onChange={e => setEditingField(p => ({ ...p, sort_order: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={saveField} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #A8882A)', color: '#1A1A2E' }}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditingField(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {customFields.map(field => (
              <div key={field.id} className="glass-card rounded-xl border border-gold px-4 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: field.is_active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {field.field_label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {field.field_type} {field.field_options ? `· ${field.field_options}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleFieldActive(field)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${field.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                    {field.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => setEditingField({ ...field })}
                    className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: 'var(--brand-gold)' }}>
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => deleteField(field.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: '#f87171' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {customFields.length === 0 && (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <p className="text-sm">No custom fields yet.</p>
                <p className="text-xs mt-1">Add fields to customize the daily entry form.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}