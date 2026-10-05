import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Clock,
  EyeOff,
  VolumeX,
  Volume2,
  CheckCircle2,
  XCircle,
  Award,
  AlertTriangle,
  Send,
  Trash2,
  RotateCcw,
  FileText,
  KeyRound,
  Eye,
  UserCheck,
  UserX,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  X,
  Mail
} from 'lucide-react';
import KTULogo from './KTULogo';

export interface StudentAccount {
  id: number;
  student_id: string;
  username: string;
  email: string;
  karma_score: number;
  role: 'student' | 'moderator' | 'admin';
  is_suspended: boolean;
  suspension_until?: string;
  is_banned: boolean;
  ban_reason?: string;
  is_shadowbanned?: boolean;
  is_muted?: boolean;
  muted_until?: string;
  is_verified?: boolean;
  is_force_password_reset?: boolean;
  is_sensitive_flagged?: boolean;
  admin_warnings_count?: number;
  admin_notes?: string;
  faculty: string;
  department?: string;
  avatar?: string;
  created_at?: string;
}

export interface ModLogItem {
  id: number;
  admin_username: string;
  action:
    | 'warn'
    | 'delete_content'
    | 'suspend_user'
    | 'ban_user'
    | 'dismiss_report'
    | 'shadowban_user'
    | 'unshadowban_user'
    | 'mute_user'
    | 'unmute_user'
    | 'toggle_verification'
    | 'change_role'
    | 'adjust_karma'
    | 'purge_user_content'
    | 'force_password_reset'
    | 'update_notes';
  target_type: string;
  target_id: number | string;
  reason_given: string;
  timestamp: string;
}

interface AdminUserControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: StudentAccount | null;
  adminUsername: string;
  onUpdateUser: (
    updated: StudentAccount,
    log: Omit<ModLogItem, 'id'>,
    customAction?: string
  ) => void;
  onNukeUserContent?: (username: string) => void;
  onIssueFormalWarning?: (username: string, memo: string, subject: string) => void;
  triggerToast: (msg: string) => void;
}

