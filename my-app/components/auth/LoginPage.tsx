'use client';

import React, { useState } from 'react';
import { useEMS } from '../../context/EMSContext';
import { Eye, EyeOff, AlertCircle, Mail, CheckCircle2, Loader2, Sparkles, KeyRound, Database, User, ShieldCheck, Briefcase } from 'lucide-react';
import { SupabaseModal } from '../ui/SupabaseModal';

export function LoginPage() {
  const {
    login,
    activateAccount,
    forgotPassword,
    sendDefaultPassword,
    employees,
    isSupabaseActive,
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
  } = useEMS();

  const [mode, setMode] = useState<'login' | 'activate' | 'forgot'>('login');

  // Login form state (Figma Page 2 & Page 12)
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [idError, setIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Ensure login and activation fields are completely blank by default and on mode change
  React.useEffect(() => {
    if (mode === 'login') {
      setLoginId('');
      setLoginPassword('');
      setIdError('');
      setPasswordError('');
      setLoginError('');
    } else if (mode === 'activate') {
      setActStep(1);
      setActEmail('');
      setActEmpId('');
      setActDefaultPassword('');
      setActUsername('');
      setActPassword('');
      setActConfirmPassword('');
      setActError('');
      setStep1EmailSent(null);
    }
  }, [mode]);

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
          email: res.email,
        });
        if (mode === 'forgot') {
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

  // Multi-step Account Activation state (Figma Pictures 2, 3 & 4)
  const [actStep, setActStep] = useState<1 | 2 | 3>(1);
  const [actRole, setActRole] = useState<'employee' | 'manager'>('employee');
  const [actDepartment, setActDepartment] = useState<'IT' | 'Engineering' | 'Marketing' | 'HR' | 'Finance' | 'Operations'>('IT');
  const [actEmpId, setActEmpId] = useState('');
  const [actEmail, setActEmail] = useState('');
  const [actDefaultPassword, setActDefaultPassword] = useState('');
  const [actUsername, setActUsername] = useState('');
  const [actPassword, setActPassword] = useState('');
  const [actConfirmPassword, setActConfirmPassword] = useState('');
  const [showDefaultPass, setShowDefaultPass] = useState(false);
  const [showActPass, setShowActPass] = useState(false);
  const [showActConfirmPass, setShowActConfirmPass] = useState(false);
  const [actError, setActError] = useState('');

  // Step 1: Send Credentials via EmailJS
  const [isSendingEmailStep1, setIsSendingEmailStep1] = useState(false);
  const [step1EmailSent, setStep1EmailSent] = useState<{
    message: string;
    employeeId?: string;
    defaultPassword?: string;
    email: string;
  } | null>(null);

  const handleStep1SendEmail = async () => {
    setActError('');
    const trimmedEmail = actEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setActError('Please enter your Company Email first to receive your ID.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setActError('Please enter a valid company email address.');
      return;
    }

    setIsSendingEmailStep1(true);
    try {
      const res = await sendDefaultPassword(trimmedEmail, actRole, actDepartment);
      if (!res.success) {
        setActError(res.message || 'Failed to dispatch credentials.');
      } else {
        setStep1EmailSent({
          message: res.message,
          employeeId: res.employeeId,
          email: res.email || trimmedEmail,
        });
      }
    } finally {
      setIsSendingEmailStep1(false);
    }
  };

  // Helper to generate the next unique Employee/Manager ID
  const generateNextEmployeeId = (targetRole: 'employee' | 'manager' = actRole) => {
    const isManagerRole = targetRole === 'manager';
    const prefix = isManagerRole ? 'MGR-2026-' : 'EMP-2026-';
    const nums = employees
      .filter((e) =>
        isManagerRole
          ? (e.role === 'manager' || e.id.toUpperCase().startsWith('MGR-'))
          : (e.role === 'employee' || e.id.toUpperCase().startsWith('EMP-'))
      )
      .map((e) => {
        const match = e.id.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : (isManagerRole ? 100 : 5);
    const nextNum = String(maxNum + 1).padStart(3, '0');
    return `${prefix}${nextNum}`;
  };

  // Switch between Employee and Department Manager role in activation
  const handleRoleChange = (newRole: 'employee' | 'manager') => {
    setActRole(newRole);
    if (actError) setActError('');
  };

  // When user inputs email
  const handleActEmailChange = (emailVal: string) => {
    setActEmail(emailVal);
    if (actError) setActError('');

    const trimmed = emailVal.trim().toLowerCase();
    if (!trimmed) {
      return;
    }

    const found = employees.find((e) => e.email.toLowerCase() === trimmed);
    if (found) {
      if (found.role) {
        setActRole(found.role);
      }
      if (found.department) {
        setActDepartment(found.department);
      }
      if (found.username && !actUsername) {
        setActUsername(found.username);
      }
    }
  };

  // Step 1: "Activate Account" (User inputs Company Email -> User inputs assigned ID from EmailJS)
  const handleActStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setActError('');
    const trimmedEmail = actEmail.trim().toLowerCase();
    const trimmedId = actEmpId.trim().toUpperCase();

    if (!trimmedEmail) {
      setActError('Please enter your Company Email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setActError('Please enter a valid company email address.');
      return;
    }

    if (!trimmedId) {
      setActError(`Please enter your ${actRole === 'manager' ? 'Department Manager' : 'Employee'} ID received via EmailJS.`);
      return;
    }

    const employee = employees.find(
      (emp) => emp.email.toLowerCase() === trimmedEmail || emp.id.toUpperCase() === trimmedId
    );

    if (employee && employee.isActivated) {
      setActError('This account is already activated. Please return to log in directly.');
      return;
    }

    let assignedId = trimmedId;
    setActEmpId(assignedId);

    if (employee) {
      if (employee.role) {
        setActRole(employee.role);
      }
      if (employee.department) {
        setActDepartment(employee.department);
      }
      if (employee.username && !actUsername) {
        setActUsername(employee.username);
      } else if (!actUsername) {
        setActUsername(trimmedEmail.split('@')[0]);
      }
    } else {
      if (!actUsername) {
        setActUsername(trimmedEmail.split('@')[0]);
      }
    }

    // Default password starts blank so user enters credentials received from email
    setActDefaultPassword('');
    setActStep(2);
  };

  // Step 2: "Login Account" (System-assigned Employee ID + Default Password)
  const handleActStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setActError('');
    const trimmedDefaultPass = actDefaultPassword.trim();

    if (!trimmedDefaultPass) {
      setActError('Please enter your default password.');
      return;
    }

    const employee = employees.find(
      (emp) =>
        emp.email.toLowerCase() === actEmail.trim().toLowerCase() ||
        emp.id.toLowerCase() === actEmpId.trim().toLowerCase()
    );

    if (employee && employee.password && employee.password !== trimmedDefaultPass) {
      setActError('Incorrect default password. Please check your credentials or request a new one via EmailJS.');
      return;
    }

    if (!actUsername) {
      setActUsername(employee?.username || actEmail.trim().split('@')[0]);
    }

    setActStep(3);
  };

  const [isActivating, setIsActivating] = useState(false);

  // Step 3: "UPDATE USER CREDENTIALS" (Picture 4: Default Password + Username + Password + Confirm Password)
  const handleActStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setActError('');
    if (!actDefaultPassword.trim()) {
      setActError('Please enter your default password.');
      return;
    }
    if (!actUsername.trim() || actUsername.trim().length < 3) {
      setActError('Username must be at least 3 characters.');
      return;
    }
    if (!actPassword || actPassword.length < 6) {
      setActError('New password must contain at least 6 characters.');
      return;
    }
    if (actPassword === actDefaultPassword) {
      setActError('New password cannot be the same as your default temporary password.');
      return;
    }
    if (actPassword !== actConfirmPassword) {
      setActError('New password and confirm password do not match.');
      return;
    }

    setIsActivating(true);
    try {
      const res = await activateAccount(actEmpId, actEmail, actUsername, actPassword, actRole, actDepartment);
      if (!res.success) {
        setActError(res.error || 'Account activation failed.');
      } else {
        // Return back to Login screen with blank inputs
        setMode('login');
        setLoginId('');
        setLoginPassword('');
        setActStep(1);
        setActEmail('');
        setActEmpId('');
        setActUsername('');
        setActPassword('');
        setActConfirmPassword('');
        setActDefaultPassword('');
        setActRole('employee');
        setActDepartment('IT');
        setActError('');
      }
    } finally {
      setIsActivating(false);
    }
  };

  // Login submit handler
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

  // Forgot password state
  const [forgotId, setForgotId] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotError, setForgotError] = useState('');

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
        setLoginId('');
        setLoginPassword('');
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

                <form noValidate onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1.5">
                      Company Email / Employee ID
                    </label>
                    <input
                      type="text"
                      name="ems_login_username"
                      autoComplete="off"
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
                        name="ems_login_password"
                        autoComplete="new-password"
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
                      setActStep(1);
                      setActError('');
                    }}
                    className="hover:text-emerald-300 transition-colors font-medium underline cursor-pointer"
                  >
                    Activate Account
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
            /* Figma Pictures 2, 3 & 4: Multi-Step Account Activation System Flow         */
            /* ========================================================================= */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left Column: Skyscraper Architectural Photo with Activation Step Badges */}
              <div className="h-full min-h-[440px] rounded-[24px] overflow-hidden shadow-2xl relative border border-white/10 hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80"
                  alt="Modern Corporate Skyscraper"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#27413B]/90 via-[#27413B]/40 to-transparent flex flex-col justify-end p-6">
                  <div className="text-white space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 rounded-full border border-emerald-400/30 text-emerald-300 text-[11px] font-bold tracking-wider uppercase mb-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Account Activation</span>
                    </div>
                    <p className="text-base font-bold text-white">
                      {actStep === 1
                        ? 'Step 1 of 3 • Account Verification'
                        : actStep === 2
                        ? 'Step 2 of 3 • Default Password Verification'
                        : 'Step 3 of 3 • Update User Credentials'}
                    </p>
                    <p className="text-xs text-white/70 font-light leading-relaxed">
                      {actStep === 1
                        ? 'Enter your official Company Email and the ID dispatched to your email via EmailJS.'
                        : actStep === 2
                        ? 'Authenticate using your temporary default password dispatched by HR or EmailJS.'
                        : 'Set up your permanent username and new secure password to access your EMS portal.'}
                    </p>
                  </div>

                  {/* Progress Indicator Dots */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        actStep === 1 ? 'w-8 bg-emerald-400' : 'w-2.5 bg-emerald-400/40'
                      }`}
                    />
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        actStep === 2 ? 'w-8 bg-emerald-400' : actStep > 2 ? 'w-2.5 bg-emerald-400/40' : 'w-2.5 bg-white/20'
                      }`}
                    />
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        actStep === 3 ? 'w-8 bg-emerald-400' : 'w-2.5 bg-white/20'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Activation Card according to Figma Picture 2, 3, or 4 */}
              <div className="bg-[#2D4E47] p-6 sm:p-8 rounded-[24px] shadow-2xl border border-white/10 text-white space-y-5">
                {/* --------------------------------------------------------------------- */}
                {/* PICTURE 2: ACTIVATE ACCOUNT (User inputs Email -> System generates ID) */}
                {/* --------------------------------------------------------------------- */}
                {actStep === 1 && (
                  <>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white">
                        Activate Account
                      </h1>
                      <p className="text-xs text-white/70 mt-1 font-light">
                        Please enter your email to verify and activate your account
                      </p>
                    </div>

                    <form noValidate onSubmit={handleActStep1} className="space-y-4">
                      {/* Role Selection: Employee vs Department Manager */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-medium text-white/80">
                            Account Role / Position Type
                          </label>
                          <span className="text-[10px] text-emerald-300 font-medium">
                            Select access level
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleRoleChange('employee')}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                              actRole === 'employee'
                                ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                : 'bg-[#385B53] border-white/10 text-white/70 hover:bg-[#3d635b] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                                <User className="w-3.5 h-3.5 text-emerald-300" />
                                Employee
                              </span>
                              {actRole === 'employee' && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              )}
                            </div>
                            <span className="text-[10px] text-white/60">
                              Staff & Team Member
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRoleChange('manager')}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                              actRole === 'manager'
                                ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                : 'bg-[#385B53] border-white/10 text-white/70 hover:bg-[#3d635b] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                                Dept Manager
                              </span>
                              {actRole === 'manager' && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              )}
                            </div>
                            <span className="text-[10px] text-white/60">
                              Department Head / Lead
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Department Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-medium text-white/80">
                            Department
                          </label>
                          <span className="text-[10px] text-white/60">
                            Assigned division
                          </span>
                        </div>
                        <select
                          value={actDepartment}
                          onChange={(e) => setActDepartment(e.target.value as any)}
                          className="w-full px-4 py-2.5 bg-[#385B53] rounded-xl text-white text-xs border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all cursor-pointer"
                        >
                          <option value="IT" className="bg-[#2D4E47] text-white">IT (Information Technology)</option>
                          <option value="Engineering" className="bg-[#2D4E47] text-white">Engineering & Tech</option>
                          <option value="Marketing" className="bg-[#2D4E47] text-white">Marketing & Growth</option>
                          <option value="HR" className="bg-[#2D4E47] text-white">HR (Human Resources)</option>
                          <option value="Finance" className="bg-[#2D4E47] text-white">Finance & Accounting</option>
                          <option value="Operations" className="bg-[#2D4E47] text-white">Operations & Logistics</option>
                        </select>
                      </div>

                      {/* Company Email - The primary input filled by the user */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-medium text-white/80">
                            Company Email
                          </label>
                          <span className="text-[10px] text-emerald-300 font-medium">
                            Type your email here
                          </span>
                        </div>
                        <input
                          type="email"
                          value={actEmail}
                          onChange={(e) => handleActEmailChange(e.target.value)}
                          placeholder="Enter your company email here..."
                          className="w-full px-4 py-3 bg-[#385B53] rounded-xl text-white text-xs placeholder:text-white/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                        />
                      </div>

                      {/* Send Credentials Button via EmailJS */}
                      <div className="pt-0.5 pb-1">
                        <button
                          type="button"
                          onClick={handleStep1SendEmail}
                          disabled={isSendingEmailStep1 || !actEmail.trim()}
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 border border-emerald-400/40 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group active:scale-[0.99]"
                        >
                          {isSendingEmailStep1 ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                              <span>Sending Credentials via EmailJS...</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
                              <span>
                                {step1EmailSent
                                  ? `Resend Credentials to ${actEmail.trim()}`
                                  : `Send ID & Password to ${actEmail.trim() ? actEmail.trim() : 'Email'}`}
                              </span>
                            </>
                          )}
                        </button>

                        {/* Success notification banner after sending */}
                        {step1EmailSent && (
                          <div className="mt-2.5 p-3 bg-emerald-950/80 border border-emerald-400/40 rounded-xl text-xs text-emerald-200 animate-in fade-in space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                Credentials Dispatched!
                              </span>
                              <span className="text-[10px] text-white/60">
                                Check your inbox
                              </span>
                            </div>
                            <p className="text-[11px] text-white/80 leading-relaxed">
                              Your {actRole === 'manager' ? 'Department Manager' : 'Employee'} ID and temporary default password have been sent to <strong className="text-white">{step1EmailSent.email}</strong> via EmailJS.
                            </p>
                            {step1EmailSent.employeeId && (
                              <div className="pt-1.5 flex items-center justify-between border-t border-emerald-400/20">
                                <span className="text-[11px] text-emerald-300/90">
                                  Your Assigned {actRole === 'manager' ? 'Department Manager' : 'Employee'} ID: <code className="font-mono font-bold text-white bg-emerald-900/80 px-1.5 py-0.5 rounded border border-emerald-400/30">{step1EmailSent.employeeId}</code>
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Employee / Department Manager ID - Entered by the user */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-medium text-white/80">
                            {actRole === 'manager' ? 'Department Manager ID' : 'Employee ID'}
                          </label>
                          <span className="text-[10px] text-emerald-300 font-medium">
                            Enter ID sent to your email
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={actEmpId}
                            onChange={(e) => {
                              setActEmpId(e.target.value.toUpperCase());
                              if (actError) setActError('');
                            }}
                            placeholder={actRole === 'manager' ? 'Enter Manager ID (e.g. MGR-2026-101)...' : 'Enter Employee ID (e.g. EMP-2026-001)...'}
                            className="w-full px-4 py-3 pl-10 bg-[#385B53] rounded-xl text-white font-mono text-xs placeholder:text-white/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all uppercase"
                          />
                          <KeyRound className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-white/50 mt-1">
                          Enter the official {actRole === 'manager' ? 'Department Manager' : 'Employee'} ID dispatched to your email via EmailJS.
                        </p>
                      </div>

                      {actError && (
                        <div className="p-2.5 bg-rose-900/70 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-1.5 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{actError}</span>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full py-3 bg-[#24413B] hover:bg-[#1D3631] text-white font-bold rounded-xl text-xs tracking-wider transition-all shadow-md cursor-pointer border border-white/10 active:scale-[0.99]"
                        >
                          Activate Account
                        </button>
                      </div>
                    </form>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-white/60 border-t border-white/10">
                      <button
                        onClick={() => {
                          setMode('login');
                          setActError('');
                        }}
                        className="hover:text-emerald-300 transition-colors font-medium underline cursor-pointer"
                      >
                        Already activated? Return to Log In
                      </button>
                    </div>
                  </>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* PICTURE 3: LOGIN ACCOUNT (Employee ID + Default Password)              */}
                {/* --------------------------------------------------------------------- */}
                {actStep === 2 && (
                  <>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white">
                        Login Account
                      </h1>
                      <p className="text-xs text-white/70 mt-1 font-light">
                        Enter your temporary default password to continue
                      </p>
                    </div>

                    <form noValidate onSubmit={handleActStep2} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-medium text-white/80">
                            Employee ID
                          </label>
                          <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                            System Assigned
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={actEmpId}
                            className="w-full px-4 py-3 pl-10 bg-[#2A4841] rounded-xl text-emerald-200 font-mono text-xs border border-white/10 cursor-not-allowed select-all"
                          />
                          <KeyRound className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white/80 mb-1.5">
                          Default Password
                        </label>
                        <div className="relative">
                          <input
                            type={showDefaultPass ? 'text' : 'password'}
                            value={actDefaultPassword}
                            onChange={(e) => {
                              setActDefaultPassword(e.target.value);
                              if (actError) setActError('');
                            }}
                            placeholder="Enter your password here..."
                            className="w-full px-4 py-3 pr-10 bg-[#385B53] rounded-xl text-white text-xs placeholder:text-white/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDefaultPass(!showDefaultPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                          >
                            {showDefaultPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* EmailJS default password dispatch / auto-fill helper */}
                      <div className="p-3 bg-[#385B53]/50 rounded-xl border border-white/10 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-white/70">
                          <span>Need temporary password sent?</span>
                          <button
                            type="button"
                            disabled={isSendingDefaultPass}
                            onClick={() => handleSendDefaultPassword(actEmail || actEmpId)}
                            className="text-emerald-300 hover:text-emerald-200 underline font-medium cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            {isSendingDefaultPass ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Mail className="w-3 h-3" />
                                <span>Send via EmailJS</span>
                              </>
                            )}
                          </button>
                        </div>
                        {emailSuccessMsg && (
                          <div className="p-2 bg-emerald-950/80 rounded-lg border border-emerald-500/30 text-[11px] text-emerald-200 space-y-1 animate-in fade-in">
                            <p>{emailSuccessMsg.text}</p>
                          </div>
                        )}
                      </div>

                      {actError && (
                        <div className="p-2.5 bg-rose-900/70 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-1.5 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{actError}</span>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full py-3 bg-[#24413B] hover:bg-[#1D3631] text-white font-bold rounded-xl text-xs tracking-wider transition-all shadow-md cursor-pointer border border-white/10 active:scale-[0.99]"
                        >
                          Activate Account
                        </button>
                      </div>
                    </form>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-white/60 border-t border-white/10">
                      <button
                        onClick={() => {
                          setActStep(1);
                          setActError('');
                        }}
                        className="hover:text-emerald-300 transition-colors font-medium underline cursor-pointer"
                      >
                        ← Back to Step 1
                      </button>
                      <button
                        onClick={() => {
                          setMode('login');
                          setActError('');
                        }}
                        className="hover:text-emerald-300 transition-colors font-medium underline cursor-pointer"
                      >
                        Return to Log In
                      </button>
                    </div>
                  </>
                )}

                {/* --------------------------------------------------------------------- */}
                {/* PICTURE 4: UPDATE USER CREDENTIALS                                     */}
                {/* (Default Password, Username, Password, Confirm Password -> Save)        */}
                {/* --------------------------------------------------------------------- */}
                {actStep === 3 && (
                  <>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide text-white uppercase">
                        UPDATE USER CREDENTIALS
                      </h1>
                      <p className="text-xs text-white/70 mt-1 font-light">
                        Set your permanent username and new secure password
                      </p>
                    </div>

                    <form noValidate onSubmit={handleActStep3} className="space-y-3.5">
                      {/* Account Role & Department Badge */}
                      <div className="p-3 bg-[#385B53]/60 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider block">
                            Activating Account Role
                          </span>
                          <span className="text-white font-bold flex items-center gap-1.5 mt-0.5">
                            {actRole === 'manager' ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{actDepartment} Department Manager</span>
                              </>
                            ) : (
                              <>
                                <User className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Employee &bull; {actDepartment} Staff</span>
                              </>
                            )}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-md font-mono text-[11px] font-bold">
                          {actEmpId}
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white/80 mb-1">
                          Default Password
                        </label>
                        <div className="relative">
                          <input
                            type={showDefaultPass ? 'text' : 'password'}
                            value={actDefaultPassword}
                            onChange={(e) => {
                              setActDefaultPassword(e.target.value);
                              if (actError) setActError('');
                            }}
                            placeholder="Enter your password here..."
                            className="w-full px-4 py-2.5 pr-10 bg-[#385B53] rounded-xl text-white text-xs placeholder:text-white/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDefaultPass(!showDefaultPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                          >
                            {showDefaultPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white/80 mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          value={actUsername}
                          onChange={(e) => {
                            setActUsername(e.target.value);
                            if (actError) setActError('');
                          }}
                          placeholder="Enter your username here..."
                          className="w-full px-4 py-2.5 bg-[#385B53] rounded-xl text-white text-xs placeholder:text-white/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white/80 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showActPass ? 'text' : 'password'}
                            value={actPassword}
                            onChange={(e) => {
                              setActPassword(e.target.value);
                              if (actError) setActError('');
                            }}
                            placeholder="Enter your password here..."
                            className="w-full px-4 py-2.5 pr-10 bg-[#385B53] rounded-xl text-white text-xs placeholder:text-white/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowActPass(!showActPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                          >
                            {showActPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white/80 mb-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showActConfirmPass ? 'text' : 'password'}
                            value={actConfirmPassword}
                            onChange={(e) => {
                              setActConfirmPassword(e.target.value);
                              if (actError) setActError('');
                            }}
                            placeholder="Enter your password here..."
                            className="w-full px-4 py-2.5 pr-10 bg-[#385B53] rounded-xl text-white text-xs placeholder:text-white/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowActConfirmPass(!showActConfirmPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                          >
                            {showActConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {actError && (
                        <div className="p-2.5 bg-rose-900/70 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-1.5 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{actError}</span>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isActivating}
                          className="w-full py-3 bg-[#24413B] hover:bg-[#1D3631] text-white font-bold rounded-xl text-xs tracking-wider transition-all shadow-md cursor-pointer border border-white/10 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isActivating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                              <span>Saving & Activating...</span>
                            </>
                          ) : (
                            <span>Save</span>
                          )}
                        </button>
                      </div>
                    </form>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-white/60 border-t border-white/10">
                      <button
                        onClick={() => {
                          setActStep(2);
                          setActError('');
                        }}
                        className="hover:text-emerald-300 transition-colors font-medium underline cursor-pointer"
                      >
                        ← Back to Step 2
                      </button>
                      <button
                        onClick={() => {
                          setMode('login');
                          setActError('');
                        }}
                        className="hover:text-emerald-300 transition-colors font-medium underline cursor-pointer"
                      >
                        Return to Log In
                      </button>
                    </div>
                  </>
                )}
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

      {/* Supabase Connection & Configuration Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}
