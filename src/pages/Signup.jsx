import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { AuthShell, Field, ErrorMsg, SuccessMsg, SubmitButton, inputCls } from './Login';

export default function Signup() {
  const { signup } = useAuth();

  const [form, setForm] = useState({ full_name: '', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const result = await signup({ full_name: form.full_name.trim(), email: form.email.trim() });
      const emailLine = result.welcome_email_sent
        ? ' A welcome email with sign-in details was sent.'
        : ` No email was sent: ${result.welcome_email_error || 'configure SMTP on the server.'}`;
      setSuccess(`Account created.${emailLine}`);
      setForm({ full_name: '', email: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join the challenge — you will set your password on first sign in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name">
          <input
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={form.full_name}
            onChange={e => set('full_name', e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Email address">
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            className={inputCls}
          />
        </Field>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          The server assigns a temporary password and emails sign-in instructions when SMTP is configured in the backend environment.
        </p>

        {error && <ErrorMsg msg={error} />}
        {success && <SuccessMsg msg={success} />}

        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link to="/Login" className="font-semibold hover:underline" style={{ color: 'var(--brand-gold)' }}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
