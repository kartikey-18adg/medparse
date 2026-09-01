'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Clinical Operator');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, fullName, role);
      }
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F7F5] p-4 text-[#1A1917]">
      {/* Container */}
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E2E0D8] rounded-[2px] overflow-hidden shadow-none">
        {/* Top institutional strip */}
        <div className="px-5 py-3 bg-[#F2F1EC] border-b border-[#E2E0D8] flex items-center justify-between text-xs font-mono text-[#5E5D57]">
          <div className="flex items-center gap-2 font-bold text-[#1A1917]">
            <span>MEDPARSE</span>
            <span className="text-[#C6C4BA]">·</span>
            <span>CLINICAL OPERATIONS</span>
          </div>
          <span className="text-[10px] bg-[#EAE8DF] px-2 py-0.5 border border-[#D5D3C8] rounded-[2px]">
            SECURE ACCESS
          </span>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 border-b border-[#E2E0D8] bg-[#FAF9F7] text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-3 text-center transition-colors font-medium ${
              mode === 'login'
                ? 'bg-[#FFFFFF] text-[#1A1917] border-b-2 border-[#1A1917] font-bold'
                : 'text-[#5E5D57] hover:text-[#1A1917] hover:bg-[#F2F1EC]'
            }`}
          >
            Operator Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-3 text-center transition-colors font-medium ${
              mode === 'register'
                ? 'bg-[#FFFFFF] text-[#1A1917] border-b-2 border-[#1A1917] font-bold'
                : 'text-[#5E5D57] hover:text-[#1A1917] hover:bg-[#F2F1EC]'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <h2 className="text-sm font-bold font-mono text-[#1A1917] uppercase tracking-tight">
              {mode === 'login' ? 'Authenticate Operator Station' : 'Create Clinical Operator Credentials'}
            </h2>
            <p className="text-[#5E5D57] mt-0.5 text-[11px]">
              {mode === 'login'
                ? 'Sign in to access user-isolated clinical document records and claim workspace.'
                : 'Register your clinical credentials to begin structured document extraction.'}
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-[#FDF0F0] border border-[#F2B8B8] text-[#8A1E20] rounded-[2px] font-mono text-[11px] flex items-center justify-between">
              <span>[ERROR]: {error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-[#8A1E20] hover:text-[#000000] ml-2"
              >
                ×
              </button>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="block font-mono text-[11px] text-[#5E5D57] uppercase">
                Full Name & Title <span className="text-[#8A1E20]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Sarah Jenkins, MD"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E2E0D8] rounded-[2px] text-[#1A1917] font-mono focus:bg-[#FFFFFF] focus:outline-none focus:border-[#1A1917]"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-mono text-[11px] text-[#5E5D57] uppercase">
              Hospital Email / Clinician ID <span className="text-[#8A1E20]">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. operator@hospital.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E2E0D8] rounded-[2px] text-[#1A1917] font-mono focus:bg-[#FFFFFF] focus:outline-none focus:border-[#1A1917]"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-[11px] text-[#5E5D57] uppercase">
              Password <span className="text-[#8A1E20]">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E2E0D8] rounded-[2px] text-[#1A1917] font-mono focus:bg-[#FFFFFF] focus:outline-none focus:border-[#1A1917]"
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="block font-mono text-[11px] text-[#5E5D57] uppercase">
                Clinical Department / Station Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E2E0D8] rounded-[2px] text-[#1A1917] font-mono focus:bg-[#FFFFFF] focus:outline-none focus:border-[#1A1917]"
              >
                <option value="Clinical Operator">Clinical Operator</option>
                <option value="Medical Reviewer">Medical Reviewer / Auditor</option>
                <option value="Hospital Billing Specialist">Hospital Billing Specialist</option>
                <option value="Attending Physician">Attending Physician</option>
              </select>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 text-xs font-mono font-bold uppercase rounded-[2px] transition-colors ${
                isSubmitting
                  ? 'bg-[#EAE8DF] text-[#89877E] cursor-not-allowed'
                  : 'bg-[#1A1917] hover:bg-[#333230] text-[#FFFFFF] cursor-pointer'
              }`}
            >
              {isSubmitting
                ? '[Authenticating...]'
                : mode === 'login'
                ? 'Sign In to Workspace &rarr;'
                : 'Create Account &rarr;'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#F2F1EC] border-t border-[#E2E0D8] text-[10px] font-mono text-[#89877E] text-center">
          Encrypted Authentication · Session Protected via JWT
        </div>
      </div>
    </div>
  );
};