export default function AdminUserControlModal({
  isOpen,
  onClose,
  user,
  adminUsername,
  onUpdateUser,
  onNukeUserContent,
  onIssueFormalWarning,
  triggerToast,
}: AdminUserControlModalProps) {
  if (!isOpen || !user) return null;

  const [activeTab, setActiveTab] = useState<'sanctions' | 'privileges' | 'warning' | 'nuke' | 'notes'>('sanctions');

  // Form states
  const [suspendDays, setSuspendDays] = useState<number>(7);
  const [suspendReason, setSuspendReason] = useState('Violation of KTU student code of conduct');
  const [banReason, setBanReason] = useState('Gross misconduct, harassment or prohibited commercial activity');
  const [muteHours, setMuteHours] = useState<number>(24);
  const [muteReason, setMuteReason] = useState('Repeated spamming or inflammatory remarks in campus discussions');
  const [karmaDelta, setKarmaDelta] = useState<number>(25);
  const [karmaReason, setKarmaReason] = useState('Campus leadership and academic peer assistance');
  const [warningSubject, setWarningSubject] = useState('Official Notice: KTU Student Code of Conduct Warning');
  const [warningBody, setWarningBody] = useState(
    'You are receiving this formal notice from the Office of the Dean of Student Affairs regarding inappropriate activity on the KTU CampusSocial network. Continued violations will result in immediate suspension.'
  );
  const [staffNote, setStaffNote] = useState(user.admin_notes || '');

  // 1. BAN / UNBAN
  const handleToggleBan = () => {
    const nextBanned = !user.is_banned;
    const updated: StudentAccount = {
      ...user,
      is_banned: nextBanned,
      ban_reason: nextBanned ? banReason : undefined,
      is_suspended: false,
    };
    onUpdateUser(
      updated,
      {
        admin_username: adminUsername,
        action: nextBanned ? 'ban_user' : 'warn',
        target_type: 'user',
        target_id: user.id,
        reason_given: nextBanned
          ? `Permanent account ban: ${banReason}`
          : 'Ban lifted by campus administration',
        timestamp: 'Just now',
      },
      nextBanned ? 'banned' : 'unbanned'
    );
    triggerToast(nextBanned ? `Account @${user.username} has been permanently banned.` : `Ban lifted for @${user.username}.`);
  };

  // 2. SUSPEND / UNSUSPEND
  const handleToggleSuspend = () => {
    const nextSuspended = !user.is_suspended;
    const updated: StudentAccount = {
      ...user,
      is_suspended: nextSuspended,
      suspension_until: nextSuspended ? `In ${suspendDays} days` : undefined,
    };
    onUpdateUser(
      updated,
      {
        admin_username: adminUsername,
        action: 'suspend_user',
        target_type: 'user',
        target_id: user.id,
        reason_given: nextSuspended
          ? `Suspended for ${suspendDays} days: ${suspendReason}`
          : 'Suspension lifted early by administrator',
        timestamp: 'Just now',
      },
      nextSuspended ? 'suspended' : 'unsuspended'
    );
    triggerToast(nextSuspended ? `@${user.username} suspended for ${suspendDays} days.` : `Suspension lifted for @${user.username}.`);
  };

  // 3. MUTE / UNMUTE
  const handleToggleMute = () => {
    const nextMuted = !user.is_muted;
    const until = nextMuted ? `${muteHours}h timeout` : undefined;
    const updated: StudentAccount = {
      ...user,
      is_muted: nextMuted,
      muted_until: until,
    };
    onUpdateUser(
      updated,
      {
        admin_username: adminUsername,
        action: nextMuted ? 'mute_user' : 'unmute_user',
        target_type: 'user',
        target_id: user.id,
        reason_given: nextMuted
          ? `Muted for ${muteHours} hours: ${muteReason}`
          : 'Posting & chat mute removed by moderator',
        timestamp: 'Just now',
      },
      nextMuted ? 'muted' : 'unmuted'
    );
    triggerToast(nextMuted ? `@${user.username} muted for ${muteHours} hours.` : `Mute lifted for @${user.username}.`);
  };

  // 4. SHADOWBAN / UNSHADOWBAN (Classic social media stealth suppression)
  const handleToggleShadowban = () => {
    const nextShadowbanned = !user.is_shadowbanned;
    const updated: StudentAccount = {
      ...user,
      is_shadowbanned: nextShadowbanned,
    };
    onUpdateUser(
      updated,
      {
        admin_username: adminUsername,
        action: nextShadowbanned ? 'shadowban_user' : 'unshadowban_user',
        target_type: 'user',
        target_id: user.id,
        reason_given: nextShadowbanned
          ? 'Shadowbanned: Posts and comments stealthily suppressed from public view.'
          : 'Shadowban removed: Content visibility restored to public.',
        timestamp: 'Just now',
      },
      nextShadowbanned ? 'shadowbanned' : 'unshadowbanned'
    );
    triggerToast(
      nextShadowbanned
        ? `🕵️ @${user.username} is now SHADOWBANNED. Their posts are hidden from all other students.`
        : `Shadowban removed for @${user.username}.`
    );
  };

  // 5. TOGGLE VERIFICATION BADGE
  const handleToggleVerification = () => {
    const nextVerified = user.is_verified === false ? true : false;
    const updated: StudentAccount = {
      ...user,
      is_verified: nextVerified,
    };
    onUpdateUser(
      updated,
      {
        admin_username: adminUsername,
        action: 'toggle_verification',
        target_type: 'user',
        target_id: user.id,
        reason_given: nextVerified
          ? 'Official KTU student verification badge granted by admin.'
          : 'Verification badge revoked due to impersonation or guideline breach.',
        timestamp: 'Just now',
      },
      nextVerified ? 'verified' : 'unverified'
    );
    triggerToast(nextVerified ? `Verified checkmark granted to @${user.username} ✓` : `Verification badge revoked from @${user.username}.`);
  };

  // 6. PROMOTE / DEMOTE ROLE
  const handleSetRole = (role: 'student' | 'moderator' | 'admin') => {
    const updated: StudentAccount = {
      ...user,
      role,
    };
    onUpdateUser(
      updated,
      {
        admin_username: adminUsername,
        action: 'change_role',
        target_type: 'user',
        target_id: user.id,
        reason_given: `Account role updated to ${role.toUpperCase()}`,
        timestamp: 'Just now',
      },
      `role_${role}`
    );
    triggerToast(`@${user.username} role updated to: ${role.toUpperCase()}`);
  };

  // 7. ADJUST KARMA
  const handleApplyKarma = (isPositive: boolean) => {
    const delta = isPositive ? Math.abs(karmaDelta) : -Math.abs(karmaDelta);
    const newKarma = (user.karma_score || 0) + delta;
    const updated: StudentAccount = {
      ...user,
      karma_score: newKarma,
    };
    onUpdateUser(
      updated,
      {
        admin_username: adminUsername,
        action: 'adjust_karma',
        target_type: 'user',
        target_id: user.id,
        reason_given: `${delta > 0 ? '+' : ''}${delta} Karma applied: ${karmaReason}`,
        timestamp: 'Just now',
      },
      'karma_adjusted'
    );
    triggerToast(`Adjusted karma for @${user.username}: ${delta > 0 ? '+' : ''}${delta} (New: ${newKarma})`);
  };

  // 8. FORCE SESSION RESET / PASSWORD INVALIDATION
  const handleForcePasswordReset = () => {
    const nextForced = !user.is_force_password_reset;
    const updated: StudentAccount = {
      ...user,
      is_force_password_reset: nextForced,
    };
    onUpdateUser(
      updated,
      {
        admin_username: adminUsername,
        action: 'force_password_reset',
        target_type: 'user',
        target_id: user.id,
        reason_given: 'Immediate session invalidation / forced credentials reset flagged.',
        timestamp: 'Just now',
      },
      'forced_reset'
    );
    triggerToast(`Session revoked for @${user.username}. They must re-authenticate on next visit.`);
  };

  // 9. ISSUE FORMAL DEAN WARNING
  const handleSendFormalWarning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningBody.trim()) return;
    const warningCount = (user.admin_warnings_count || 0) + 1;
    const updated: StudentAccount = {
      ...user,
      admin_warnings_count: warningCount,
    };
    onUpdateUser(
      updated,
      {
        admin_username: adminUsername,
        action: 'warn',
        target_type: 'user',
        target_id: user.id,
        reason_given: `Strike #${warningCount}: ${warningSubject} - ${warningBody.slice(0, 80)}...`,
        timestamp: 'Just now',
      },
      'warning_issued'
    );
    if (onIssueFormalWarning) {
      onIssueFormalWarning(user.username, warningBody, warningSubject);
    }
    triggerToast(`Official Dean warning #${warningCount} deposited into @${user.username}'s inbox.`);
  };

  // 10. NUKE ALL CONTENT
  const handleNukeContent = () => {
    if (onNukeUserContent) {
      onNukeUserContent(user.username);
    }
    const updated: StudentAccount = {
      ...user,
      karma_score: Math.min(user.karma_score, 0),
    };
    onUpdateUser(
      updated,
      {
        admin_username: adminUsername,
        action: 'purge_user_content',
        target_type: 'user',
        target_id: user.id,
        reason_given: `Purged all public posts, vlogs, comments, and reviews authored by @${user.username}`,
        timestamp: 'Just now',
      },
      'nuked_content'
    );
    triggerToast(`All content authored by @${user.username} has been permanently purged.`);
  };

  // 11. SAVE INTERNAL STAFF DOSSIER NOTE
  const handleSaveStaffNotes = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StudentAccount = {
      ...user,
      admin_notes: staffNote.trim(),
    };
    onUpdateUser(
      updated,
      {
        admin_username: adminUsername,
        action: 'update_notes',
        target_type: 'user',
        target_id: user.id,
        reason_given: 'Updated staff internal conduct dossier notes.',
        timestamp: 'Just now',
      },
      'notes_updated'
    );
    triggerToast(`Internal staff notes saved for @${user.username}.`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Masthead Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <KTULogo size={42} alt="KTU Admin Authority" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Admin Authority Control Center
                </h3>
                <span className="text-[10px] font-mono font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  Super-Admin Access
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Managing verified student: <strong className="text-amber-300">@{user.username}</strong> ({user.student_id})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Live Status Summary Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700">Account Status:</span>
            {user.is_banned ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold font-mono text-[10px] flex items-center gap-1">
                <Ban className="w-3 h-3" /> BANNED
              </span>
            ) : user.is_suspended ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold font-mono text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3" /> SUSPENDED ({user.suspension_until})
              </span>
            ) : user.is_muted ? (
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 font-bold font-mono text-[10px] flex items-center gap-1">
                <VolumeX className="w-3 h-3" /> MUTED ({user.muted_until})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE & HEALTHY
              </span>
            )}

            {user.is_shadowbanned && (
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold font-mono text-[10px] flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> SHADOWBANNED
              </span>
            )}

            {user.is_verified !== false ? (
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold font-mono text-[10px] flex items-center gap-1">
                ✓ VERIFIED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold font-mono text-[10px]">
                UNVERIFIED
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
            <span>Karma: <strong className={user.karma_score < 0 ? 'text-rose-600' : 'text-slate-900'}>{user.karma_score}</strong></span>
            <span>Warnings: <strong className="text-amber-600">{user.admin_warnings_count || 0}</strong></span>
            <span>Role: <strong className="uppercase text-indigo-700">{user.role}</strong></span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-white px-3 pt-2 gap-1 overflow-x-auto text-xs font-bold">
          {[
            { id: 'sanctions', label: '🛑 Sanctions & Bans', icon: ShieldAlert },
            { id: 'privileges', label: '⭐ Roles & Karma', icon: Award },
            { id: 'warning', label: '📢 Dean Notice', icon: AlertTriangle },
            { id: 'nuke', label: '💣 Purge Content', icon: Trash2 },
            { id: 'notes', label: '📝 Staff Dossier', icon: FileText },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`py-2 px-3 rounded-t-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-slate-900">
          
          {/* TAB 1: SANCTIONS & BANS */}
          {activeTab === 'sanctions' && (
            <div className="space-y-4">
              
              {/* SHADOWBAN CONTROL CARD */}
              <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-purple-700" />
                      <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                        Stealth Shadowban
                      </h4>
                      {user.is_shadowbanned && (
                        <span className="px-2 py-0.2 rounded text-[9px] font-black bg-purple-700 text-white">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-purple-900/80 mt-0.5 leading-relaxed">
                      Silently suppresses all memes, vlogs, and comments by @{user.username} from being visible to any other students across KTU feeds. The user is not notified.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleShadowban}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${
                      user.is_shadowbanned
                        ? 'bg-purple-700 hover:bg-purple-800 text-white'
                        : 'bg-white border border-purple-300 text-purple-800 hover:bg-purple-100'
                    }`}
                  >
                    {user.is_shadowbanned ? 'Remove Shadowban' : 'Enable Shadowban'}
                  </button>
                </div>
              </div>

              {/* MUTE CONTROL CARD */}
              <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <VolumeX className="w-4 h-4 text-orange-700" />
                      <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wide">
                        Temporary Mute (Feed & Chat Timeout)
                      </h4>
                      {user.is_muted && (
                        <span className="px-2 py-0.2 rounded text-[9px] font-black bg-orange-600 text-white">
                          MUTED ({user.muted_until})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-orange-900/80 mt-0.5 leading-relaxed">
                      Prevents the student from publishing new posts, uploading 30s stories, commenting on feeds, or sending direct peer messages.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-semibold text-orange-950 text-[11px]">Duration:</span>
                  {[
                    { h: 1, label: '1 Hour' },
                    { h: 24, label: '24 Hours' },
                    { h: 72, label: '3 Days' },
                    { h: 168, label: '7 Days' },
                  ].map((item) => (
                    <button
                      key={item.h}
                      type="button"
                      onClick={() => setMuteHours(item.h)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        muteHours === item.h
                          ? 'bg-orange-600 text-white font-bold'
                          : 'bg-white border border-orange-200 text-orange-900 hover:bg-orange-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className={`ml-auto px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      user.is_muted
                        ? 'bg-slate-800 hover:bg-slate-900 text-white'
                        : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                    }`}
                  >
                    {user.is_muted ? 'Lift Mute' : `Apply ${muteHours}h Mute`}
                  </button>
                </div>
              </div>

              {/* SUSPEND CONTROL CARD */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                        Disciplinary Suspension
                      </h4>
                      {user.is_suspended && (
                        <span className="px-2 py-0.2 rounded text-[9px] font-black bg-amber-600 text-white">
                          SUSPENDED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-900/80 mt-0.5">
                      Locks user out from social network access for a defined duration. Requires Dean incident log entry.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-semibold text-amber-950 text-[11px]">Period:</span>
                    {[3, 7, 14, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setSuspendDays(days)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          suspendDays === days
                            ? 'bg-amber-600 text-white font-bold'
                            : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Official suspension memo reason..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleToggleSuspend}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      user.is_suspended
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                    }`}
                  >
                    {user.is_suspended ? 'Lift Suspension' : `Suspend Account (${suspendDays} Days)`}
                  </button>
                </div>
              </div>

              {/* PERMANENT BAN CARD */}
              <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-rose-700" />
                      <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                        Permanent University Disciplinary Ban
                      </h4>
                      {user.is_banned && (
                        <span className="px-2 py-0.2 rounded text-[9px] font-black bg-rose-700 text-white">
                          BANNED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-rose-900/80 mt-0.5">
                      Completely terminates access to KTU CampusSocial. Student credential will be permanently rejected on login.
                    </p>
                  </div>
                </div>

                {!user.is_banned && (
                  <input
                    type="text"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Reason for permanent expulsion/ban from social platform..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-xl focus:outline-none"
                  />
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleToggleBan}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      user.is_banned
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                    }`}
                  >
                    {user.is_banned ? 'Revoke Ban & Restore Access' : 'Permanently Ban Account'}
                  </button>
                </div>
              </div>

              {/* FORCE SESSION INVALIDATION */}
              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <KeyRound className="w-4 h-4 text-slate-700" />
                    <span>Force Password Reset / Session Invalidation</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Revoke all active browser sessions immediately if account is suspected to be compromised.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleForcePasswordReset}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  {user.is_force_password_reset ? 'Reset Flagged ✓' : 'Revoke Sessions'}
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: ROLES, BADGES & KARMA */}
          {activeTab === 'privileges' && (
            <div className="space-y-4">
              
              {/* VERIFICATION BADGE TOGGLE */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>Official Campus Verification Badge (Blue Checkmark)</span>
                  </div>
                  <p className="text-[11px] text-indigo-900/80 mt-0.5">
                    Grants or revokes the blue verification checkmark shown across feeds, stories, and peer directories.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleVerification}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    user.is_verified !== false
                      ? 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                  }`}
                >
                  {user.is_verified !== false ? 'Revoke Badge' : 'Grant Verified Badge ✓'}
                </button>
              </div>

              {/* ROLE HIERARCHY */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Account Authorization Level & Role
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'student',
                      label: 'Verified Student',
                      sub: 'Standard access to feeds, stories, radio, and peer chats',
                    },
                    {
                      id: 'moderator',
                      label: 'Campus Moderator',
                      sub: 'Can review safety reports, issue warnings, and delete flagged content',
                    },
                    {
                      id: 'admin',
                      label: 'Dean / Administrator',
                      sub: 'Full system control, bans, audit logs, and broadcast access',
                    },
                  ].map((r) => {
                    const isSelected = user.role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSetRole(r.id as any)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                          <span>{r.label}</span>
                          {isSelected && <span className="text-indigo-600">✓</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">{r.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* KARMA SCORE ADJUSTMENT */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Karma Reputation Score Adjustment
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                    Current: {user.karma_score} Points
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-600 font-semibold">Points Delta:</span>
                    {[10, 25, 50, 100].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setKarmaDelta(pts)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          karmaDelta === pts
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        ±{pts}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={karmaReason}
                    onChange={(e) => setKarmaReason(e.target.value)}
                    placeholder="Reason for karma grant or penalty..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleApplyKarma(false)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Penalize -{karmaDelta} Karma</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyKarma(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Reward +{karmaDelta} Karma</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: FORMAL DEAN WARNING & STRIKES */}
          {activeTab === 'warning' && (
            <form onSubmit={handleSendFormalWarning} className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-950 uppercase">
                    Official Disciplinary Strikes: {user.admin_warnings_count || 0}
                  </h4>
                  <p className="text-[11px] text-amber-900/80 mt-0.5">
                    Formal notices are signed by the Directorate of Student Affairs and deposited directly into the student's message inbox.
                  </p>
                </div>
                <span className="text-2xl font-black text-amber-700 font-mono">
                  Strike #{(user.admin_warnings_count || 0) + 1}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warning Notice Subject:
                </label>
                <input
                  type="text"
                  required
                  value={warningSubject}
                  onChange={(e) => setWarningSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Memorandum Body:
                </label>
                <textarea
                  rows={4}
                  required
                  value={warningBody}
                  onChange={(e) => setWarningBody(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Issue Formal Notice to @{user.username}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: NUKE & PURGE ALL USER CONTENT */}
          {activeTab === 'nuke' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                  <span>Bulk Content Wipeout ("Nuke User Content")</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  This administrative operation permanently deletes all campus memes, 30s micro-vlogs, comments, aux battle tracks, and course reviews ever published by <strong className="font-bold">@{user.username}</strong> across the platform.
                </p>
                <p className="text-[11px] text-rose-700 font-semibold">
                  ⚠️ This action cannot be reversed and is immediately audited in the KTU Student Affairs security log.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNukeContent}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Execute Content Wipe for @{user.username}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STAFF DOSSIER NOTES */}
          {activeTab === 'notes' && (
            <form onSubmit={handleSaveStaffNotes} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confidential Staff & Proctor Conduct Notes:
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Visible ONLY to campus administrators and safety moderators. Use for tracking mid-sem incidents, hall disputes, or warnings.
                </p>
                <textarea
                  rows={5}
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  placeholder="e.g. Student was reported for unapproved commercial flyer posting in FOE; verbal guidance provided on Oct 2nd."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Save Staff Dossier Notes</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer Bar */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 font-mono">
            KTU Security & Disciplinary Protocol v4.2
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer transition-colors"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
