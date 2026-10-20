'use client';

import React, { useState } from 'react';
import { useEMS } from '../../context/EMSContext';
import { Sparkles, X, Eye, EyeOff, ShieldCheck, Mail, CheckCircle2, Loader2, User, KeyRound, AlertCircle } from 'lucide-react';

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
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Ensure login and activation fields are completely blank by default and on mode change
  React.useEffect(() => {
    if (mode === 'login') {
      setLoginId('');
      setLoginPassword('');
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
        });
      }
    } catch {
      setLoginError('Failed to dispatch default password.');
    } finally {
      setIsSendingDefaultPass(false);
    }
  };

  // Multi-step Activation form state (Figma Pictures 2, 3 & 4)
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

  // Step 1: "Activate Account" (User inputs Company Email & Received ID)
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
      setActError('This account is already activated. Please log in directly.');
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
      setActError('Incorrect default password. Please check your credentials or request a new one.');
      return;
    }

    if (!actUsername) {
      setActUsername(employee?.username || actEmail.trim().split('@')[0]);
    }

    setActStep(3);
  };

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
      setActError('Password must be at least 6 characters.');
      return;
    }
    if (actPassword === actDefaultPassword) {
      setActError('New password cannot be the same as your default temporary password.');
      return;
    }
    if (actPassword !== actConfirmPassword) {
      setActError('Passwords do not match.');
      return;
    }

    const res = await activateAccount(actEmpId, actEmail, actUsername, actPassword, actRole, actDepartment);
    if (!res.success) {
      setActError(res.error || 'Activation failed.');
    } else {
      setMode('login');
      setLoginId('');
      setLoginPassword('');
      setActStep(1);
      setActRole('employee');
      setActDepartment('IT');
      setActError('');
    }
  };

  // Forgot password state
  const [forgotId, setForgotId] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotError, setForgotError] = useState('');

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

  if (!isOpen) return null;

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

                <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1.5">
                      Company Email / Employee ID
                    </label>
                    <input
                      type="text"
                      name="modal_user_id"
                      autoComplete="off"
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
                        name="modal_user_password"
                        autoComplete="new-password"
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
                    Activate Account
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
            /* ========================================================================= */
            /* Multi-Step Account Activation Modal Flow (Figma Pictures 2, 3 & 4)        */
            /* ========================================================================= */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left: Skyscraper Image with step indicators */}
              <div className="h-full min-h-[400px] rounded-[24px] overflow-hidden shadow-2xl relative border border-white/10 hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80"
                  alt="Modern Corporate Building"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#27413B]/90 via-[#27413B]/40 to-transparent flex flex-col justify-end p-6">
                  <div className="text-white space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Account Activation</p>
                    <p className="text-sm font-semibold">
                      {actStep === 1
                        ? 'Step 1 of 3 • Verification'
                        : actStep === 2
                        ? 'Step 2 of 3 • Default Password'
                        : 'Step 3 of 3 • Update Credentials'}
                    </p>
                    <p className="text-xs text-white/70 font-light">
                      {actStep === 1
                        ? 'Enter your Company Email. Your unique Employee ID will be automatically generated by the system.'
                        : actStep === 2
                        ? 'Log in with your temporary default password.'
                        : 'Set your new personal username and password.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/10">
                    <div className={`h-1.5 rounded-full transition-all ${actStep === 1 ? 'w-6 bg-emerald-400' : 'w-2 bg-emerald-400/40'}`} />
                    <div className={`h-1.5 rounded-full transition-all ${actStep === 2 ? 'w-6 bg-emerald-400' : 'w-2 bg-white/20'}`} />
                    <div className={`h-1.5 rounded-full transition-all ${actStep === 3 ? 'w-6 bg-emerald-400' : 'w-2 bg-white/20'}`} />
                  </div>
                </div>
              </div>

              {/* Right: Activation Form Card */}
              <div className="bg-[#2D4E47] p-6 sm:p-8 rounded-[24px] shadow-xl border border-white/10 text-white space-y-4">
                {/* Step 1: Activate Account */}
                {actStep === 1 && (
                  <>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white">Activate Account</h1>
                      <p className="text-xs text-white/70 mt-1 font-light">
                        Please enter your email to verify and activate your account
                      </p>
                    </div>

                    <form onSubmit={handleActStep1} className="space-y-3.5">
                      {/* Role Selection: Employee vs Department Manager */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-white/80">
                            Account Role / Position Type
                          </label>
                          <span className="text-[10px] text-emerald-300 font-medium">
                            Select access level
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleRoleChange('employee')}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                              actRole === 'employee'
                                ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
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
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                              actRole === 'manager'
                                ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
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
                        <div className="flex items-center justify-between mb-1">
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
                          className="w-full px-4 py-2 bg-[#385B53] rounded-xl text-white text-xs border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all cursor-pointer"
                        >
                          <option value="IT" className="bg-[#2D4E47] text-white">IT (Information Technology)</option>
                          <option value="Engineering" className="bg-[#2D4E47] text-white">Engineering & Tech</option>
                          <option value="Marketing" className="bg-[#2D4E47] text-white">Marketing & Growth</option>
                          <option value="HR" className="bg-[#2D4E47] text-white">HR (Human Resources)</option>
                          <option value="Finance" className="bg-[#2D4E47] text-white">Finance & Accounting</option>
                          <option value="Operations" className="bg-[#2D4E47] text-white">Operations & Logistics</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
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
                          className="w-full px-4 py-2.5 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      </div>

                      {/* Send Credentials Button via EmailJS */}
                      <div className="pt-0.5 pb-1">
                        <button
                          type="button"
                          onClick={handleStep1SendEmail}
                          disabled={isSendingEmailStep1 || !actEmail.trim()}
                          className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 border border-emerald-400/40 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group active:scale-[0.99]"
                        >
                          {isSendingEmailStep1 ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
                              <span>Sending Credentials via EmailJS...</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5 text-emerald-300 group-hover:scale-110 transition-transform" />
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
                          <div className="mt-2 p-2.5 bg-emerald-950/80 border border-emerald-400/40 rounded-xl text-xs text-emerald-200 animate-in fade-in space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1.5 text-emerald-300 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                Credentials Dispatched!
                              </span>
                              <span className="text-[9px] text-white/60">
                                Check inbox
                              </span>
                            </div>
                            <p className="text-[10px] text-white/80 leading-relaxed">
                              Your {actRole === 'manager' ? 'Department Manager' : 'Employee'} ID and temporary default password have been sent to <strong className="text-white">{step1EmailSent.email}</strong> via EmailJS.
                            </p>
                            {step1EmailSent.employeeId && (
                              <div className="pt-1.5 flex items-center justify-between border-t border-emerald-400/20">
                                <span className="text-[10px] text-emerald-300/90">
                                  Your Assigned {actRole === 'manager' ? 'Department Manager' : 'Employee'} ID: <code className="font-mono font-bold text-white bg-emerald-900/80 px-1 py-0.5 rounded border border-emerald-400/30">{step1EmailSent.employeeId}</code>
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-white/80">
                            {actRole === 'manager' ? 'Department Manager ID' : 'Employee ID'}
                          </label>
                          <span className="text-[10px] text-emerald-300 font-medium">
                            Enter ID sent to your email
                          </span>
                        </div>
                        <input
                          type="text"
                          value={actEmpId}
                          onChange={(e) => {
                            setActEmpId(e.target.value.toUpperCase());
                            if (actError) setActError('');
                          }}
                          placeholder={actRole === 'manager' ? 'Enter Manager ID (e.g. MGR-2026-101)...' : 'Enter Employee ID (e.g. EMP-2026-001)...'}
                          className="w-full px-4 py-2.5 bg-[#385B53] border border-white/10 rounded-xl text-white font-mono text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 uppercase"
                        />
                        <p className="text-[10px] text-white/50 mt-1">
                          Enter the official {actRole === 'manager' ? 'Department Manager' : 'Employee'} ID dispatched to your email via EmailJS.
                        </p>
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
                          Activate Account
                        </button>
                      </div>
                    </form>

                    <div className="text-center pt-1 border-t border-white/10">
                      <button
                        onClick={() => {
                          setMode('login');
                          setActError('');
                        }}
                        className="text-xs text-white/70 hover:text-emerald-300 underline"
                      >
                        Already activated? Return to Log In
                      </button>
                    </div>
                  </>
                )}

                {/* Step 2: Login Account */}
                {actStep === 2 && (
                  <>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-white">Login Account</h1>
                      <p className="text-xs text-white/70 mt-1 font-light">
                        Enter your temporary default password to authenticate
                      </p>
                    </div>

                    <form onSubmit={handleActStep2} className="space-y-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-white/80">
                            Employee ID
                          </label>
                          <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                            System Assigned
                          </span>
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={actEmpId}
                          className="w-full px-4 py-2.5 bg-[#2A4841] border border-white/10 rounded-xl text-emerald-200 font-mono text-xs cursor-not-allowed select-all"
                        />
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
                            className="w-full px-4 py-2.5 pr-10 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDefaultPass(!showDefaultPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                          >
                            {showDefaultPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
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
                          Activate Account
                        </button>
                      </div>
                    </form>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-white/10 text-white/70">
                      <button
                        onClick={() => {
                          setActStep(1);
                          setActError('');
                        }}
                        className="hover:text-emerald-300 underline"
                      >
                        ← Back to Step 1
                      </button>
                      <button
                        onClick={() => {
                          setMode('login');
                          setActError('');
                        }}
                        className="hover:text-emerald-300 underline"
                      >
                        Return to Log In
                      </button>
                    </div>
                  </>
                )}

                {/* Step 3: UPDATE USER CREDENTIALS */}
                {actStep === 3 && (
                  <>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide text-white uppercase">UPDATE USER CREDENTIALS</h1>
                      <p className="text-xs text-white/70 mt-1 font-light">
                        Set your personal username and new secure password
                      </p>
                    </div>

                    <form onSubmit={handleActStep3} className="space-y-3">
                      {/* Account Role & Department Badge */}
                      <div className="p-2.5 bg-[#385B53]/60 rounded-xl border border-white/10 flex items-center justify-between text-xs">
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
                            className="w-full px-4 py-2 pr-10 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDefaultPass(!showDefaultPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
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
                          className="w-full px-4 py-2 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                            className="w-full px-4 py-2 pr-10 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                        <div className="relative">
                          <input
                            type={showActConfirmPass ? 'text' : 'password'}
                            value={actConfirmPassword}
                            onChange={(e) => {
                              setActConfirmPassword(e.target.value);
                              if (actError) setActError('');
                            }}
                            placeholder="Enter your password here..."
                            className="w-full px-4 py-2 pr-10 bg-[#385B53] border border-white/10 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowActConfirmPass(!showActConfirmPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                          >
                            {showActConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
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
                          Save
                        </button>
                      </div>
                    </form>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-white/10 text-white/70">
                      <button
                        onClick={() => {
                          setActStep(2);
                          setActError('');
                        }}
                        className="hover:text-emerald-300 underline"
                      >
                        ← Back to Step 2
                      </button>
                      <button
                        onClick={() => {
                          setMode('login');
                          setActError('');
                        }}
                        className="hover:text-emerald-300 underline"
                      >
                        Return to Log In
                      </button>
                    </div>
                  </>
                )}
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
