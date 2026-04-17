import React, { useState, useEffect } from 'react';
import { Quote, Lightbulb, Target, Sparkles, ChevronDown, ChevronUp, LayoutList } from 'lucide-react';
import { entities } from '@/api/entities';

const Section = ({ icon: Icon, title, content, accent = false }) => {
  const [open, setOpen] = useState(true);
  if (!content) return null;
  return (
    <div className="glass-card rounded-2xl border border-gold overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} style={{ color: 'var(--brand-gold)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent ? 'var(--brand-gold)' : 'var(--text-secondary)' }}>
            {title}
          </span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{content}</p>
        </div>
      )}
    </div>
  );
};

export default function DayContentCard({ dayContent }) {
  const [customFields, setCustomFields] = useState([]);

  useEffect(() => {
    entities.CustomField.filter({ is_active: true, display_in: 'today_habit' })
      .then(fields => {
        const sorted = [...fields].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setCustomFields(sorted);
      })
      .catch(() => setCustomFields([]));
  }, []);

  if (!dayContent) return null;

  return (
    <div className="space-y-4">
      {/* Quote */}
      {dayContent.quote_of_day && (
        <div className="glass-card rounded-2xl p-5 border-gold border"
          style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(168,136,42,0.05))' }}>
          <div className="flex gap-3 sm:gap-4">
            <Quote className="shrink-0 mt-0.5 sm:mt-1 w-6 h-6 sm:w-7 sm:h-7" style={{ color: 'var(--brand-gold)' }} />
            <div className="min-w-0 flex-1">
              <p className="text-lg sm:text-xl md:text-2xl italic leading-snug sm:leading-relaxed font-playfair" style={{ color: 'var(--text-primary)' }}>
                "{dayContent.quote_of_day}"
              </p>
              {dayContent.quote_author && (
                <p className="text-sm sm:text-base mt-2 sm:mt-3" style={{ color: 'var(--text-muted)' }}>— {dayContent.quote_author}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Section icon={Lightbulb} title="Why This Habit Matters" content={dayContent.why_this_habit} />
      <Section icon={Target} title="Today's Action Plan" content={dayContent.action_plan} accent />
      <Section icon={Sparkles} title="Today's Affirmation" content={dayContent.affirmation} />

      {/* Custom fields for Today's Habit */}
      {customFields.map(cf => (
        <Section
          key={cf.id}
          icon={LayoutList}
          title={cf.field_label}
          content={cf.description}
          accent
        />
      ))}
    </div>
  );
}
