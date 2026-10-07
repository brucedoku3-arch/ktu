import React, { useState } from 'react';
import {
  GraduationCap,
  Shield,
  CheckCircle2,
  AlertCircle,
  Camera,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import KTULogo from './KTULogo';

// Official Koforidua Technical University 2026 Academic Catalog
export const KTU_ACADEMIC_CATALOG: Record<string, string[]> = {
  'Faculty of Engineering (FOE)': [
    'B.Tech Automotive Engineering',
    'B.Tech Civil Engineering',
    'B.Tech Electrical/Electronic Engineering',
    'B.Tech Mechanical Engineering',
    'B.Tech Mechatronics Engineering',
    'B.Tech Renewable Energy Systems Engineering',
    'Higher National Diploma (HND) in Automotive Engineering',
    'Higher National Diploma (HND) in Civil Engineering',
    'Higher National Diploma (HND) in Electrical/Electronic Engineering',
    'Higher National Diploma (HND) in Mechanical Engineering',
  ],
  'Faculty of Applied Science and Technology (FAST)': [
    'B.Tech Computer Science',
    'B.Tech Information Technology',
    'B.Tech Artificial Intelligence & Robotics',
    'B.Tech Cyber Security & Digital Forensics',
    'B.Tech Data Science & Analytics',
    'B.Tech Food Technology',
    'B.Tech Medical Laboratory Technology',
    'B.Tech Statistics & Actuarial Science',
    'Higher National Diploma (HND) in Computer Science',
    'Higher National Diploma (HND) in Information Technology',
    'Higher National Diploma (HND) in Network & Systems Administration',
    'Higher National Diploma (HND) in Food Technology',
    'Higher National Diploma (HND) in Post-Harvest Technology',
  ],
  'Faculty of Business and Management Studies (FBMS)': [
    'B.Tech Accounting & Finance',
    'B.Tech Procurement & Supply Chain Management',
    'B.Tech Marketing & Digital Media',
    'B.Tech Secretaryship & Management Studies',
    'Higher National Diploma (HND) in Accountancy',
    'Higher National Diploma (HND) in Marketing',
    'Higher National Diploma (HND) in Purchasing & Supply',
    'Higher National Diploma (HND) in Secretarial & Management Studies',
  ],
  'Faculty of Built and Natural Environment (FBNE)': [
    'B.Tech Construction Technology',
    'B.Tech Environmental Technology',
    'B.Tech Quantity Surveying & Cost Engineering',
    'Higher National Diploma (HND) in Building Technology',
    'Higher National Diploma (HND) in Environmental Management',
  ],
  'Faculty of Health and Allied Sciences (FHAS)': [
    'B.Tech Medical Laboratory Science',
    'B.Tech Biomedical Engineering',
    'B.Tech Community & Public Health Nursing',
    'Diploma in Health Informatics & Records',
  ],
};

const PRESET_AVATARS = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    label: 'Scholar Techie',
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    label: 'Engineering Lead',
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    label: 'Creative Creator',
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    label: 'Campus Aux DJ',
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    label: 'Business Analyst',
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    label: 'Software Developer',
  },
];

interface StudentOnboardingFlowProps {
  currentUser: any;
  onUpdateCurrentUser: (updated: any) => void;
  onFinish: () => void;
  triggerToast: (msg: string) => void;
}

