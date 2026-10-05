import React, { useState } from 'react';
import {
  BarChart2,
  CheckCircle2,
  Share2,
  Trash2,
  Plus,
  Flame,
  Clock,
  Sparkles,
  Users,
  Check,
  Radio
} from 'lucide-react';
import KTULogo from './KTULogo';

export interface PollOptionItem {
  id: number;
  text: string;
  votes: number;
}

export interface CampusPollItem {
  id: number;
  question: string;
  author: string;
  authorStudentId: string;
  authorAvatar: string;
  faculty: string;
  createdAt: string;
  options: PollOptionItem[];
  userVotedOptionId?: number | null;
  category: string;
}

interface CampusPollWidgetProps {
  currentUsername: string;
  isAdmin: boolean;
  onRequestDeletePoll: (poll: CampusPollItem) => void;
  onSharePoll: (poll: CampusPollItem) => void;
  triggerToast: (msg: string) => void;
}

export const INITIAL_KTU_POLLS: CampusPollItem[] = [
  {
    id: 1,
    question: 'SRC Week 2026 Grand Concert: Who should headline at the CCB Auditorium?',
    author: 'kofi_eng',
    authorStudentId: 'KTU/FOE/AUT/23/041',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    faculty: 'FOE · Engineering',
    createdAt: '2h ago',
    category: 'SRC & Entertainment',
    userVotedOptionId: null,
    options: [
      { id: 101, text: 'King Paluta ("Makoma")', votes: 142 },
      { id: 102, text: 'Black Sherif', votes: 198 },
      { id: 103, text: 'Sarkodie', votes: 87 },
      { id: 104, text: 'Olivetheboy', votes: 54 },
    ],
  },
  {
    id: 2,
    question: 'Should Saturday 7:00 AM lectures at FOE Multipurpose Complex be converted to Virtual Zoom?',
    author: 'adwoa_procure',
    authorStudentId: 'KTU/FBMS/PSC/22/114',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    faculty: 'FBMS · Procurement',
    createdAt: '4h ago',
    category: 'Academic Life',
    userVotedOptionId: null,
    options: [
      { id: 201, text: 'Yes! 100% online for early Saturdays', votes: 312 },
      { id: 202, text: 'Keep in-person labs only, theory online', votes: 164 },
      { id: 203, text: 'No, in-person attendance is better', votes: 41 },
    ],
  },
  {
    id: 3,
    question: 'Best student lunch and waakye hangout spot around KTU Campus:',
    author: 'selorm_fast',
    authorStudentId: 'KTU/FAST/CS/24/099',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    faculty: 'FAST · Computer Science',
    createdAt: 'Yesterday',
    category: 'Campus Lifestyle',
    userVotedOptionId: null,
    options: [
      { id: 301, text: 'Food Village (Behind Engineering Complex)', votes: 230 },
      { id: 302, text: 'Jubilee Hall Eateries', votes: 145 },
      { id: 303, text: 'GETFund Hostels Mama Gee Spot', votes: 112 },
      { id: 304, text: 'SRC Canteen Center', votes: 68 },
    ],
  },
];

