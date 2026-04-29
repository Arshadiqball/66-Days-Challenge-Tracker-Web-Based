import React, { useState, useEffect, useRef } from 'react';
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
  short_challenge: '',
  deep_dive: '',
  self_reflection: '',
  affirmation: '',
  category: 'Morning',
};

const emptyField = {
  field_label: '',
  field_type: 'textarea',
  display_in: 'my_entry',
  field_options: '',
  description: '',
  is_active: true,
  sort_order: 0,
};
const emptyUserForm = { full_name: '', email: '' };

export default function Admin() {
  const { user, createUserByAdmin } = useAuth();
  const [days, setDays] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('days');
  const [editingDay, setEditingDay] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [fieldSaving, setFieldSaving] = useState(false);
  const fieldEditorRef = useRef(null);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const allUsers = await entities.User.list('created_at', 200);
      setUsers(allUsers);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const init = async () => {
      const [d, f, allUsers] = await Promise.all([
        entities.DayContent.list('day_number', 100),
        entities.CustomField.list('sort_order', 50),
        entities.User.list('created_at', 200),
      ]);
      setDays(d);
      setCustomFields(f);
      setUsers(allUsers);
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
    try {
      if (editingDay.id) {
        const updated = await entities.DayContent.update(editingDay.id, editingDay);
        setDays(prev => prev.map(d => d.id === updated.id ? updated : d));
      } else {
        const created = await entities.DayContent.create(editingDay);
        setDays(prev => [...prev, created].sort((a, b) => a.day_number - b.day_number));
      }
      setEditingDay(null);
    } finally {
      setSaving(false);
    }
  };

  const deleteDay = async (id) => {
    await entities.DayContent.delete(id);
    setDays(prev => prev.filter(d => d.id !== id));
  };

  const buildCustomFieldPayload = (ed) => {
    const display_in = ed.display_in === 'today_habit' ? 'today_habit' : 'my_entry';
    const base = {
      field_label: String(ed.field_label ?? '').trim(),
      display_in,
      is_active: ed.is_active !== false,
      sort_order: Math.max(0, Math.min(99999, Number(ed.sort_order) || 0)),
    };
    if (display_in === 'today_habit') {
      return {
        ...base,
        field_type: 'textarea',
        field_options: '',
        description: String(ed.description ?? '').trim(),
      };
    }
    const ft = ['text', 'textarea', 'select', 'checkbox', 'title'].includes(ed.field_type) ? ed.field_type : 'textarea';
    return {
      ...base,
      field_type: ft,
      field_options: ft === 'select' ? String(ed.field_options ?? '') : '',
      description: '',
    };
  };

  const saveField = async () => {
    setFieldSaving(true);
    setFieldError('');

    const payload = buildCustomFieldPayload(editingField);
    if (!payload.field_label) {
      setFieldError('Label is required.');
      setFieldSaving(false);
      return;
    }

    try {
      if (editingField.id) {
        const updated = await entities.CustomField.update(editingField.id, payload);
        setCustomFields(prev => prev.map(f => f.id === updated.id ? updated : f));
      } else {
        const created = await entities.CustomField.create(payload);
        setCustomFields(prev => [...prev, created]);
      }
      setEditingField(null);
    } catch (err) {
      const message = err?.message || 'Could not save custom field.';
      if (message.toLowerCase().includes('description')) {
        setFieldError('Could not save: database schema is outdated. Restart backend once and try again.');
      } else {
        setFieldError(message);
      }
    } finally {
      setFieldSaving(false);
    }
  };

  useEffect(() => {
    if (editingField && activeTab === 'fields') {
      fieldEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingField, activeTab]);

  const deleteField = async (id) => {
    await entities.CustomField.delete(id);
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const toggleFieldActive = async (field) => {
    const updated = await entities.CustomField.update(field.id, { is_active: !field.is_active });
    setCustomFields(prev => prev.map(f => f.id === updated.id ? updated : f));
  };

  const setUserField = (key, value) => {
    setUserForm(prev => ({ ...prev, [key]: value }));
    setUserError('');
    setUserSuccess('');
  };

  const createUser = async (e) => {
    e.preventDefault();
    if (!userForm.full_name || !userForm.email) {
      setUserError('Please fill in full name and email.');
      return;
    }

    setCreatingUser(true);
    try {
      const result = await createUserByAdmin({
        full_name: userForm.full_name.trim(),
        email: userForm.email.trim(),
      });
      const emailNote = result.welcome_email_sent
        ? ' Welcome email sent with sign-in details.'
        : ` No email sent — ${result.welcome_email_error || 'configure SMTP on the server.'}`;
      setUserSuccess(`User created.${emailNote}`);
      setUserForm(emptyUserForm);
      await loadUsers();
    } catch (err) {
      setUserError(err.message || 'Could not create user.');
    } finally {
      setCreatingUser(false);
    }
  };

  const startEditUser = (targetUser) => {
    setEditingUser({
      id: targetUser.id,
      full_name: targetUser.full_name || '',
      email: targetUser.email || '',
      role: targetUser.role || 'user',
    });
    setUserError('');
    setUserSuccess('');
  };

  const saveUser = async () => {
    if (!editingUser?.email?.trim()) {
      setUserError('Email is required.');
      return;
    }

    setUpdatingUserId(editingUser.id);
    try {
      const updated = await entities.User.update(editingUser.id, {
        full_name: editingUser.full_name.trim(),
        email: editingUser.email.trim(),
        role: editingUser.role,
      });
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
      setUserSuccess('User updated successfully.');
    } catch (err) {
      setUserError(err.message || 'Could not update user.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const deleteUser = async (targetUser) => {
    const isSelf = targetUser.id === user?.id;
    if (isSelf) {
      setUserError('You cannot delete your own admin account.');
      return;
    }

    const confirmed = window.confirm(`Delete user "${targetUser.email}"?`);
    if (!confirmed) return;

    setDeletingUserId(targetUser.id);
    try {
      await entities.User.delete(targetUser.id);
      setUsers(prev => prev.filter(u => u.id !== targetUser.id));
      if (editingUser?.id === targetUser.id) setEditingUser(null);
      setUserSuccess('User deleted successfully.');
    } catch (err) {
      setUserError(err.message || 'Could not delete user.');
    } finally {
      setDeletingUserId(null);
    }
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
          { key: 'users', label: 'User Management' },
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
                { key: 'short_challenge', label: "Today's Short Challenge" },
                { key: 'deep_dive', label: "Today's Deep Dive" },
                { key: 'self_reflection', label: "Today's Self-Reflection" },
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
                    {day.short_challenge && <p className="text-xs" style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-secondary)' }}>Challenge:</strong> {day.short_challenge}</p>}
                    {day.deep_dive && <p className="text-xs" style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-secondary)' }}>Deep Dive:</strong> {day.deep_dive}</p>}
                    {day.self_reflection && <p className="text-xs" style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-secondary)' }}>Reflection:</strong> {day.self_reflection}</p>}
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
          <button onClick={() => { setFieldError(''); setEditingField({ ...emptyField }); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8882A)', color: '#1A1A2E' }}>
            <Plus size={16} /> Add Custom Field
          </button>

          {editingField && (
            <div ref={fieldEditorRef} className="glass-card rounded-2xl p-6 border-gold border animate-fade-in-up">
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                {editingField.id ? 'Edit' : 'New'} Custom Field
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Display In — always first so other fields adapt */}
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Display In</label>
                  <select
                    value={editingField.display_in || 'my_entry'}
                    onChange={e => setEditingField(p => ({ ...p, display_in: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ background: 'rgba(22,33,62,0.9)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                  >
                    <option value="my_entry">My Entry</option>
                    <option value="today_habit">Today's Habit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    {editingField.display_in === 'today_habit' ? 'Title' : 'Field Label'}
                  </label>
                  <input value={editingField.field_label}
                    onChange={e => setEditingField(p => ({ ...p, field_label: e.target.value }))}
                    placeholder={editingField.display_in === 'today_habit' ? 'Section title shown in Today\'s Habit' : 'Label shown to the user'}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* My Entry mode: show Field Type */}
                {editingField.display_in === 'my_entry' && (
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
                      <option value="title">Title Only</option>
                    </select>
                  </div>
                )}

                {/* My Entry + select type: show Options */}
                {editingField.display_in === 'my_entry' && editingField.field_type === 'select' && (
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

                {/* Today's Habit mode: show Description */}
                {editingField.display_in === 'today_habit' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Description</label>
                    <textarea value={editingField.description || ''}
                      onChange={e => setEditingField(p => ({ ...p, description: e.target.value }))}
                      placeholder="Content that will be displayed under this section in Today's Habit"
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                      style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Sort Order</label>
                  <input type="number" value={editingField.sort_order ?? 0}
                    onChange={e => setEditingField(p => ({
                      ...p,
                      sort_order: e.target.value === '' ? 0 : Number(e.target.value),
                    }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={saveField} disabled={fieldSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #A8882A)', color: '#1A1A2E', opacity: fieldSaving ? 0.7 : 1 }}>
                  <Save size={14} /> {fieldSaving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => { setFieldError(''); setEditingField(null); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <X size={14} /> Cancel
                </button>
              </div>
              {fieldError && (
                <p className="text-xs mt-3" style={{ color: '#f87171' }}>
                  {fieldError}
                </p>
              )}
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
                    {field.display_in === 'today_habit' ? "Today's Habit" : 'My Entry'}
                    {field.display_in === 'my_entry' && ` · ${field.field_type}`}
                    {field.display_in === 'my_entry' && field.field_options ? ` · ${field.field_options}` : ''}
                  </p>
                  {field.display_in === 'today_habit' && field.description && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {field.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleFieldActive(field)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${field.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                    {field.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => { setFieldError(''); setEditingField({ ...field }); }}
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

      {/* USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border-gold border">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Create User Account
            </h3>
            <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                <input
                  type="text"
                  value={userForm.full_name}
                  onChange={e => setUserField('full_name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserField('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="md:col-span-2">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  A temporary password is assigned by the server and the user is prompted to set their own password on first login.
                  When SMTP environment variables are set on the backend, a welcome email is sent automatically.
                </p>
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #A8882A)', color: '#1A1A2E', opacity: creatingUser ? 0.7 : 1 }}
                >
                  <Plus size={14} />
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
                {userError && <span className="text-xs" style={{ color: '#f87171' }}>{userError}</span>}
                {userSuccess && <span className="text-xs" style={{ color: '#4ade80' }}>{userSuccess}</span>}
              </div>
            </form>
          </div>

          <div className="glass-card rounded-2xl p-6 border-gold border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Registered Users</h3>
              <button
                type="button"
                onClick={loadUsers}
                className="px-3 py-1.5 rounded-lg text-xs border"
                style={{ borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-secondary)' }}
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: 'var(--text-muted)' }}>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Role</th>
                    <th className="text-left py-2">Created</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t" style={{ borderColor: 'rgba(201,168,76,0.1)' }}>
                      <td className="py-2" style={{ color: 'var(--text-primary)' }}>
                        {editingUser?.id === u.id ? (
                          <input
                            type="text"
                            value={editingUser.full_name}
                            onChange={e => setEditingUser(prev => ({ ...prev, full_name: e.target.value }))}
                            className="w-full px-2 py-1 rounded border text-xs outline-none"
                            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                          />
                        ) : (u.full_name || '-')}
                      </td>
                      <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
                        {editingUser?.id === u.id ? (
                          <input
                            type="email"
                            value={editingUser.email}
                            onChange={e => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-2 py-1 rounded border text-xs outline-none"
                            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                          />
                        ) : u.email}
                      </td>
                      <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
                        {editingUser?.id === u.id ? (
                          <select
                            value={editingUser.role}
                            onChange={e => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-2 py-1 rounded border text-xs outline-none"
                            style={{ background: 'rgba(22,33,62,0.9)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : u.role}
                      </td>
                      <td className="py-2" style={{ color: 'var(--text-muted)' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          {editingUser?.id === u.id ? (
                            <>
                              <button
                                type="button"
                                onClick={saveUser}
                                disabled={updatingUserId === u.id}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                style={{ color: 'var(--brand-gold)', opacity: updatingUserId === u.id ? 0.6 : 1 }}
                              >
                                <Save size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditUser(u)}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                style={{ color: 'var(--brand-gold)' }}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteUser(u)}
                                disabled={deletingUserId === u.id || u.id === user?.id}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                style={{ color: '#f87171', opacity: deletingUserId === u.id || u.id === user?.id ? 0.5 : 1 }}
                                title={u.id === user?.id ? 'You cannot delete your own account' : 'Delete user'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loadingUsers && users.length === 0 && (
                <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>No users found.</p>
              )}
              {loadingUsers && (
                <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>Loading users...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}