export default function StudentOnboardingFlow({
  currentUser,
  onUpdateCurrentUser,
  onFinish,
  triggerToast,
}: StudentOnboardingFlowProps) {
  const ADMIN_OVERRIDE = 'brucedoku3@gmail.com';

  // View state: 'profile' | 'onboarding'
  const [activeView, setActiveView] = useState<'profile' | 'onboarding'>('profile');

  // Multi-step Onboarding & Profile State initialized from currentUser
  const [fullName, setFullName] = useState(currentUser?.full_name || 'Kwame Mensah');
  const [username, setUsername] = useState(currentUser?.username || 'kwame_cs');
  const [email, setEmail] = useState(currentUser?.email || '0420230012@ktu.edu.gh');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Prefer not to say'>(
    currentUser?.gender ? ((currentUser.gender.charAt(0).toUpperCase() + currentUser.gender.slice(1)) as any) : 'Male'
  );
  const [level, setLevel] = useState<'100' | '200' | '300' | '400'>(
    String(currentUser?.level || '200') as any
  );
  const [faculty, setFaculty] = useState<string>(
    currentUser?.faculty || 'Faculty of Applied Science and Technology (FAST)'
  );
  const [course, setCourse] = useState<string>(
    currentUser?.program || 'B.Tech Computer Science'
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    currentUser?.avatar || PRESET_AVATARS[0].url
  );
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [bio, setBio] = useState(
    currentUser?.bio || 'Level 200 Computer Science student. Building open source tools & exploring KTU campus life 💻🎧'
  );

  // Handle Local File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        setCustomAvatarPreview(result);
        setAvatarUrl(result);
        triggerToast('Custom avatar loaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Profile Update / Onboarding Completion
  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();

    if (!gender) {
      triggerToast('Please select your gender.');
      setStep(1);
      return;
    }
    if (!faculty || !course) {
      triggerToast('Please select your Faculty and Program.');
      setStep(2);
      return;
    }

    const isSuperAdmin =
      email.trim().toLowerCase() === ADMIN_OVERRIDE.toLowerCase() ||
      email.trim().toLowerCase() === 'brucedoku3@gmail.com' ||
      email.trim().toLowerCase().startsWith('brucedoku') ||
      username.trim().toLowerCase().startsWith('brucedoku') ||
      email.trim().toLowerCase() === 'bruce20597216248@gmail.com' ||
      !!currentUser?.is_admin;

    const updated = {
      ...currentUser,
      full_name: fullName,
      name: fullName,
      username: username.replace('@', ''),
      email: email,
      gender: gender,
      level: parseInt(level) as 100 | 200 | 300 | 400,
      faculty: faculty,
      program: course,
      avatar: customAvatarPreview || avatarUrl,
      bio: bio,
      is_onboarded: true,
      is_verified: true,
      is_admin: isSuperAdmin,
      role: isSuperAdmin ? 'admin' : (currentUser?.role || 'student'),
    };

    onUpdateCurrentUser(updated);
    triggerToast('🎉 Student Profile updated successfully!');
    setActiveView('profile');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Top Banner Navigation: Switch between Profile View, Edit Flow, and Architecture */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <GraduationCap className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 leading-tight">
              KTU Student Profile & Verified Credentials
            </h2>
            <p className="text-[11px] text-slate-500">
              Koforidua Technical University · Verified Student Identity & Digital ID
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveView('profile')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              activeView === 'profile'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            🎓 Digital Student ID
          </button>
          <button
            type="button"
            onClick={() => setActiveView('onboarding')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              activeView === 'onboarding'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            ✏️ Edit Profile & Bio
          </button>
        </div>
      </div>

      {/* =====================================================================
          VIEW 0: VERIFIED STUDENT PROFILE & DIGITAL ID CARD
          ===================================================================== */}
      {activeView === 'profile' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Digital KTU Student ID Card */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-indigo-500/30">
            {/* Background seal pattern */}
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none">
              <GraduationCap className="w-80 h-80" />
            </div>

            {/* University Crest Header */}
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <KTULogo size={52} alt="Koforidua Technical University Crest" />
                <div>
                  <h3 className="text-sm font-extrabold tracking-wide uppercase text-amber-300">
                    Koforidua Technical University
                  </h3>
                  <p className="text-[10px] tracking-wider uppercase text-slate-300">
                    Official Student Digital Credential
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </div>
            </div>

            {/* Student Details Grid */}
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              <div className="relative shrink-0">
                <img
                  src={currentUser?.avatar || avatarUrl}
                  alt={currentUser?.full_name || fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-amber-300/60 shadow-lg"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80';
                  }}
                />
                <span className="absolute -bottom-2 -right-2 bg-indigo-600 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-400">
                  L{currentUser?.level || level}
                </span>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white">
                    {currentUser?.full_name || fullName}
                  </h2>
                  <p className="text-xs font-mono text-indigo-300">
                    @{currentUser?.username || username} · {currentUser?.student_id || 'KTU/2026/0411'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Faculty:</span>
                    <span className="font-semibold text-slate-200 line-clamp-1">{currentUser?.faculty || faculty}</span>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Program:</span>
                    <span className="font-semibold text-slate-200 line-clamp-1">{currentUser?.program || course}</span>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Institutional Email:</span>
                    <span className="font-mono text-slate-200 truncate block">{currentUser?.email || email}</span>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Account Role:</span>
                    <span className="font-bold text-amber-300">
                      {currentUser?.is_admin ? '👑 Campus Safety Admin' : '🎓 Verified Student'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic pt-1">
                  "{currentUser?.bio || bio}"
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-4 border-t border-indigo-500/20 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Status: Active Enrollment · 2026 Academic Session
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('onboarding')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Edit Academic Details & Bio &rarr;
                </button>
                <button
                  type="button"
                  onClick={onFinish}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Return to Feed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: MULTI-STEP ONBOARDING FLOW (app/templates/auth/onboarding.html)
          ===================================================================== */}
      {activeView === 'onboarding' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header & Stepper Indicator */}
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 mb-2">
              <KTULogo size={20} />
              <span>KTU Campus Verification · 2026 Academic Year</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Complete Your Student Profile</h1>
            <p className="text-xs text-slate-500 mt-1">
              Personalize your profile to discover classmates, academic groups, aux battles, and campus updates.
            </p>

            {/* Stepper Progress Bar */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`flex items-center gap-2 cursor-pointer ${
                    step >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    1
                  </span>
                  <span>Basic Info</span>
                </button>

                <div className="flex-1 h-0.5 bg-slate-100 mx-3">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: step >= 2 ? '100%' : '0%' }}
                  ></div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`flex items-center gap-2 cursor-pointer ${
                    step >= 2 ? 'text-indigo-600 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    2
                  </span>
                  <span>Academics</span>
                </button>

                <div className="flex-1 h-0.5 bg-slate-100 mx-3">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: step === 3 ? '100%' : '0%' }}
                  ></div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className={`flex items-center gap-2 cursor-pointer ${
                    step === 3 ? 'text-indigo-600 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      step === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    3
                  </span>
                  <span>Avatar & Bio</span>
                </button>
              </div>

              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${(step / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <form onSubmit={handleCompleteOnboarding} className="space-y-6">
            {/* STEP 1: GENDER SELECTION */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Step 1 of 3
                  </span>
                  <h2 className="text-base font-bold text-slate-900">What is your gender?</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Used for campus roommate matching, student discussions, and personalized social circles.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { val: 'Male', icon: '👨', label: 'Male', sub: 'He / Him' },
                    { val: 'Female', icon: '👩', label: 'Female', sub: 'She / Her' },
                    { val: 'Prefer not to say', icon: '✨', label: 'Prefer not to say', sub: 'Private student preference' },
                  ].map((item) => {
                    const isSelected = gender === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setGender(item.val as any)}
                        className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[110px] ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-600 ring-1 ring-indigo-600 text-indigo-950 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span className="text-3xl leading-none">{item.icon}</span>
                        <div>
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] text-slate-400">{item.sub}</div>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Continue to Academic Standing</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ACADEMIC DETAILS (LEVEL, FACULTY, PROGRAM ALIGNED WITH KTU 2026) */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Step 2 of 3
                  </span>
                  <h2 className="text-base font-bold text-slate-900">Your KTU Academic Standing</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connect directly with students in your department, access course notes, and swap skills.
                  </p>
                </div>

                {/* Level / Year Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Academic Level / Year <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { val: '100', label: 'Level 100', sub: 'Freshman' },
                      { val: '200', label: 'Level 200', sub: 'Sophomore' },
                      { val: '300', label: 'Level 300', sub: 'Junior' },
                      { val: '400', label: 'Level 400', sub: 'Final Year' },
                    ].map((lvl) => {
                      const isSelected = level === lvl.val;
                      return (
                        <button
                          key={lvl.val}
                          type="button"
                          onClick={() => setLevel(lvl.val as any)}
                          className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer min-h-[50px] flex flex-col justify-center ${
                            isSelected
                              ? 'bg-indigo-50/70 border-indigo-600 ring-1 ring-indigo-600 text-indigo-950 font-bold'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span className="text-xs">{lvl.label}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{lvl.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Faculty Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faculty / School <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={faculty}
                    onChange={(e) => {
                      const newFac = e.target.value;
                      setFaculty(newFac);
                      const progs = KTU_ACADEMIC_CATALOG[newFac] || [];
                      if (progs.length > 0) {
                        setCourse(progs[0]);
                      }
                    }}
                    className="w-full h-11 px-3.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                  >
                    {Object.keys(KTU_ACADEMIC_CATALOG).map((fac) => (
                      <option key={fac} value={fac}>
                        {fac}
                      </option>
                    ))}
                  </select>
                  <span className="block text-[11px] text-slate-400 mt-1">
                    Official Koforidua Technical University accredited faculty in 2026.
                  </span>
                </div>

                {/* Program / Course Selection (Dynamically Filtered) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Course / Program of Study <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full h-11 px-3.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                  >
                    {(KTU_ACADEMIC_CATALOG[faculty] || []).map((prog) => (
                      <option key={prog} value={prog}>
                        {prog}
                      </option>
                    ))}
                  </select>
                  <span className="block text-[11px] text-slate-400 mt-1">
                    KTU 2026 curriculum accredited B.Tech or Higher National Diploma (HND).
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-11 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Continue to Avatar & Bio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: AVATAR & BIO (OPTIONAL) */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Step 3 of 3 · Optional
                  </span>
                  <h2 className="text-base font-bold text-slate-900">Avatar & Campus Headline</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pick a campus preset or upload your photo. You can always update this later in your profile.
                  </p>
                </div>

                {/* Avatar Selection Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-5">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <img
                      src={customAvatarPreview || avatarUrl}
                      alt="Selected Avatar Preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-indigo-500"
                    />
                    <label className="h-8 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-2xs">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <span className="text-xs font-bold text-slate-800 block">
                      Or select an official campus avatar:
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_AVATARS.map((p) => {
                        const isSelected = !customAvatarPreview && avatarUrl === p.url;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setCustomAvatarPreview(null);
                              setAvatarUrl(p.url);
                            }}
                            className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-transform cursor-pointer hover:scale-105 ${
                              isSelected
                                ? 'border-indigo-600 ring-2 ring-indigo-400'
                                : 'border-slate-200 opacity-80 hover:opacity-100'
                            }`}
                            title={p.label}
                          >
                            <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Campus Bio / Headline */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Short Bio / Campus Headline <span className="text-slate-400">(Optional)</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {bio.length} / 160
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={160}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Level 200 Computer Science student. Building open source tools & exploring KTU campus life 💻🎧"
                    className="w-full p-3 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />

                  {/* Quick Fill Suggestions */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
                    {[
                      'Level 200 Tech Enthusiast | AI Club Member 💻⚡',
                      'Engineering student & Campus Aux Battle challenger 🎶⚡',
                      'KTU Library 2nd floor regular | Study groups open 📚✨',
                    ].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setBio(s)}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                      >
                        + {s.slice(0, 24)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-11 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>🎉 Finish Onboarding & Enter KTU Feed</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
