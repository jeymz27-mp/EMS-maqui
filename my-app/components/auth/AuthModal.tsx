'use client';

import React, { useState } from 'react';
import { useEMS } from '../../context/EMSContext';
import { Sparkles, X, Eye, EyeOff, ShieldCheck, Mail, CheckCircle2, Loader2 } from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose?: () => void;
}) {
  const { login, activateAccount, forgotPassword, sendDefaultPassword, employees } = useEMS();

  const [mode, setMode] = useState<'login' | 'activate' | 'forgot'>('login');

  // Login form state
  const [loginId, setLoginId] = useState('pantasjeymz@gmail.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSendingDefaultPass, setIsSendingDefaultPass] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<{
    text: string;
    isSimulated: boolean;
    defaultPassword?: string;
  } | null>(null);

  const handleSendDefaultPassword = async (targetId?: string) => {
    const idToUse = (targetId || loginId || actEmpId || actEmail || forgotId).trim();
    setEmailSuccessMsg(null);
    setLoginError('');

    if (!idToUse) {
      setLoginError('Please enter your Company Email or Employee ID first.');
      return;
    }

    setIsSendingDefaultPass(true);
    try {
      const res = await sendDefaultPassword(idToUse);
      if (!res.success) {
        setLoginError(res.message);
      } else {
        setEmailSuccessMsg({
          text: res.message,
          isSimulated: res.isSimulated,
          defaultPassword: res.defaultPassword,
        });
        if (res.defaultPassword) {
          setLoginPassword(res.defaultPassword);
        }
      }
    } catch {
      setLoginError('Failed to dispatch default password.');
    } finally {
      setIsSendingDefaultPass(false);
    }
  };

  // Activation form state
  const [actEmpId, setActEmpId] = useState('EMP-2026-005');
  const [actEmail, setActEmail] = useState('new.hire@company.com');
  const [actUsername, setActUsername] = useState('jtaylor');
  const [actPassword, setActPassword] = useState('');
  const [actConfirmPassword, setActConfirmPassword] = useState('');
  const [actError, setActError] = useState('');

  // Forgot password state
  const [forgotId, setForgotId] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotError, setForgotError] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = login(loginId, loginPassword);
    if (!res.success) {
      setLoginError(res.error || 'Login failed.');
    } else if (onClose) {
      onClose();
    }
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setActError('');
    if (!actPassword || actPassword.length < 6) {
      setActError('Password must be at least 6 characters.');
      return;
    }
    if (actPassword !== actConfirmPassword) {
      setActError('Passwords do not match.');
      return;
    }

    const res = activateAccount(actEmpId, actEmail, actUsername, actPassword);
    if (!res.success) {
      setActError(res.error || 'Activation failed.');
    } else if (onClose) {
      onClose();
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (forgotStep === 1) {
      if (!forgotId.trim()) {
        setForgotError('Please enter your email or employee ID.');
        return;
      }
      setForgotStep(2);
    } else {
      if (forgotNewPassword.length < 6) {
        setForgotError('Password must be at least 6 characters.');
        return;
      }
      if (forgotNewPassword !== forgotConfirmPassword) {
        setForgotError('Passwords do not match.');
        return;
      }
      const res = forgotPassword(forgotId, forgotNewPassword);
      if (!res.success) {
        setForgotError(res.error || 'Password reset failed.');
      } else {
        setMode('login');
        setLoginId(forgotId);
        setLoginPassword(forgotNewPassword);
        setForgotStep(1);
      }
    }
  };

  const setDemoUser = (type: 'james' | 'sarah' | 'newhire') => {
    if (type === 'james') {
      setMode('login');
      setLoginId('pantasjeymz@gmail.com');
      setLoginPassword('Password123!');
      setLoginError('');
    } else if (type === 'sarah') {
      setMode('login');
      setLoginId('jeymzpantas@gmail.com');
      setLoginPassword('Password123!');
      setLoginError('');
    } else if (type === 'newhire') {
      setMode('activate');
      setActEmpId('EMP-2026-005');
      setActEmail('new.hire@company.com');
      setActUsername('jtaylor');
      setActPassword('Taylor2026!');
      setActConfirmPassword('Taylor2026!');
      setActError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#4A7268] p-6 sm:p-8 rounded-[32px] shadow-2xl border border-white/20 my-8">
        {/* Close Button if closable */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-black/20 hover:bg-black/40 transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Split Box Mirroring Figma Page 2, 3 & 12 */}
        <div className="bg-[#3D635B] rounded-[24px] p-4 sm:p-6 shadow-inner border border-white/10">
          {mode === 'login' ? (
            /* Figma Page 2 & 12: Login Screen */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left: Login Form Card */}
              <div className="bg-[#2D4E47] p-6 sm:p-8 rounded-[24px] shadow-xl border border-white/10 text-white space-y-6">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-wide text-white">Welcome</h1>
                  <p className="text-xs text-white/70 mt-1 font-light">
                    Please enter your details to login
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1.5">
                      Company Email / Employee ID
                    </label>
                    <input
                      type="text"
                      required
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      placeholder="Enter your ID here..."
                      className="w-full px-4 py-3 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password here..."
                        className="w-full px-4 py-3 pr-10 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {emailSuccessMsg && (
                      <div className="mt-2 p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 space-y-1 animate-in fade-in">
                        <div className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-[11px]">{emailSuccessMsg.text}</span>
                        </div>
                        {emailSuccessMsg.defaultPassword && (
                          <div className="flex items-center justify-between pt-1 border-t border-emerald-500/30 text-[11px]">
                            <span className="font-mono text-emerald-100 font-bold">
                              {emailSuccessMsg.defaultPassword}
                            </span>
                            <button
                              type="button"
                              onClick={() => setLoginPassword(emailSuccessMsg.defaultPassword || '')}
                              className="px-2 py-0.5 bg-emerald-500/20 text-emerald-200 rounded font-semibold cursor-pointer"
                            >
                              Auto-fill
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {loginError && (
                    <div className="p-2.5 bg-rose-900/60 border border-rose-500/40 rounded-xl text-xs text-rose-200">
                      {loginError}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#24413B] hover:bg-[#1D3631] text-white font-bold rounded-xl text-xs tracking-wider transition-all shadow-md cursor-pointer border border-white/10"
                    >
                      Log in
                    </button>
                  </div>
                </form>

                <div className="pt-2 flex items-center justify-between text-[11px] text-white/60 border-t border-white/10">
                  <button
                    onClick={() => {
                      setMode('activate');
                      setActError('');
                    }}
                    className="hover:text-emerald-300 transition-colors font-medium underline"
                  >
                    First time? Activate Account
                  </button>
                  <button
                    onClick={() => {
                      setMode('forgot');
                      setForgotError('');
                    }}
                    className="hover:text-emerald-300 transition-colors font-medium underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Right: Skyscraper Image */}
              <div className="h-full min-h-[340px] rounded-[24px] overflow-hidden shadow-2xl relative border border-white/10 hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80"
                  alt="Modern Corporate Building"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#27413B]/80 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">EMS Portal v3.0</p>
                    <p className="text-sm font-semibold">Employee & Manager System</p>
                  </div>
                </div>
              </div>
            </div>
          ) : mode === 'activate' ? (
            /* Figma Page 3: First Login / Account Activation Screen */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left: Skyscraper Image */}
              <div className="h-full min-h-[340px] rounded-[24px] overflow-hidden shadow-2xl relative border border-white/10 hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80"
                  alt="Modern Corporate Building"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#27413B]/80 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Account Activation</p>
                    <p className="text-sm font-semibold">Set your credentials on first login</p>
                  </div>
                </div>
              </div>

              {/* Right: Activation Form Card */}
              <div className="bg-[#2D4E47] p-6 sm:p-8 rounded-[24px] shadow-xl border border-white/10 text-white space-y-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-wide text-white">Welcome</h1>
                  <p className="text-xs text-white/70 mt-1 font-light">
                    Activate account with your assigned Employee ID
                  </p>
                </div>

                <form onSubmit={handleActivate} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-white/80 mb-1">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        required
                        value={actEmpId}
                        onChange={(e) => setActEmpId(e.target.value)}
                        placeholder="EMP-2026-005"
                        className="w-full px-3 py-2 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-white/80 mb-1">
                        Company Email
                      </label>
                      <input
                        type="email"
                        required
                        value={actEmail}
                        onChange={(e) => setActEmail(e.target.value)}
                        placeholder="new.hire@company.com"
                        className="w-full px-3 py-2 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={actUsername}
                      onChange={(e) => setActUsername(e.target.value)}
                      placeholder="Enter your Username here..."
                      className="w-full px-4 py-2.5 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={actPassword}
                      onChange={(e) => setActPassword(e.target.value)}
                      placeholder="Enter your password here..."
                      className="w-full px-4 py-2.5 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={actConfirmPassword}
                      onChange={(e) => setActConfirmPassword(e.target.value)}
                      placeholder="Enter your password here..."
                      className="w-full px-4 py-2.5 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  {actError && (
                    <div className="p-2.5 bg-rose-900/60 border border-rose-500/40 rounded-xl text-xs text-rose-200">
                      {actError}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#24413B] hover:bg-[#1D3631] text-white font-bold rounded-xl text-xs tracking-wider transition-all shadow-md cursor-pointer border border-white/10"
                    >
                      Save & Continue
                    </button>
                  </div>
                </form>

                <div className="text-center pt-1">
                  <button
                    onClick={() => setMode('login')}
                    className="text-xs text-white/70 hover:text-emerald-300 underline"
                  >
                    Already activated? Return to Log In
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Forgot Password Screen */
            <div className="max-w-md mx-auto bg-[#2D4E47] p-6 sm:p-8 rounded-[24px] shadow-xl border border-white/10 text-white space-y-4">
              <h2 className="text-2xl font-bold">Password Recovery</h2>
              <form onSubmit={handleForgot} className="space-y-4">
                {forgotStep === 1 ? (
                  <div>
                    <label className="block text-xs text-white/80 mb-1">Company Email or ID</label>
                    <input
                      type="text"
                      required
                      value={forgotId}
                      onChange={(e) => setForgotId(e.target.value)}
                      placeholder="Enter your registered email..."
                      className="w-full px-4 py-3 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs focus:outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-white/80 mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Enter new password..."
                        className="w-full px-4 py-3 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/80 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password..."
                        className="w-full px-4 py-3 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {forgotError && (
                  <div className="p-2.5 bg-rose-900/60 border border-rose-500/40 rounded-xl text-xs text-rose-200">
                    {forgotError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="py-2.5 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-[#24413B] hover:bg-[#1D3631] rounded-xl text-xs font-bold border border-white/10"
                  >
                    {forgotStep === 1 ? 'Next' : 'Reset & Log In'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
