'use client';

import React, { useState } from 'react';
import { useEMS } from '../../context/EMSContext';
import {
  User,
  Shield,
  Bell,
  Edit2,
  Check,
  Smartphone,
  Lock,
  X,
  QrCode,
} from 'lucide-react';

export function EmployeeSettings() {
  const {
    currentUser,
    updateUserProfile,
    changePassword,
    toggle2FA,
    updateSMSPhone,
    addToast,
  } = useEMS();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'notification'>('profile');

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(currentUser?.firstName || 'James');
  const [lastName, setLastName] = useState(currentUser?.lastName || 'Pantas');
  const [email, setEmail] = useState(currentUser?.email || 'james@gmail.com');
  const [phone, setPhone] = useState(currentUser?.phone || '+1 (555) 382-9912');
  const [bio, setBio] = useState(currentUser?.bio || '');

  // Password update state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // 2FA / SMS Modal
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsPhone, setSmsPhone] = useState(currentUser?.smsRecoveryPhone || '0912-345-6789');

  if (!currentUser) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(currentUser.id, {
      firstName,
      lastName,
      email,
      phone,
      bio,
    });
    setIsEditingProfile(false);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPass.length < 6) {
      setPassError('Password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('Passwords do not match.');
      return;
    }

    const res = changePassword(currentUser.id, currentPass, newPass);
    if (!res.success) {
      setPassError(res.error || 'Password update failed.');
    } else {
      setPassSuccess('Password updated successfully!');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#CDE0DA] animate-in fade-in duration-200">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Sub-Menu Navigation (3 Cols) - Figma Pages 9 & 10 */}
        <div className="md:col-span-3 space-y-1 border-b md:border-b-0 md:border-r border-[#E7EFEA] pb-4 md:pb-0 md:pr-4">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left transition-all ${
              activeSubTab === 'profile'
                ? 'bg-[#4A7268] text-white shadow-sm'
                : 'text-[#486E64] hover:bg-[#F2F7F5]'
            }`}
          >
            My profile
          </button>
          <button
            onClick={() => setActiveSubTab('security')}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left transition-all ${
              activeSubTab === 'security'
                ? 'bg-[#4A7268] text-white shadow-sm'
                : 'text-[#486E64] hover:bg-[#F2F7F5]'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveSubTab('notification')}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-left transition-all ${
              activeSubTab === 'notification'
                ? 'bg-[#4A7268] text-white shadow-sm'
                : 'text-[#486E64] hover:bg-[#F2F7F5]'
            }`}
          >
            Notification
          </button>
        </div>

        {/* Right Content Area (9 Cols) */}
        <div className="md:col-span-9">
          {activeSubTab === 'profile' ? (
            /* Figma Page 9: My Profile */
            <div className="space-y-6">
              {/* Profile Header Row */}
              <div className="flex items-center justify-between p-4 bg-[#F2F7F5] rounded-2xl border border-[#D3E5DE]">
                <div className="flex items-center gap-4">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.firstName}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-[#4A7268]"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-[#1C3630]">
                      {currentUser.firstName} {currentUser.lastName}
                    </h3>
                    <p className="text-xs text-[#52776E]">{currentUser.position}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="p-2 bg-white text-[#3D6B5F] hover:bg-[#EBF3F0] rounded-xl shadow-sm border border-[#D3E5DE] transition-all cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Personal Information Section */}
              <div className="p-6 bg-[#F9FBFB] rounded-2xl border border-[#DCE8E4] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7EFEA]">
                  <h4 className="text-xs font-bold text-[#1C3630]">Personal Information</h4>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-xs font-semibold text-[#3D6B5F] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isEditingProfile ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-[#486B62] mb-1">First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#D3E5DE] rounded-xl text-[#1C3630] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#486B62] mb-1">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#D3E5DE] rounded-xl text-[#1C3630] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-[#486B62] mb-1">Email address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#D3E5DE] rounded-xl text-[#1C3630] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#486B62] mb-1">Phone</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#D3E5DE] rounded-xl text-[#1C3630] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#486B62] mb-1">Bio</label>
                      <input
                        type="text"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#D3E5DE] rounded-xl text-[#1C3630] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#2A8257] hover:bg-[#216B47] text-white rounded-xl font-bold shadow-md cursor-pointer"
                    >
                      Save Information
                    </button>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs text-[#2F4D46]">
                    <div>
                      <p className="text-[10px] text-[#7E9F97] font-semibold">First Name</p>
                      <p className="font-bold text-[#1C3630] mt-0.5">{firstName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#7E9F97] font-semibold">Last Name</p>
                      <p className="font-bold text-[#1C3630] mt-0.5">{lastName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#7E9F97] font-semibold">Email address</p>
                      <p className="font-bold text-[#1C3630] mt-0.5">{email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#7E9F97] font-semibold">Phone</p>
                      <p className="font-bold text-[#1C3630] mt-0.5">{phone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-[#7E9F97] font-semibold">Bio</p>
                      <p className="font-bold text-[#1C3630] mt-0.5">{bio}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeSubTab === 'security' ? (
            /* Figma Page 10: Security */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Password Form (8 Cols) */}
              <div className="lg:col-span-8 p-6 bg-[#F9FBFB] rounded-2xl border border-[#DCE8E4] space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-[#1C3630]">Password</h4>
                  <p className="text-[11px] text-[#6E8F87] mt-0.5">
                    Please enter your current password to change your password.
                  </p>
                </div>

                <form onSubmit={handlePasswordUpdate} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#486B62] mb-1">Your Password</label>
                    <input
                      type="password"
                      required
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="Current Password"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D3E5DE] rounded-xl text-[#1C3630] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#486B62] mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Enter your new password"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D3E5DE] rounded-xl text-[#1C3630] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#486B62] mb-1">
                      Re-enter your new password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Confirm Password"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D3E5DE] rounded-xl text-[#1C3630] focus:outline-none"
                    />
                  </div>

                  {passError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs">
                      {passError}
                    </div>
                  )}

                  {passSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs">
                      {passSuccess}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPass('');
                        setNewPass('');
                        setConfirmPass('');
                      }}
                      className="px-4 py-2 bg-[#EBF1EE] hover:bg-[#D8E5E0] text-[#3D6B5F] rounded-xl font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#2D4E47] hover:bg-[#203B35] text-white rounded-xl font-bold shadow-md cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                </form>
              </div>

              {/* Right: 2FA and SMS Recovery Cards (4 Cols) - Figma Page 10 */}
              <div className="lg:col-span-4 space-y-4">
                {/* Two Factor Authentication */}
                <div className="p-4 bg-[#F9FBFB] rounded-2xl border border-[#DCE8E4] space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#3D6B5F]" />
                    <h5 className="font-bold text-[#1C3630]">Two Factor Authentication</h5>
                  </div>
                  <p className="text-[10px] text-[#7A9E96]">
                    Adds an extra layer of security to your account
                  </p>
                  <button
                    onClick={() => toggle2FA(currentUser.id)}
                    className={`w-full py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      currentUser.twoFactorEnabled
                        ? 'bg-[#FDE2DC] text-[#D9381E] border border-[#F8D2C9]'
                        : 'bg-[#2A8257] text-white shadow-md'
                    }`}
                  >
                    {currentUser.twoFactorEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>

                {/* SMS Recovery */}
                <div className="p-4 bg-[#F9FBFB] rounded-2xl border border-[#DCE8E4] space-y-3 text-xs">
                  <h5 className="font-bold text-[#1C3630]">SMS Recovery</h5>
                  <p className="text-[10px] text-[#7A9E96]">
                    Your phone number: <strong className="text-[#1C3630] font-mono">{smsPhone}</strong>
                  </p>
                  <button
                    onClick={() => setSmsModalOpen(true)}
                    className="w-full py-2 bg-[#EBF1EE] hover:bg-[#D8E5E0] text-[#3D6B5F] font-bold rounded-xl border border-[#D3E5DE] cursor-pointer"
                  >
                    Setup
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Notification Tab (Figma Page 10) */
            <div className="p-6 bg-[#F9FBFB] rounded-2xl border border-[#DCE8E4] space-y-4 text-xs text-[#2C4A42]">
              <h4 className="font-bold text-sm text-[#1C3630]">Notification Preferences</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#2A8257] w-4 h-4" />
                  <span>Email notifications for assigned tasks</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#2A8257] w-4 h-4" />
                  <span>Alerts for company and department announcements</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#2A8257] w-4 h-4" />
                  <span>Leave request status approval updates</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SMS Setup Modal */}
      {smsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-[#CDE0DA] space-y-3 text-xs">
            <h4 className="text-sm font-bold text-[#1C3630]">Setup SMS Recovery Phone</h4>
            <input
              type="text"
              value={smsPhone}
              onChange={(e) => setSmsPhone(e.target.value)}
              className="w-full px-3 py-2 bg-[#F2F7F5] border border-[#D3E5DE] rounded-xl text-[#1C3630]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSmsModalOpen(false)}
                className="px-3 py-1.5 bg-[#EEF4F2] text-[#41635B] rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateSMSPhone(currentUser.id, smsPhone);
                  setSmsModalOpen(false);
                }}
                className="px-3 py-1.5 bg-[#2A8257] text-white rounded-xl font-bold cursor-pointer"
              >
                Save Phone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