export const CampusPollWidget: React.FC<CampusPollWidgetProps> = ({
  currentUsername,
  isAdmin,
  onRequestDeletePoll,
  onSharePoll,
  triggerToast,
}) => {
  const [polls, setPolls] = useState<CampusPollItem[]>(() => {
    try {
      const saved = localStorage.getItem('ktu_campus_polls');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_KTU_POLLS;
  });

  const [animatingOptionId, setAnimatingOptionId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState('Campus Life');
  const [newOptions, setNewOptions] = useState(['', '']);

  // Sync to localStorage
  const savePolls = (updated: CampusPollItem[]) => {
    setPolls(updated);
    try {
      localStorage.setItem('ktu_campus_polls', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleVote = (pollId: number, optionId: number) => {
    setAnimatingOptionId(optionId);

    const updated = polls.map((poll) => {
      if (poll.id !== pollId) return poll;

      const prevVote = poll.userVotedOptionId;
      // If clicking same, allow toggling off or keep selected
      if (prevVote === optionId) {
        return {
          ...poll,
          userVotedOptionId: null,
          options: poll.options.map((opt) =>
            opt.id === optionId ? { ...opt, votes: Math.max(0, opt.votes - 1) } : opt
          ),
        };
      }

      // Switching or casting new vote
      const nextOptions = poll.options.map((opt) => {
        if (opt.id === optionId) {
          return { ...opt, votes: opt.votes + 1 };
        }
        if (prevVote && opt.id === prevVote) {
          return { ...opt, votes: Math.max(0, opt.votes - 1) };
        }
        return opt;
      });

      return {
        ...poll,
        userVotedOptionId: optionId,
        options: nextOptions,
      };
    });

    savePolls(updated);
    triggerToast('Vote recorded! Bar updated live.');

    // Clear pulse after animation finishes
    setTimeout(() => {
      setAnimatingOptionId(null);
    }, 900);
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuestion = newQuestion.trim();
    const validOptions = newOptions.map((o) => o.trim()).filter(Boolean);

    if (!cleanQuestion || validOptions.length < 2) {
      triggerToast('Please provide a question and at least 2 options.');
      return;
    }

    const newPoll: CampusPollItem = {
      id: Date.now(),
      question: cleanQuestion,
      author: currentUsername,
      authorStudentId: `KTU/VERIFIED/${Math.floor(1000 + Math.random() * 9000)}`,
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      faculty: 'KTU Verified Student',
      createdAt: 'Just now',
      category: newCategory,
      userVotedOptionId: null,
      options: validOptions.map((text, idx) => ({
        id: Date.now() + idx,
        text,
        votes: 0,
      })),
    };

    const nextPolls = [newPoll, ...polls];
    savePolls(nextPolls);
    setShowCreateModal(false);
    setNewQuestion('');
    setNewOptions(['', '']);
    triggerToast('Campus poll published to KTU student body!');
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex-wrap gap-2.5">
        <div className="flex items-center gap-3">
          <KTULogo size={40} />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>KTU Live Student Polls</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                Interactive
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Campus sentiment, SRC discussions, and real-time student voting
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Poll</span>
        </button>
      </div>

      {/* Polls Stream */}
      <div className="space-y-4">
        {polls.map((poll) => {
          const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
          const hasVoted = poll.userVotedOptionId != null;
          const isAuthor = poll.author === currentUsername;
          const canDelete = isAuthor || isAdmin;

          return (
            <article
              key={poll.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              {/* Poll Top Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={poll.authorAvatar}
                    alt={poll.author}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">@{poll.author}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                        {poll.authorStudentId}
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded-full border border-indigo-100">
                        {poll.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>{poll.faculty}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {poll.createdAt}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Action Buttons (Delete & Share) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSharePoll(poll)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Share poll link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onRequestDeletePoll(poll)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete poll"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Poll Question */}
              <h4 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug">
                {poll.question}
              </h4>

              {/* Poll Options List with Smooth Animated Growing Percentage Bar */}
              <div className="space-y-2.5">
                {poll.options.map((option) => {
                  const isSelected = poll.userVotedOptionId === option.id;
                  const isAnimating = animatingOptionId === option.id;
                  const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleVote(poll.id, option.id)}
                      className={`group relative w-full text-left rounded-xl border p-3 min-h-[48px] overflow-hidden transition-all duration-300 cursor-pointer flex items-center justify-between select-none ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Smooth Animated Growing Percentage Fill Bar */}
                      <div
                        className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ease-out z-0 ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-200/90 via-indigo-200/70 to-violet-200/80'
                            : hasVoted
                            ? 'bg-slate-100/90'
                            : 'bg-transparent'
                        } ${isAnimating ? 'animate-pulse' : ''}`}
                        style={{
                          width: hasVoted ? `${percentage}%` : '0%',
                        }}
                      />

                      {/* Foreground Option Content */}
                      <div className="relative z-10 flex items-center gap-2.5 flex-1 pr-2">
                        {/* Radio Indicator */}
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'border-2 border-slate-300 group-hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>

                        {/* Option Label */}
                        <span
                          className={`text-xs font-semibold leading-tight transition-colors ${
                            isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {option.text}
                        </span>
                      </div>

                      {/* Foreground Percentage & Votes Counter with Smooth Transition */}
                      <div className="relative z-10 shrink-0 text-right">
                        {hasVoted ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-mono font-extrabold transition-all duration-500 ${
                                isSelected ? 'text-indigo-700 scale-105' : 'text-slate-600'
                              }`}
                            >
                              {percentage}%
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({option.votes})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 group-hover:text-indigo-600 transition-colors font-medium">
                            Vote
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Poll Footer Summary */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 font-medium text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <strong className="text-slate-700 font-bold">{totalVotes}</strong> total student {totalVotes === 1 ? 'vote' : 'votes'}
                  </span>
                  <span>·</span>
                  <span>Click to cast or change vote</span>
                </div>

                {hasVoted && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Voted</span>
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Create Campus Poll</h3>
                  <p className="text-[11px] text-slate-500">Ask the KTU student body and view live results</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Question / Topic</label>
                <textarea
                  rows={2}
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g., Which lecturer explains Circuit Theory best?"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Campus Life">Campus Life</option>
                  <option value="Academic Life">Academic Life</option>
                  <option value="SRC & Entertainment">SRC & Entertainment</option>
                  <option value="Hostel & Food">Hostel & Food</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Poll Options (Min. 2)</label>
                {newOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 w-4 text-center">{idx + 1}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...newOptions];
                        next[idx] = e.target.value;
                        setNewOptions(next);
                      }}
                      placeholder={`Option ${idx + 1}...`}
                      required
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {newOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setNewOptions(newOptions.filter((_, i) => i !== idx))}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Remove option"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {newOptions.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setNewOptions([...newOptions, ''])}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Option</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Publish Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusPollWidget;
