import React, { useState } from 'react';
import { Quote, Lightbulb, Target, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

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
  if (!dayContent) return null;

  return (
    <div className="space-y-4">
      {/* Quote */}
      {dayContent.quote_of_day && (
        <div className="glass-card rounded-2xl p-5 border-gold border"
          style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(168,136,42,0.05))' }}>
          <div className="flex gap-3">
            <Quote size={20} style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-sm italic leading-relaxed font-playfair" style={{ color: 'var(--text-primary)' }}>
                "{dayContent.quote_of_day}"
              </p>
              {dayContent.quote_author && (
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>— {dayContent.quote_author}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Section icon={Lightbulb} title="Why This Habit Matters" content={dayContent.why_this_habit} />
      <Section icon={Target} title="Today's Action Plan" content={dayContent.action_plan} accent />
      <Section icon={Sparkles} title="Today's Affirmation" content={dayContent.affirmation} />
    </div>
  );
}