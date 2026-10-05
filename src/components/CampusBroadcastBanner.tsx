import React, { useState } from 'react';
import {
  AlertTriangle,
  Info,
  Radio,
  CheckCircle2,
  Bell,
  X,
  Edit3,
  Shield,
  Send,
  Sparkles
} from 'lucide-react';
import KTULogo from './KTULogo';

export interface BroadcastAlertItem {
  id: string;
  title: string;
  message: string;
  severity: 'emergency' | 'advisory' | 'official' | 'info';
  active: boolean;
  dismissible: boolean;
  created_at: string;
  author: string;
}

interface CampusBroadcastBannerProps {
  broadcast: BroadcastAlertItem | null;
  isAdmin: boolean;
  onUpdateBroadcast: (updated: BroadcastAlertItem | null) => void;
  triggerToast: (msg: string) => void;
}

export default function CampusBroadcastBanner({
  broadcast,
  isAdmin,
  onUpdateBroadcast,
  triggerToast,
}: CampusBroadcastBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);

  // Editor states
  const [titleInput, setTitleInput] = useState(broadcast?.title || 'KTU Campus Safety & Academic Advisory');
  const [messageInput, setMessageInput] = useState(
    broadcast?.message ||
      'All mid-semester examinations scheduled for CCB Complex Hall 2 have been relocated to FOE Block B. Please arrive 15 minutes before the session.'
  );
  const [severityInput, setSeverityInput] = useState<'emergency' | 'advisory' | 'official' | 'info'>(
    broadcast?.severity || 'official'
  );
  const [dismissibleInput, setDismissibleInput] = useState(broadcast?.dismissible ?? true);
  const [activeInput, setActiveInput] = useState(broadcast?.active ?? true);

  if (!broadcast || !broadcast.active || (isDismissed && broadcast.dismissible)) {
    if (!isAdmin) return null;
    // Admins see a small trigger pill to activate a campus broadcast
    return (
      <div className="w-full bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-500"></span>
          <span>Campus Broadcast System: <strong className="text-slate-400">Inactive / Standby</strong></span>
        </div>
        <button
          type="button"
          onClick={() => setShowEditorModal(true)}
          className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer bg-slate-800 px-2.5 py-0.5 rounded-md"
        >
          <Radio className="w-3 h-3" />
          <span>Broadcast Live Alert &rarr;</span>
        </button>

        {showEditorModal && renderEditorModal()}
      </div>
    );
  }

  const severityStyles = {
    emergency: {
      bg: 'bg-rose-600',
      border: 'border-rose-700',
      text: 'text-white',
      badge: 'bg-white text-rose-700',
      icon: AlertTriangle,
      label: 'EMERGENCY CAMPUS ALERT',
    },
    advisory: {
      bg: 'bg-amber-500',
      border: 'border-amber-600',
      text: 'text-slate-950',
      badge: 'bg-slate-950 text-amber-300',
      icon: Bell,
      label: 'ACADEMIC & CAMPUS ADVISORY',
    },
    official: {
      bg: 'bg-indigo-900',
      border: 'border-indigo-950',
      text: 'text-white',
      badge: 'bg-amber-400 text-slate-950',
      icon: Shield,
      label: 'DIRECTORATE OF STUDENT AFFAIRS',
    },
    info: {
      bg: 'bg-emerald-700',
      border: 'border-emerald-800',
      text: 'text-white',
      badge: 'bg-white text-emerald-800',
      icon: Info,
      label: 'SRC STUDENT WELFARE NOTICE',
    },
  }[broadcast.severity];

  const Icon = severityStyles.icon;

  function renderEditorModal() {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
        onClick={() => setShowEditorModal(false)}
      >
        <div
          className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <KTULogo size={32} />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Campus Live Broadcast Dispatcher</h3>
                <p className="text-[11px] text-slate-500">Pushes sticky banner across all student devices</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEditorModal(false)}
              className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
            >
              &times;
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const updated: BroadcastAlertItem = {
                id: broadcast?.id || `alert_${Date.now()}`,
                title: titleInput.trim(),
                message: messageInput.trim(),
                severity: severityInput,
                active: activeInput,
                dismissible: dismissibleInput,
                created_at: 'Just now',
                author: 'Office of the Dean / Administrator',
              };
              onUpdateBroadcast(updated);
              setIsDismissed(false);
              setShowEditorModal(false);
              triggerToast(activeInput ? '📢 Live campus broadcast dispatched to all students!' : 'Broadcast deactivated.');
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alert Severity Level:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'emergency', label: '🚨 Emergency' },
                  { id: 'advisory', label: '⚠️ Advisory' },
                  { id: 'official', label: '👑 Official' },
                  { id: 'info', label: '📢 Info' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeverityInput(s.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      severityInput === s.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Broadcast Headline:
              </label>
              <input
                type="text"
                required
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="e.g. Relocation of FOE Mid-Semester Practical Exams"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Message Body:
              </label>
              <textarea
                rows={3}
                required
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Details of the announcement, venues, instructions for students..."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs">
                <input
                  type="checkbox"
                  checked={dismissibleInput}
                  onChange={(e) => setDismissibleInput(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span className="font-medium text-slate-700">Allow students to dismiss</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs">
                <input
                  type="checkbox"
                  checked={activeInput}
                  onChange={(e) => setActiveInput(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span className="font-bold text-slate-900">Broadcast is LIVE</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {broadcast && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateBroadcast(null);
                    setShowEditorModal(false);
                    triggerToast('Campus broadcast removed.');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  Clear Broadcast
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowEditorModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Broadcast</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full ${severityStyles.bg} ${severityStyles.border} border-b py-2.5 px-3 sm:px-6 shadow-md transition-all duration-300 relative z-30`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1 rounded-full bg-white/20 shrink-0">
            <Icon className={`w-4 h-4 ${severityStyles.text} animate-pulse`} />
          </div>

          <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 w-fit ${severityStyles.badge}`}
            >
              {severityStyles.label}
            </span>
            <div className="truncate">
              <strong className={`font-bold ${severityStyles.text}`}>{broadcast.title}: </strong>
              <span className={`${severityStyles.text} opacity-95`}>{broadcast.message}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowEditorModal(true)}
              className="p-1 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-lg cursor-pointer transition-colors"
              title="Edit campus broadcast as administrator"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {broadcast.dismissible && (
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 text-white/80 hover:text-white bg-black/10 hover:bg-black/30 rounded-lg cursor-pointer transition-colors"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {showEditorModal && renderEditorModal()}
    </div>
  );
}
