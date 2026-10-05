import React, { useState } from 'react';
import {
  GraduationCap,
  Shield,
  ArrowRight,
  ArrowLeft,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Sparkles,
  Camera,
  LogIn,
  CheckCircle2
} from 'lucide-react';
import { KTU_ACADEMIC_CATALOG } from './StudentOnboardingFlow';
import KTULogo from './KTULogo';

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

interface KTULandingPageProps {
  onLoginSuccess: (userData?: any) => void;
  triggerToast: (msg: string) => void;
  adminEmail: string;
}

export default function KTULandingPage({
  onLoginSuccess,
  triggerToast,
  adminEmail,
}: KTULandingPageProps) {
  // Auth mode: 'register' | 'login' | 'onboarding'
  const [authMode, setAuthMode] = useState<'register' | 'login' | 'onboarding'>('register');

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Multi-step Onboarding State
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Prefer not to say'>('Male');
  const [level, setLevel] = useState<'100' | '200' | '300' | '400'>('200');
  const [faculty, setFaculty] = useState<string>('Faculty of Applied Science and Technology (FAST)');
  const [course, setCourse] = useState<string>('B.Tech Computer Science');
  const [avatarUrl, setAvatarUrl] = useState<string>(PRESET_AVATARS[0].url);
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [bio, setBio] = useState('Level 200 student excited to join the verified KTU campus network! 🎓⚡');

  // Domain Validation & Smart Formatting Logic
  const getNormalizedEmail = (raw: string) => {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) return '';
    if (!trimmed.includes('@')) {
      return `${trimmed}@ktu.edu.gh`;
    }
    return trimmed;
  };

  const cleanEmail = email.trim().toLowerCase();
  const normalizedEmail = getNormalizedEmail(email);
  const isAdminOverride = cleanEmail === adminEmail.toLowerCase() || normalizedEmail === adminEmail.toLowerCase();
  const isKtuDomain = normalizedEmail.endsWith('@ktu.edu.gh') && normalizedEmail.length > 11;
  const isGeneralEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
  const isEmailValid = isAdminOverride || isKtuDomain || isGeneralEmail;

  // Password validation
  const isPasswordLongEnough = password.length >= 8;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  // Build new student object
  const buildStudentPayload = (isDirectFeed: boolean) => {
    const effectiveEmail = normalizedEmail || cleanEmail;
    const isSuperAdmin = effectiveEmail === adminEmail.toLowerCase();
    const effectiveUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const studentId = isSuperAdmin
      ? 'ADMIN-001'
      : effectiveEmail.endsWith('@ktu.edu.gh')
      ? `KTU-${effectiveEmail.split('@')[0].toUpperCase()}`
      : `KTU/${level}/${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      id: isSuperAdmin ? 1 : Date.now(),
      full_name: fullName.trim() || 'KTU Student',
      username: effectiveUsername || `student_${Math.floor(100 + Math.random() * 900)}`,
      student_id: studentId,
      email: effectiveEmail,
      gender: gender || 'Male',
      level: parseInt(level) as 100 | 200 | 300 | 400,
      faculty: faculty || 'Faculty of Applied Science and Technology (FAST)',
      program: course || 'B.Tech Computer Science',
      avatar: customAvatarPreview || avatarUrl || PRESET_AVATARS[0].url,
      bio: bio || `KTU Level 200 student · Verified on campus ⚡`,
      is_admin: isSuperAdmin,
      is_onboarded: true,
      is_verified: true,
    };
  };

  // Validate form inputs
  const validateForm = () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      setRegError('Please provide your full legal name (at least 2 characters).');
      return false;
    }
    if (!username.trim() || username.trim().length < 3) {
      setRegError('Username must be 3–30 characters (letters, numbers, underscores).');
      return false;
    }
    if (!isEmailValid) {
      setRegError('Please provide a valid institutional email (@ktu.edu.gh) or student email.');
      return false;
    }
    if (!isPasswordLongEnough) {
      setRegError('Password must be at least 8 characters.');
      return false;
    }
    if (!doPasswordsMatch) {
      setRegError('Password and confirmation do not match.');
      return false;
    }
    return true;
  };

  // Save student to local registered accounts cache
  const saveStudentToRegistry = (student: any) => {
    try {
      const existing = JSON.parse(localStorage.getItem('ktu_registered_students') || '[]');
      const filtered = existing.filter((u: any) => u.username !== student.username && u.email !== student.email);
      localStorage.setItem('ktu_registered_students', JSON.stringify([student, ...filtered]));
    } catch (e) {}
  };

  // Handle Registration Submit (Direct registration into campus feed)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!validateForm()) return;

    const student = buildStudentPayload(true);
    saveStudentToRegistry(student);
    triggerToast(`🎉 Welcome to KTU Social, @${student.username}! Account registered & verified.`);
    onLoginSuccess(student);
  };

  // Step into Academic Profiling Onboarding
  const handleStartCustomizingProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!validateForm()) return;

    triggerToast(`Student account registered for @${username}! Proceeding to academic profiling.`);
    setAuthMode('onboarding');
    setOnboardingStep(1);
  };

  // Skip from onboarding step directly to feed
  const handleSkipToFeed = () => {
    const student = buildStudentPayload(true);
    saveStudentToRegistry(student);
    triggerToast(`🎉 Welcome @${student.username}! Redirecting to campus feed.`);
    onLoginSuccess(student);
  };

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your Student ID, Username, or Institutional Email.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    const normalizedIdentifier = loginIdentifier.trim().toLowerCase();
    const isSuperAdmin =
      normalizedIdentifier === adminEmail.toLowerCase() ||
      normalizedIdentifier === 'bruce20597216248@gmail.com' ||
      normalizedIdentifier === 'admin-001' ||
      normalizedIdentifier === 'brucedoku' ||
      normalizedIdentifier === 'admin';

    // Check banned or suspended status in KTU student accounts registry
    try {
      const allAccounts = JSON.parse(localStorage.getItem('ktu_student_accounts') || '[]');
      const targetAcc = allAccounts.find(
        (a: any) =>
          a.username?.toLowerCase() === normalizedIdentifier ||
          a.email?.toLowerCase() === normalizedIdentifier ||
          a.student_id?.toLowerCase() === normalizedIdentifier
      );
      if (targetAcc) {
        if (targetAcc.is_banned) {
          setLoginError(
            `⛔ Account Barred: @${targetAcc.username} has been permanently expelled from KTU CampusSocial by the Directorate of Student Affairs (${targetAcc.ban_reason || 'Disciplinary misconduct'}).`
          );
          return;
        }
        if (targetAcc.is_suspended) {
          setLoginError(
            `⏸️ Account Suspended: Your access is currently restricted (${targetAcc.suspension_until || 'Temporary suspension'}). Contact the Dean of Student Affairs if you believe this is in error.`
          );
          return;
        }
      }
    } catch (e) {}

    // First check registered accounts in localStorage
    try {
      const registered = JSON.parse(localStorage.getItem('ktu_registered_students') || '[]');
      const found = registered.find(
        (u: any) =>
          u.username.toLowerCase() === normalizedIdentifier ||
          u.email.toLowerCase() === normalizedIdentifier ||
          (u.student_id && u.student_id.toLowerCase() === normalizedIdentifier)
      );
      if (found) {
        triggerToast(`Welcome back, ${found.full_name}! Redirecting to campus feed.`);
        onLoginSuccess(found);
        return;
      }
    } catch (e) {}

    triggerToast(`Welcome back, ${loginIdentifier}! Redirecting to campus feed.`);
    onLoginSuccess({
      id: isSuperAdmin ? 1 : Date.now(),
      full_name: isSuperAdmin ? 'Bruce Doku' : (normalizedIdentifier.startsWith('04') ? `Student (${loginIdentifier.trim()})` : loginIdentifier.trim()),
      username: isSuperAdmin ? 'brucedoku' : loginIdentifier.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
      student_id: isSuperAdmin ? 'ADMIN-001' : (normalizedIdentifier.startsWith('04') ? normalizedIdentifier : `KTU-${loginIdentifier.trim().toUpperCase()}`),
      email: isSuperAdmin ? adminEmail : (loginIdentifier.includes('@') ? loginIdentifier.trim() : `${loginIdentifier.trim()}@ktu.edu.gh`),
      is_admin: isSuperAdmin,
      is_onboarded: true,
      is_verified: true,
    });
  };

  // Complete Onboarding Flow
  const handleFinishOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = buildStudentPayload(false);
    saveStudentToRegistry(newUser);
    triggerToast(`🎉 Profile complete! Welcome to KTU CampusSocial, @${newUser.username}.`);
    onLoginSuccess(newUser);
  };

  // Preset fast demo logins
  const handleDemoAdmin = () => {
    triggerToast('Authenticated as Super-Admin (Bruce Doku). Opening feed...');
    onLoginSuccess({
      id: 1,
      full_name: 'Bruce Doku',
      username: 'brucedoku',
      student_id: 'ADMIN-001',
      email: adminEmail,
      gender: 'male',
      level: 200,
      faculty: 'Faculty of Engineering (FOE)',
      program: 'Security & Systems Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Level 200 Systems & Security student. Dean & campus safety administrator.',
      is_admin: true,
      is_verified: true,
      is_onboarded: true,
    });
  };

  const handleDemoStudent = () => {
    triggerToast('Authenticated as Verified Student (Kwame Mensah). Opening feed...');
    onLoginSuccess({
      id: 2,
      full_name: 'Kwame Mensah',
      username: 'kwame_cs',
      student_id: '0420230012',
      email: '0420230012@ktu.edu.gh',
      gender: 'male',
      level: 200,
      faculty: 'Faculty of Applied Science and Technology (FAST)',
      program: 'B.Tech Computer Science',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      bio: 'Level 200 Computer Science student. Midnight React & Flask developer.',
      is_admin: false,
      is_verified: true,
      is_onboarded: true,
    });
  };

  return (
    <div
      className="min-h-screen w-full relative flex items-center justify-center p-3.5 sm:p-6 bg-slate-950 bg-cover bg-center bg-no-repeat bg-fixed antialiased selection:bg-indigo-600 selection:text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.88)), url('https://upload.wikimedia.org/wikipedia/commons/2/23/Main_Gate_of_Koforidua_Technical_University.jpg')`,
      }}
    >
      {/* Centered Modern Card Positioned Over Full-screen Background */}
      <div className="relative w-full max-w-lg bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Official KTU Crest Logo at the Top of the Card */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 transition-transform hover:scale-105 duration-200">
            <KTULogo size={88} alt="Koforidua Technical University Official Crest" />
          </div>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900">
            Koforidua Technical University
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest">
              CampusSocial
            </span>
            <span className="text-[10px] text-slate-400">·</span>
            <span className="text-[10px] text-slate-500 font-semibold">
              Official Student Platform
            </span>
          </div>
        </div>

        {/* Tab Switcher: Register / Sign In (Only in Register or Login mode) */}
        {authMode !== 'onboarding' && (
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setRegError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
                authMode === 'register'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Student Account
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginError(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
                authMode === 'login'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student Sign In
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 1: REGISTRATION PAGE (app/templates/auth/register.html)         */}
        {/* =================================================================== */}
        {authMode === 'register' && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">Student Account Registration</h1>
            </div>

            {regError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full h-11 px-3.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                  />
                </div>
              </div>

              {/* 2. Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 font-bold text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. kwame_m"
                    className="w-full h-11 pl-8 pr-3.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                  />
                </div>
              </div>

              {/* 3. Institutional Email - rule validates in background without interface banners/badges */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Email or Student ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. 0420230012@ktu.edu.gh or Student ID"
                    className="w-full h-11 px-3.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                  />
                </div>
                {email.trim() && !email.includes('@') && (
                  <button
                    type="button"
                    onClick={() => setEmail(`${email.trim()}@ktu.edu.gh`)}
                    className="mt-1.5 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer bg-indigo-50/70 border border-indigo-200/60 px-2 py-0.5 rounded-md"
                  >
                    <span>💡 Tap to use official domain:</span>
                    <span className="font-mono font-bold underline">{email.trim()}@ktu.edu.gh</span>
                  </button>
                )}
                {isEmailValid && (
                  <div className="mt-1 text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>
                      {normalizedEmail.endsWith('@ktu.edu.gh')
                        ? 'Official KTU Institutional Domain Verified'
                        : isAdminOverride
                        ? 'Administrator Access Verified'
                        : 'Student Email Format Valid'}
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full h-11 px-3.5 pr-10 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span
                    className={`block text-[10px] mt-1 ${
                      isPasswordLongEnough ? 'text-emerald-600 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {isPasswordLongEnough ? 'Min 8 chars ✓' : 'At least 8 chars.'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full h-11 px-3.5 pr-10 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span
                    className={`block text-[10px] mt-1 ${
                      doPasswordsMatch ? 'text-emerald-600 font-medium' : 'text-rose-500'
                    }`}
                  >
                    {confirmPassword ? (doPasswordsMatch ? 'Passwords match ✓' : 'Must match password') : 'Confirm password'}
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Complete Registration & Enter Campus Feed &rarr;</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartCustomizingProfile}
                  className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-[0.99] text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Customize Academic Profile First (Level, Faculty, Bio) 🎓</span>
                </button>
              </div>
            </form>

            {/* Switch to Sign In */}
            <div className="pt-2 text-center border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Already registered with KTU?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 2: LOGIN PAGE (app/templates/auth/login.html)                   */}
        {/* =================================================================== */}
        {authMode === 'login' && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">Student Sign In</h1>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student ID, Username, or Institutional Email
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 0420230012@ktu.edu.gh or kwame_cs"
                    className="w-full h-11 px-3.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your student password"
                    className="w-full h-11 px-3.5 pr-10 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to KTU Social</span>
              </button>
            </form>

            {/* Switch to Register */}
            <div className="pt-2 text-center border-t border-slate-100">
              <p className="text-xs text-slate-500">
                New student at Koforidua Technical University?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 3: MULTI-STEP ONBOARDING (app/templates/auth/onboarding.html)   */}
        {/* =================================================================== */}
        {authMode === 'onboarding' && (
          <div className="space-y-5">
            {/* Step Indicator Header */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                <span>Student Academic Onboarding</span>
                <span className="text-indigo-600 font-mono">Step {onboardingStep} of 3</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${
                      s <= onboardingStep ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1: Basic Student Info (Gender Selection) */}
            {onboardingStep === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Step 1: Basic Student Info</h3>
                  <p className="text-xs text-slate-500">Select your gender to enable peer study and activity matching.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Gender Selection:</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'Male', label: 'Male', icon: '👨' },
                      { id: 'Female', label: 'Female', icon: '👩' },
                      { id: 'Prefer not to say', label: 'Prefer not to say', icon: '✨' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGender(g.id as any)}
                        className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          gender === g.id
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs scale-[1.02]'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-lg">{g.icon}</span>
                        <span className="text-center">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOnboardingStep(2)}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <span>Continue to Academic Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleSkipToFeed}
                    className="text-xs text-slate-500 hover:text-indigo-600 font-medium underline underline-offset-2 cursor-pointer"
                  >
                    Skip setup & enter campus feed directly &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Academic Details (Level, Faculty, Program) */}
            {onboardingStep === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Step 2: Academic Details</h3>
                  <p className="text-xs text-slate-500">Official KTU 2026 Academic Catalog alignment.</p>
                </div>

                {/* Level / Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Academic Level / Year:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['100', '200', '300', '400'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setLevel(lvl)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          level === lvl
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Level {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Faculty Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty / Department:</label>
                  <select
                    value={faculty}
                    onChange={(e) => {
                      const newFac = e.target.value;
                      setFaculty(newFac);
                      const availableCourses = KTU_ACADEMIC_CATALOG[newFac] || [];
                      if (availableCourses.length > 0) {
                        setCourse(availableCourses[0]);
                      }
                    }}
                    className="w-full h-11 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    {Object.keys(KTU_ACADEMIC_CATALOG).map((facName) => (
                      <option key={facName} value={facName}>
                        {facName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course of Study / Program */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course of Study / Program:</label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full h-11 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    {(KTU_ACADEMIC_CATALOG[faculty] || []).map((prog) => (
                      <option key={prog} value={prog}>
                        {prog}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(1)}
                    className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(3)}
                    className="flex-2 h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Continue to Avatar & Bio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleSkipToFeed}
                    className="text-xs text-slate-500 hover:text-indigo-600 font-medium underline underline-offset-2 cursor-pointer"
                  >
                    Skip setup & enter campus feed directly &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Avatar & Bio */}
            {onboardingStep === 3 && (
              <form onSubmit={handleFinishOnboarding} className="space-y-4 animate-in fade-in">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Step 3: Avatar & Bio (Optional)</h3>
                  <p className="text-xs text-slate-500">Pick your campus avatar and headline.</p>
                </div>

                {/* Avatar Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Choose Avatar:</label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          setCustomAvatarPreview(null);
                          setAvatarUrl(av.url);
                        }}
                        className={`p-1 rounded-2xl border-2 transition-transform cursor-pointer shrink-0 ${
                          avatarUrl === av.url && !customAvatarPreview
                            ? 'border-indigo-600 scale-105 shadow-xs'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={av.url} alt={av.label} className="w-12 h-12 rounded-xl object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campus Headline / Bio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Headline / Bio:</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Level 200 Computer Science student. Building open-source tools & studying in the library 📚"
                    className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(2)}
                    className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-2 h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finish & Enter Campus Feed</span>
                  </button>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleSkipToFeed}
                    className="text-xs text-slate-500 hover:text-indigo-600 font-medium underline underline-offset-2 cursor-pointer"
                  >
                    Skip setup & enter campus feed directly &rarr;
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Quick Demo Fast-Track Access Footer for Instant Evaluation */}
        <div className="pt-3 border-t border-slate-100 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fast Test Sign In:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDemoStudent}
              className="py-2 px-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-900 font-bold text-[11px] transition-colors cursor-pointer text-center"
            >
              🎓 Student (Kwame Mensah)
            </button>
            <button
              type="button"
              onClick={handleDemoAdmin}
              className="py-2 px-2.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-900 font-bold text-[11px] transition-colors cursor-pointer text-center"
            >
              👑 Admin (Bruce Doku)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
