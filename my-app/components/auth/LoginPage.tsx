'use client';

import React, { useState } from 'react';
import { useEMS } from '../../context/EMSContext';
import { Eye, EyeOff, AlertCircle, Mail, CheckCircle2, Loader2, Sparkles, KeyRound } from 'lucide-react';

export function LoginPage() {
  const { login, activateAccount, forgotPassword, sendDefaultPassword } = useEMS();

  const [mode, setMode] = useState<'login' | 'activate' | 'forgot'>('login');

  // Login form state (Figma Page 2 & Page 12)
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [idError, setIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // EmailJS Default Password state
  const [isSendingDefaultPass, setIsSendingDefaultPass] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<{
    text: string;
    isSimulated: boolean;
    defaultPassword?: string;
    email?: string;
  } | null>(null);

  const handleSendDefaultPassword = async (targetId?: string) => {
    const idToUse = (targetId || loginId || actEmpId || actEmail || forgotId).trim();
    setEmailSuccessMsg(null);
    setPasswordError('');
    setIdError('');
    setLoginError('');

    if (!idToUse) {
      setIdError('Please enter your Company Email or Employee ID first.');
      return;
    }

    setIsSendingDefaultPass(true);
    try {
      const res = await sendDefaultPassword(idToUse);
      if (!res.success) {
        setIdError(res.message);
      } else {
        setEmailSuccessMsg({
          text: res.message,
          isSimulated: res.isSimulated,
          defaultPassword: res.defaultPassword,
          email: res.email,
        });
        if (res.defaultPassword) {
          setLoginPassword(res.defaultPassword);
        }
        if (mode !== 'login') {
          setMode('login');
          setLoginId(idToUse);
        }
      }
    } catch {
      setIdError('Failed to dispatch default password. Please try again.');
    } finally {
      setIsSendingDefaultPass(false);
    }
  };

  // First Login / Account Activation form state (Figma Page 3)
  const [actEmpId, setActEmpId] = useState('');
  const [actEmail, setActEmail] = useState('');
  const [actUsername, setActUsername] = useState('');
  const [actPassword, setActPassword] = useState('');
  const [actConfirmPassword, setActConfirmPassword] = useState('');
  const [showActPass, setShowActPass] = useState(false);
  const [actError, setActError] = useState('');

  // Forgot password state
  const [forgotId, setForgotId] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotError, setForgotError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIdError('');
    setPasswordError('');

    let hasError = false;
    if (!loginId.trim()) {
      setIdError('Please enter your Company Email or Employee ID.');
      hasError = true;
    }
    if (!loginPassword.trim()) {
      setPasswordError('Please enter your password.');
      hasError = true;
    }
    if (hasError) return;

    const res = login(loginId, loginPassword);
    if (!res.success) {
      const err = res.error || 'Invalid credentials.';
      const lower = err.toLowerCase();
      if (lower.includes('password')) {
        setPasswordError(err);
      } else if (lower.includes('not found') || lower.includes('no account') || lower.includes('email') || lower.includes('id')) {
        setIdError(err);
      } else {
        setLoginError(err);
      }
    }
  };

  const handleActivationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActError('');
    if (!actPassword || actPassword.length < 6) {
      setActError('Password must contain at least 6 characters.');
      return;
    }
    if (actPassword !== actConfirmPassword) {
      setActError('New password and confirm password do not match.');
      return;
    }

    const res = activateAccount(actEmpId, actEmail, actUsername, actPassword);
    if (!res.success) {
      setActError(res.error || 'Account activation failed.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (forgotStep === 1) {
      if (!forgotId.trim()) {
        setForgotError('Please enter your Employee ID or Email.');
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
        setForgotError(res.error || 'Reset failed.');
      } else {
        setMode('login');
        setLoginId(forgotId);
        setLoginPassword(forgotNewPassword);
        setForgotStep(1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#4A7268] flex items-center justify-center p-4 sm:p-6 lg:p-8 select-none">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            input::-ms-reveal,
            input::-ms-clear {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
            input::-webkit-credentials-auto-fill-button,
            input::-webkit-contacts-auto-fill-button {
              visibility: hidden !important;
              display: none !important;
              pointer-events: none !important;
              width: 0 !important;
              height: 0 !important;
            }
          `,
        }}
      />
      <div className="w-full max-w-4xl">
        {/* Main Figma Card Container (Figma Pages 2 & 3) */}
        <div className="bg-[#3D635B] rounded-[32px] p-5 sm:p-8 shadow-2xl border border-white/15">
          {mode === 'login' ? (
            /* ========================================================================= */
            /* Figma Page 2 & Page 12: Employee & Manager Login Screen                   */
            /* ========================================================================= */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left Column: Login Form Container */}
              <div className="bg-[#2D4E47] p-6 sm:p-8 rounded-[24px] shadow-2xl border border-white/10 text-white space-y-6">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-wide text-white">Welcome</h1>
                  <p className="text-xs text-white/70 mt-1 font-light">
                    Please enter your details to login
                  </p>
                </div>

                <form noValidate onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1.5">
                      Company Email / Employee ID
                    </label>
                    <input
                      type="text"
                      value={loginId}
                      onChange={(e) => {
                        setLoginId(e.target.value);
                        if (idError) setIdError('');
                        if (loginError) setLoginError('');
                      }}
                      placeholder="Enter your ID here..."
                      className={`w-full px-4 py-3 bg-[#385B53] rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none transition-all ${
                        idError
                          ? 'border-2 border-rose-400 focus:ring-2 focus:ring-rose-400/50 bg-rose-950/20'
                          : 'border border-white/10 focus:ring-2 focus:ring-emerald-400'
                      }`}
                    />
                    {idError && (
                      <p className="text-[11px] text-rose-300 font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{idError}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                          if (loginError) setLoginError('');
                        }}
                        placeholder="Enter your password here..."
                        className={`w-full px-4 py-3 pr-10 bg-[#385B53] rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none transition-all ${
                          passwordError
                            ? 'border-2 border-rose-400 focus:ring-2 focus:ring-rose-400/50 bg-rose-950/20'
                            : 'border border-white/10 focus:ring-2 focus:ring-emerald-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-[11px] text-rose-300 font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{passwordError}</span>
                      </p>
                    )}
                  </div>

                  {emailSuccessMsg && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 space-y-2 animate-in fade-in">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-white">Default Password Sent via EmailJS!</p>
                          <p className="text-[11px] text-emerald-200/90 leading-relaxed mt-0.5">
                            {emailSuccessMsg.text}
                          </p>
                        </div>
                      </div>
                      {emailSuccessMsg.defaultPassword && (
                        <div className="mt-1 pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[11px]">
                          <span className="font-mono text-emerald-100 bg-emerald-900/90 px-2 py-0.5 rounded border border-emerald-400/40 font-bold">
                            {emailSuccessMsg.defaultPassword}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setLoginPassword(emailSuccessMsg.defaultPassword || '');
                              setPasswordError('');
                            }}
                            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 rounded-lg font-bold border border-emerald-400/30 transition-all cursor-pointer"
                          >
                            Auto-fill Password
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {loginError && (
                    <div className="p-2.5 bg-rose-900/70 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#24413B] hover:bg-[#1D3631] text-white font-bold rounded-xl text-xs tracking-wider transition-all shadow-md cursor-pointer border border-white/10 active:scale-[0.99]"
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
                    className="hover:text-emerald-300 transition-colors font-medium underline cursor-pointer"
                  >
                    First-login? Activate Account
                  </button>
                  <button
                    onClick={() => {
                      setMode('forgot');
                      setForgotError('');
                    }}
                    className="hover:text-emerald-300 transition-colors font-medium underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Right Column: Skyscraper Architectural Photo */}
              <div className="h-full min-h-[380px] rounded-[24px] overflow-hidden shadow-2xl relative border border-white/10 hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80"
                  alt="Modern Corporate Skyscraper"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#27413B]/80 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Employee Management System
                    </p>
                    <p className="text-sm font-semibold">Figma UI Design • James Maqui Pantas</p>
                  </div>
                </div>
              </div>
            </div>
          ) : mode === 'activate' ? (
            /* ========================================================================= */
            /* Figma Page 3: First Login / Account Activation Screen                     */
            /* ========================================================================= */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left Column: Skyscraper Architectural Photo */}
              <div className="h-full min-h-[380px] rounded-[24px] overflow-hidden shadow-2xl relative border border-white/10 hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80"
                  alt="Modern Corporate Skyscraper"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#27413B]/80 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Account Activation
                    </p>
                    <p className="text-sm font-semibold">First-time login credential setup</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Activation Form Container */}
              <div className="bg-[#2D4E47] p-6 sm:p-8 rounded-[24px] shadow-2xl border border-white/10 text-white space-y-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-wide text-white">Welcome</h1>
                  <p className="text-xs text-white/70 mt-0.5 font-light">
                    Set your personal username and password
                  </p>
                </div>

                <form noValidate onSubmit={handleActivationSubmit} className="space-y-3.5">
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
                        placeholder="e.g. EMP-2026-005"
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
                        placeholder="e.g. new.hire@company.com"
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
                    <div className="relative">
                      <input
                        type={showActPass ? 'text' : 'password'}
                        required
                        value={actPassword}
                        onChange={(e) => setActPassword(e.target.value)}
                        placeholder="Enter your password here..."
                        className="w-full px-4 py-2.5 pr-10 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowActPass(!showActPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                      >
                        {showActPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showActPass ? 'text' : 'password'}
                      required
                      value={actConfirmPassword}
                      onChange={(e) => setActConfirmPassword(e.target.value)}
                      placeholder="Enter your password here..."
                      className="w-full px-4 py-2.5 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  {actError && (
                    <div className="p-2.5 bg-rose-900/70 border border-rose-500/40 rounded-xl text-xs text-rose-200">
                      {actError}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#24413B] hover:bg-[#1D3631] text-white font-bold rounded-xl text-xs tracking-wider transition-all shadow-md cursor-pointer border border-white/10 active:scale-[0.99]"
                    >
                      Save & Continue
                    </button>
                  </div>
                </form>

                <div className="text-center pt-3 border-t border-white/10">
                  <button
                    onClick={() => setMode('login')}
                    className="text-xs text-white/70 hover:text-emerald-300 underline cursor-pointer"
                  >
                    Already activated? Return to Log In
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* Forgot Password Recovery                                                  */
            /* ========================================================================= */
            <div className="max-w-md mx-auto bg-[#2D4E47] p-6 sm:p-8 rounded-[24px] shadow-2xl border border-white/10 text-white space-y-4">
              <h2 className="text-2xl font-bold">Password Recovery</h2>
              <form noValidate onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
                {forgotStep === 1 ? (
                  <div>
                    <label className="block text-white/80 font-semibold mb-1">
                      Company Email or Employee ID
                    </label>
                    <input
                      type="text"
                      required
                      value={forgotId}
                      onChange={(e) => setForgotId(e.target.value)}
                      placeholder="e.g. pantasjeymz@gmail.com"
                      className="w-full px-4 py-3 bg-[#385B53] border border-white/10 rounded-xl text-white focus:outline-none"
                    />
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isSendingDefaultPass}
                        onClick={() => handleSendDefaultPassword(forgotId)}
                        className="w-full py-2.5 px-3 bg-emerald-800/60 hover:bg-emerald-700/60 border border-emerald-400/30 rounded-xl text-xs font-bold text-emerald-100 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isSendingDefaultPass ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending via EmailJS...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5" />
                            <span>Send Default Password via EmailJS</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-white/80 font-semibold mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Enter new password..."
                        className="w-full px-4 py-3 bg-[#385B53] border border-white/10 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 font-semibold mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Confirm new password..."
                        className="w-full px-4 py-3 bg-[#385B53] border border-white/10 rounded-xl text-white focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {forgotError && (
                  <div className="p-2.5 bg-rose-900/70 border border-rose-500/40 rounded-xl text-xs text-rose-200">
                    {forgotError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="py-2.5 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-[#24413B] hover:bg-[#1D3631] rounded-xl text-xs font-bold border border-white/10 cursor-pointer"
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
