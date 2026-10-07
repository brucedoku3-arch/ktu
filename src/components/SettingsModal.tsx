import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Bell,
  AlertTriangle,
  Check,
  LogOut,
  UserX,
  Building,
} from 'lucide-react';
import { CurrentStudentUser } from '../App';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentStudentUser;
  onUpdateUser: (updatedData: Partial<CurrentStudentUser>) => void;
  onDeactivateAccount: () => void;
  triggerToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onDeactivateAccount,
  triggerToast,
}) => {
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Privacy & Visibility: strictly 'campus' or 'owner' (no guest/public)
  const [profileVisibility, setProfileVisibility] = useState<'campus' | 'owner'>(() => {
    const raw = (currentUser as any).profile_visibility;
    return raw === 'owner' || raw === 'private' ? 'owner' : 'campus';
  });

  // Notification Preferences
  const [notifyEmail, setNotifyEmail] = useState<boolean>(
    (currentUser as any).notify_email !== undefined ? (currentUser as any).notify_email : true
  );
  const [notifyInApp, setNotifyInApp] = useState<boolean>(
    (currentUser as any).notify_in_app !== undefined ? (currentUser as any).notify_in_app : true
  );

  // Deactivate confirmation dialog state
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // Reset fields on modal open
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      const raw = (currentUser as any).profile_visibility;
      setProfileVisibility(raw === 'owner' || raw === 'private' ? 'owner' : 'campus');
      setNotifyEmail((currentUser as any).notify_email !== undefined ? (currentUser as any).notify_email : true);
      setNotifyInApp((currentUser as any).notify_in_app !== undefined ? (currentUser as any).notify_in_app : true);
      setShowDeactivateConfirm(false);
      // Ensure light mode is strictly maintained
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ktu_theme', 'light');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    // Password validation (if user entered password fields)
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        triggerToast('Current password is required to update your password.');
        return;
      }
      if (newPassword.length < 6) {
        triggerToast('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        triggerToast('New password and confirmation do not match.');
        return;
      }
    }

    // Apply updates (email is permanent and cannot be modified)
    const updates: any = {
      profile_visibility: profileVisibility,
      notify_email: notifyEmail,
      notify_in_app: notifyInApp,
    };

    onUpdateUser(updates);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    triggerToast('Settings updated successfully! ✓');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-2xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span>Settings</span>
              </h2>
              <p className="text-xs text-slate-500">
                Essential account, privacy & notification preferences
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSaveSettings} className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* 1. ACCOUNT SETTINGS (Permanent Campus Email & Password Change) */}
          <section className="space-y-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Account Credentials</span>
            </div>

            {/* Permanent Campus Email Address */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Campus Email Address
                </label>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 border border-slate-300/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-500" /> Permanent
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  readOnly
                  disabled
                  value={currentUser.email}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-600 font-medium cursor-not-allowed select-all"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Official institutional email registered at signup. Permanent address linked to Student ID ({currentUser.student_id}).
              </span>
            </div>

            {/* Password Fields */}
            <div className="pt-2 border-t border-slate-200/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Change Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>

              <div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current Password (leave blank if keeping)"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (min 6 chars)"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                Leave password fields blank if you do not want to change your password.
              </span>
            </div>
          </section>

          {/* 2. PROFILE VISIBILITY & PRIVACY (Campus Only vs Only Me / Owner) */}
          <section className="space-y-2.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Profile Visibility & Privacy</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: Campus Only */}
              <button
                type="button"
                onClick={() => setProfileVisibility('campus')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  profileVisibility === 'campus'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Campus Only</span>
                  </span>
                  {profileVisibility === 'campus' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Visible strictly to enrolled, verified KTU students & community.
                </p>
              </button>

              {/* Option 2: Only Me (Owner) */}
              <button
                type="button"
                onClick={() => setProfileVisibility('owner')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  profileVisibility === 'owner'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Only Me (Owner)</span>
                  </span>
                  {profileVisibility === 'owner' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Strictly private. Hidden from all other students and users.
                </p>
              </button>
            </div>
          </section>

          {/* 3. NOTIFICATION PREFERENCES (Toggle Email / In-App alerts) */}
          <section className="space-y-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Notification Preferences</span>
            </div>

            {/* Email Alerts Toggle */}
            <div className="flex items-center justify-between gap-3 py-1">
              <div>
                <span className="block text-xs sm:text-sm font-semibold text-slate-900">
                  Email Alerts
                </span>
                <span className="block text-[11px] text-slate-500">
                  Official announcements, exams timetable & account alerts
                </span>
              </div>
              <button
                type="button"
                onClick={() => setNotifyEmail(!notifyEmail)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifyEmail ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={notifyEmail}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    notifyEmail ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* In-App Alerts Toggle */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60 py-1">
              <div>
                <span className="block text-xs sm:text-sm font-semibold text-slate-900">
                  In-App & DM Alerts
                </span>
                <span className="block text-[11px] text-slate-500">
                  Push banners when classmates message you or mention your posts
                </span>
              </div>
              <button
                type="button"
                onClick={() => setNotifyInApp(!notifyInApp)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifyInApp ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={notifyInApp}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    notifyInApp ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* 4. DELETE / DEACTIVATE ACCOUNT BUTTON */}
          <section className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Danger Zone</span>
            </div>
            <p className="text-[11px] text-rose-700 mb-3">
              Deactivating your account will conceal your student profile, suspend active sessions, and log you out.
            </p>
            <button
              type="button"
              onClick={() => setShowDeactivateConfirm(true)}
              className="w-full py-2.5 px-4 bg-white border border-rose-300 hover:bg-rose-600 hover:text-white text-rose-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
            >
              <UserX className="w-4 h-4" />
              <span>Deactivate / Delete Account</span>
            </button>
          </section>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Deactivation */}
      {showDeactivateConfirm && (
        <div
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowDeactivateConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Deactivate Account?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to deactivate your KTU account (@{currentUser.username})? You will be signed out immediately and your profile will be hidden.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeactivateConfirm(false);
                  onDeactivateAccount();
                }}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Deactivate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
