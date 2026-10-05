import React, { useState } from 'react';
import {
  Activity,
  Users,
  Eye,
  TrendingUp,
  BarChart3,
  PlusCircle,
  FileText,
  Calendar,
  Radio,
  CheckCircle2,
  AlertCircle,
  Pin,
  Sparkles,
  ArrowUpRight,
  Flame,
  MessageSquare,
  Video
} from 'lucide-react';
import KTULogo from './KTULogo';

export interface CampusNewsItem {
  id: number;
  title: string;
  category: 'SRC' | 'Exams' | 'Academic' | 'Admissions' | 'Sports' | 'Campus Life';
  date: string;
  author: string;
  imageUrl?: string;
  content: string;
  isPinned?: boolean;
}

export interface CampusEventItem {
  id: number;
  title: string;
  venue: string;
  date: string;
  time: string;
  organizer: string;
  description: string;
}

interface AdminHubManagerProps {
  onPublishNews: (news: CampusNewsItem) => void;
  onPublishPoll: (poll: { question: string; category: string; options: string[] }) => void;
  onPublishEvent: (event: CampusEventItem) => void;
  triggerToast: (msg: string) => void;
}

export const AdminHubManager: React.FC<AdminHubManagerProps> = ({
  onPublishNews,
  onPublishPoll,
  onPublishEvent,
  triggerToast,
}) => {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'traffic' | 'add_news' | 'add_poll' | 'add_event'>('traffic');

  // Form states
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState<'SRC' | 'Exams' | 'Academic' | 'Admissions' | 'Sports' | 'Campus Life'>('SRC');
  const [newsContent, setNewsContent] = useState('');
  const [newsImageUrl, setNewsImageUrl] = useState('');
  const [newsIsPinned, setNewsIsPinned] = useState(false);

  // Poll form states
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollCategory, setPollCategory] = useState('Campus Life');
  const [pollOptions, setPollOptions] = useState<string[]>(['Option A', 'Option B']);

  // Event form states
  const [eventTitle, setEventTitle] = useState('');
  const [eventVenue, setEventVenue] = useState('KTU Great Hall');
  const [eventDate, setEventDate] = useState('Tomorrow');
  const [eventTime, setEventTime] = useState('2:00 PM');
  const [eventOrganizer, setEventOrganizer] = useState('SRC Student Secretariat');
  const [eventDescription, setEventDescription] = useState('');

  const handleNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) return;

    const item: CampusNewsItem = {
      id: Date.now(),
      title: newsTitle.trim(),
      category: newsCategory,
      date: 'Just now',
      author: 'KTU Administration / SRC',
      imageUrl: newsImageUrl.trim() || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80',
      content: newsContent.trim(),
      isPinned: newsIsPinned,
    };

    onPublishNews(item);
    setNewsTitle('');
    setNewsContent('');
    setNewsImageUrl('');
    setNewsIsPinned(false);
    triggerToast('📢 Official campus bulletin published to KTU Hub!');
  };

  const handlePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOpts = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || validOpts.length < 2) {
      triggerToast('Please provide a question and at least 2 options.');
      return;
    }

    onPublishPoll({
      question: pollQuestion.trim(),
      category: pollCategory,
      options: validOpts,
    });

    setPollQuestion('');
    setPollOptions(['Option A', 'Option B']);
    triggerToast('📊 Campus Poll published to Hub & Feed!');
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const ev: CampusEventItem = {
      id: Date.now(),
      title: eventTitle.trim(),
      venue: eventVenue,
      date: eventDate,
      time: eventTime,
      organizer: eventOrganizer,
      description: eventDescription.trim() || 'Official campus gathering for KTU students.',
    };

    onPublishEvent(ev);
    setEventTitle('');
    setEventDescription('');
    triggerToast('📅 Campus event added to Hub Schedule!');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Admin Hub Navigation */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <KTULogo size={38} />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Admin Campus Command & Hub Manager
            </h3>
            <p className="text-[11px] text-slate-500">Live student traffic analytics & official hub publishing</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveAdminSubTab('traffic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeAdminSubTab === 'traffic'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 User Traffic
          </button>
          <button
            type="button"
            onClick={() => setActiveAdminSubTab('add_news')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeAdminSubTab === 'add_news'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📢 Add News
          </button>
          <button
            type="button"
            onClick={() => setActiveAdminSubTab('add_poll')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeAdminSubTab === 'add_poll'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗳️ Add Poll
          </button>
          <button
            type="button"
            onClick={() => setActiveAdminSubTab('add_event')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeAdminSubTab === 'add_event'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 Add Event
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. USERS TRAFFIC ANALYTICS DASHBOARD                                  */}
      {/* ===================================================================== */}
      {activeAdminSubTab === 'traffic' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
              <div className="flex items-center justify-between text-indigo-600">
                <span className="text-[11px] font-bold uppercase tracking-wider">Online Right Now</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <p className="text-2xl font-black text-slate-900">418</p>
              <p className="text-[10px] text-slate-500">Verified KTU students on campus</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Today's Pageviews</span>
                <Eye className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900">24,890</p>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +18.4% vs yesterday
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Unique Visitors</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900">3,140</p>
              <p className="text-[10px] text-slate-500">Active index IDs today</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">87.7 FM Listeners</span>
                <Radio className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600">348</p>
              <p className="text-[10px] text-slate-500">Tuned in to live broadcast</p>
            </div>
          </div>

          {/* Traffic Breakdown by Section & Faculty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By App Section */}
            <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  Traffic By Campus Section
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Real-Time Routing</span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: 'Brainrot Memes & Campus Feeds', pct: 44, icon: Flame, color: 'bg-amber-500' },
                  { name: 'Peer-to-Peer Messaging (Chat)', pct: 28, icon: MessageSquare, color: 'bg-indigo-600' },
                  { name: '30s Stories & Micro-Vlogs', pct: 15, icon: Video, color: 'bg-pink-500' },
                  { name: 'KTU 87.7 FM Radio & Aux', pct: 8, icon: Radio, color: 'bg-orange-500' },
                  { name: 'KTU Hub, News & Polls', pct: 5, icon: BarChart3, color: 'bg-emerald-600' },
                ].map((sec, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <sec.icon className="w-3.5 h-3.5 text-slate-400" />
                        {sec.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900">{sec.pct}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${sec.color}`} style={{ width: `${sec.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Faculty & Peak Hours */}
            <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  Student Faculty Activity
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Campus Demographics</span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { faculty: 'FOE · Faculty of Engineering', count: '1,120 active', pct: 36 },
                  { faculty: 'FAST · Applied Science & Tech', count: '890 active', pct: 29 },
                  { faculty: 'FBMS · Business & Management', count: '640 active', pct: 21 },
                  { faculty: 'FAD · Art & Design', count: '310 active', pct: 10 },
                  { faculty: 'FBNE · Built & Natural Env', count: '180 active', pct: 4 },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700">{item.faculty}</span>
                      <span className="text-slate-500 font-mono">{item.count}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Peak times callout */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Peak Campus Load: <strong>12:30 PM - 2:00 PM</strong> (Lunch break)</span>
                <span className="font-mono text-emerald-600 font-bold">99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. ADD CAMPUS NEWS / BULLETIN TO HUB                                  */}
      {/* ===================================================================== */}
      {activeAdminSubTab === 'add_news' && (
        <form onSubmit={handleNewsSubmit} className="space-y-3.5 animate-in fade-in">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Headline / Announcement Title:
            </label>
            <input
              type="text"
              required
              value={newsTitle}
              onChange={(e) => setNewsTitle(e.target.value)}
              placeholder="e.g. 2026 Second Semester Examination Timetable Released"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                News Category / Badge:
              </label>
              <select
                value={newsCategory}
                onChange={(e) => setNewsCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="SRC">SRC Secretariat</option>
                <option value="Exams">Examinations Directorate</option>
                <option value="Academic">Academic Affairs</option>
                <option value="Admissions">Admissions & Registration</option>
                <option value="Sports">Campus Sports & GUSA</option>
                <option value="Campus Life">Campus Life & Notices</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cover Image URL (Optional):
              </label>
              <input
                type="url"
                value={newsImageUrl}
                onChange={(e) => setNewsImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or leave blank"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Announcement Story / Content:
            </label>
            <textarea
              required
              rows={4}
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              placeholder="Enter full announcement details for students. Timelines, instructions, venues..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinNews"
              checked={newsIsPinned}
              onChange={(e) => setNewsIsPinned(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="pinNews" className="text-xs font-medium text-slate-700 cursor-pointer">
              📌 Pin this bulletin to the top of the KTU Hub feed
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Publish Bulletin to KTU Hub</span>
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* 3. ADD CAMPUS POLL TO HUB & FEED                                      */}
      {/* ===================================================================== */}
      {activeAdminSubTab === 'add_poll' && (
        <form onSubmit={handlePollSubmit} className="space-y-3.5 animate-in fade-in">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Poll Question:
            </label>
            <input
              type="text"
              required
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="e.g. Which cafeteria at KTU serves the best waakye and jollof?"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Poll Category:
            </label>
            <input
              type="text"
              value={pollCategory}
              onChange={(e) => setPollCategory(e.target.value)}
              placeholder="e.g. Campus Life, Academics, SRC, Food Village"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Poll Options (2 to 4 options):
            </label>
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400 w-5">{idx + 1}.</span>
                <input
                  type="text"
                  required
                  value={opt}
                  onChange={(e) => {
                    const copy = [...pollOptions];
                    copy[idx] = e.target.value;
                    setPollOptions(copy);
                  }}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}

            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer pt-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add another option</span>
              </button>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Launch Animated Campus Poll</span>
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* 4. ADD CAMPUS EVENT / CALENDAR TO HUB                                 */}
      {/* ===================================================================== */}
      {activeAdminSubTab === 'add_event' && (
        <form onSubmit={handleEventSubmit} className="space-y-3.5 animate-in fade-in">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Event Title:
            </label>
            <input
              type="text"
              required
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g. Annual KTU Tech Hackathon & Project Exhibition"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Venue:</label>
              <input
                type="text"
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                placeholder="e.g. Great Hall / FOE Auditorium"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date:</label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="e.g. Friday, 17th Oct"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time:</label>
              <input
                type="text"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                placeholder="e.g. 10:00 AM GMT"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description:</label>
            <textarea
              rows={3}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Details regarding registration, dress code, attendees..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Add Event to Hub Schedule</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminHubManager;
