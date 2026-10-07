import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Film,
  Music,
  Flame,
  Play,
  Pause,
  Plus,
  Search,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  BookOpen,
  Dice5,
  Send,
  Trash2,
  AlertTriangle,
  GraduationCap,
  Upload,
  MapPin,
  Shield,
  ShieldAlert,
  ArrowLeft,
  Radio,
  Ban,
  Clock,
  Flag,
  AlertCircle,
  Bookmark,
  Sparkles,
  Maximize2,
  Eye,
  Heart,
  ListVideo,
  Layers,
  Scissors,
  CheckCircle2,
  Copy,
  QrCode,
  ExternalLink,
  Repeat,
  Star,
  MessageCircle,
  Headphones,
  Mail,
  Smartphone,
  Link2,
  RotateCcw,
  SquarePen,
  MessageSquarePlus,
  Camera,
  ImagePlus,
  LogOut,
  LogIn,
  MoreVertical,
  CheckCheck,
  BellOff,
  UserX,
  BarChart2,
  Disc,
  Tag,
  RadioTower,
  Activity,
  FileText,
  Calendar,
  UserCheck,
  UserPlus,
  Download,
  Lock,
  Unlock,
  Pin,
  PinOff,
  EyeOff,
  Award,
  Menu,
  X,
  ChevronRight,
  Compass,
  Grid,
  HelpCircle
} from 'lucide-react';
import StudentOnboardingFlow from './components/StudentOnboardingFlow';
import KTULandingPage from './components/KTULandingPage';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import CampusPollWidget, { CampusPollItem } from './components/CampusPollWidget';
import KTURadioPlayer from './components/KTURadioPlayer';
import SoundPickerModal, { SoundItem } from './components/SoundPickerModal';
import NewChatModal, { CampusPeer, CAMPUS_STUDENTS } from './components/NewChatModal';
import StudentProfileView, { UserProfileData } from './components/StudentProfileView';
import AdminHubManager, { CampusNewsItem, CampusEventItem } from './components/AdminHubManager';
import KTULogo from './components/KTULogo';
import AdminUserControlModal, { StudentAccount as ModalStudentAccount } from './components/AdminUserControlModal';
import CampusBroadcastBanner, { BroadcastAlertItem } from './components/CampusBroadcastBanner';

interface VlogComment {
  id: number;
  author: string;
  studentId: string;
  faculty: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  userLiked?: boolean;
}

export interface SharePayload {
  type: 'vlog' | 'meme' | 'track' | 'course' | 'swap';
  id: number | string;
  title: string;
  subtitle: string;
  author: string;
  url: string;
  badge?: string;
  avatar?: string;
  imageBg?: string;
}

interface VlogItem {
  id: number;
  author: string;
  studentId: string;
  avatar: string;
  caption: string;
  duration: number;
  views: number;
  upvotes: number;
  downvotes: number;
  userVote: number;
  videoPlaceholderBg: string;
  timeAgo: string;
  videoTitle: string;
  facultyBadge: string;
  category: 'engineering' | 'business' | 'applied_sciences' | 'campus_life';
  soundTrack: string;
  location: string;
  comments: VlogComment[];
  isSaved?: boolean;
  videoSrcUrl?: string;
}

interface DirectMessage {
  id: number;
  sender_id: number;
  recipient_id: number;
  body: string;
  sender_username: string;
  created_at: string;
  is_mine: boolean;
}

interface ConversationItem {
  partner_id: number;
  partner_username: string;
  partner_student_id: string;
  partner_avatar: string;
  faculty: string;
  last_message: string;
  last_timestamp: string;
  unread_count: number;
  is_blocked: boolean;
  is_online: boolean;
}

interface ModerationReport {
  id: number;
  reporter_id: number;
  reporter_username: string;
  reporter_student_id: string;
  target_type: 'post' | 'comment' | 'vlog' | 'aux_submission' | 'review' | 'user';
  target_id: number;
  reason: 'harassment' | 'hate_speech' | 'illegal_content' | 'spam' | 'explicit_media' | 'impersonation';
  details: string;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  created_at: string;
  target_preview: string;
  is_anonymous: boolean;
  real_author?: {
    id: number;
    username: string;
    student_id: string;
    email: string;
    karma_score: number;
    is_suspended: boolean;
    is_banned: boolean;
    is_anonymous_to_public: boolean;
  };
}

interface ModLogItem {
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

export interface CurrentStudentUser {
  id: number;
  full_name: string;
  name?: string;
  username: string;
  student_id: string;
  email: string;
  gender: 'male' | 'female' | 'Prefer not to say' | string;
  level: 100 | 200 | 300 | 400 | number;
  faculty: string;
  program: string;
  avatar: string;
  avatar_url?: string;
  bio: string;
  is_admin: boolean;
  role?: 'admin' | 'student' | 'moderator' | string;
  is_verified: boolean;
  is_onboarded: boolean;
  is_muted?: boolean;
  muted_until?: string;
  is_suspended?: boolean;
  suspension_until?: string;
  is_banned?: boolean;
  is_shadowbanned?: boolean;
}

export default function App() {
  const ADMIN_EMAIL = 'brucedoku3@gmail.com';

  // Current student user profile
  const [currentUser, setCurrentUser] = useState<CurrentStudentUser>(() => {
    try {
      const saved = localStorage.getItem('ktu_active_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase() ||
          parsed.email?.toLowerCase().trim() === 'brucedoku3@gmail.com' ||
          parsed.email?.toLowerCase().trim().startsWith('brucedoku') ||
          parsed.username?.toLowerCase().trim().startsWith('brucedoku') ||
          parsed.email?.toLowerCase().trim() === 'bruce20597216248@gmail.com'
        ) {
          parsed.is_admin = true;
          parsed.role = 'admin';
        }
        return parsed;
      }
    } catch (e) {}
    return {
      id: 1,
      full_name: 'Bruce Doku',
      name: 'Bruce Doku',
      username: 'brucedoku',
      student_id: 'ADMIN-001',
      email: 'brucedoku3@gmail.com',
      gender: 'male' as 'male' | 'female',
      level: 200 as 100 | 200 | 300 | 400,
      faculty: 'Directorate of Student Affairs & Engineering',
      program: 'Super-Administrator & Dean Oversight',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Dean of Student Affairs & Super-Administrator for KTU CampusSocial.',
      is_admin: true,
      role: 'admin',
      is_verified: true,
      is_onboarded: true,
    };
  });

  // User authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const stored = localStorage.getItem('ktu_is_logged_in');
      return stored !== null ? stored === 'true' : true;
    } catch (e) {
      return true;
    }
  });

  // Admin verification hook for brucedoku3@gmail.com
  useEffect(() => {
    const email = currentUser?.email?.toLowerCase().trim();
    const username = currentUser?.username?.toLowerCase().trim();
    if (
      email === ADMIN_EMAIL.toLowerCase() ||
      email === 'brucedoku3@gmail.com' ||
      email?.startsWith('brucedoku') ||
      username?.startsWith('brucedoku') ||
      email === 'bruce20597216248@gmail.com'
    ) {
      if (!currentUser.is_admin || currentUser.role !== 'admin') {
        const adminProfile = { ...currentUser, is_admin: true, role: 'admin' };
        setCurrentUser(adminProfile);
        try {
          localStorage.setItem('ktu_active_user', JSON.stringify(adminProfile));
        } catch (e) {}
      }
    }
  }, [currentUser?.email, currentUser?.username, currentUser?.is_admin, currentUser?.role]);

  const loginAsBruceAdmin = () => {
    const adminProfile: CurrentStudentUser = {
      id: 1,
      full_name: 'Bruce Doku',
      name: 'Bruce Doku',
      username: 'brucedoku',
      student_id: 'ADMIN-001',
      email: ADMIN_EMAIL,
      gender: 'male',
      level: 200,
      faculty: 'Directorate of Student Affairs & Engineering',
      program: 'Super-Administrator & Dean Oversight',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Dean of Student Affairs & Super-Administrator for KTU CampusSocial.',
      is_admin: true,
      is_verified: true,
      is_onboarded: true,
    };
    setCurrentUser(adminProfile);
    setIsLoggedIn(true);
    triggerToast('👑 Authenticated as Super-Admin (Bruce Doku)! Full safety and moderation controls active.');
  };

  const loginAsStudentKwame = () => {
    const studentProfile: CurrentStudentUser = {
      id: 2,
      full_name: 'Kwame Mensah',
      name: 'Kwame Mensah',
      username: 'kwame_cs',
      student_id: '0420230012',
      email: '0420230012@ktu.edu.gh',
      gender: 'male',
      level: 200,
      faculty: 'Faculty of Applied Science and Technology (FAST)',
      program: 'B.Tech Computer Science',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      bio: 'Level 200 Computer Science student. Midnight React & Flask developer.',
      is_admin: false,
      is_verified: true,
      is_onboarded: true,
    };
    setCurrentUser(studentProfile);
    setActiveTab('vlogs');
    triggerToast('Switched to verified student view (@kwame_cs).');
  };

  // Sync session changes
  useEffect(() => {
    try {
      localStorage.setItem('ktu_active_user', JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('ktu_is_logged_in', isLoggedIn ? 'true' : 'false');
    } catch (e) {}
  }, [isLoggedIn]);

  // Top navigation tabs
  const [activeTab, setActiveTab] = useState<'vlogs' | 'chat' | 'memes' | 'aux' | 'hub' | 'admin' | 'profile' | 'onboarding'>('vlogs');

  // Official KTU Mobile Menu Drawer state (matching ktu.edu.gh)
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [expandedNavCategory, setExpandedNavCategory] = useState<string | null>(null);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [desktopDropdown, setDesktopDropdown] = useState<'campus' | 'academics' | 'hub' | 'about' | null>(null);
  const [menuFilterQuery, setMenuFilterQuery] = useState('');

  // RBAC Guard: If logged-in user is not an admin, immediately redirect away from admin tab
  useEffect(() => {
    if (!currentUser.is_admin && activeTab === 'admin') {
      setActiveTab('vlogs');
    }
  }, [currentUser.is_admin, activeTab]);
  
  // Hub sub-tabs: news | polls | events | roulette | reviews | swap
  const [hubSection, setHubSection] = useState<'news' | 'polls' | 'events' | 'roulette' | 'reviews' | 'swap'>('news');
  const [showAdminHubDrawer, setShowAdminHubDrawer] = useState(false);

  // Viewing user profile state
  const [viewingProfileUser, setViewingProfileUser] = useState<UserProfileData | null>(null);

  // Hub News state
  const [hubNewsList, setHubNewsList] = useState<CampusNewsItem[]>([
    {
      id: 1,
      title: '2026 Second Semester Mid-Semester Examination Timetable Officially Released',
      category: 'Exams',
      date: '2h ago',
      author: 'KTU Directorate of Examinations',
      imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
      content: 'All undergraduate and diploma students are notified that the mid-semester examination timetable has been officially uploaded to the student boards. FOE, FAST, and FBMS venues will be strictly adhered to. Report any clashes to your faculty exams officer before Friday.',
      isPinned: true,
    },
    {
      id: 2,
      title: 'KTU Radio 87.7 FM Launches Annual Campus Aux Championship 2026',
      category: 'Campus Life',
      date: 'Yesterday',
      author: 'KTU Media & Broadcasting Board',
      imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80',
      content: 'Tune in to 87.7 FM daily at 3:00 PM for the official student Aux Battle showdown! Weekly winning tracks receive official campus airplay rotation and recording studio sessions sponsored by the SRC.',
      isPinned: false,
    },
    {
      id: 3,
      title: 'SRC Welfare Notice: Subsidized Campus WiFi Expansion to All Hostels',
      category: 'SRC',
      date: '2 days ago',
      author: 'SRC Public Relations Office',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      content: 'High-speed fiber connectivity has now been extended to Universal Hall, GETFund Hostels, and the Food Village perimeter. Students can connect with their student email credentials for 24/7 research access.',
      isPinned: false,
    },
  ]);

  // Hub Events state
  const [hubEventsList, setHubEventsList] = useState<CampusEventItem[]>([
    {
      id: 1,
      title: 'Annual KTU Engineering & Tech Exhibition 2026',
      venue: 'FOE Multipurpose Complex & Great Hall',
      date: 'Friday, Oct 24',
      time: '09:00 AM - 4:00 PM',
      organizer: 'Faculty of Engineering & FAST Association',
      description: 'Showcasing solar-powered vehicles, embedded IoT systems, robotics, and student software projects with industry partners.',
    },
    {
      id: 2,
      title: 'SRC Grand Hall Mega Freshers Welcome Jam',
      venue: 'KTU Sports Pavilion Grounds',
      date: 'Saturday, Nov 1',
      time: '7:00 PM Till Dawn',
      organizer: 'KTU SRC Entertainment Committee & 87.7 FM',
      description: 'Featuring top guest performances, student Aux Battle championship finals, and food vendor stalls.',
    },
    {
      id: 3,
      title: 'Career & Professional Resume Clinic with Industry Mentors',
      venue: 'CCB Conference Room 2',
      date: 'Wednesday, Nov 5',
      time: '2:00 PM',
      organizer: 'Directorate of Student Affairs & FBMS',
      description: 'Free CV review, mock technical interviews, and procurement & software internships matching.',
    },
  ]);

  const openUserProfile = (username: string) => {
    const peer = CAMPUS_STUDENTS.find((s) => s.username.toLowerCase() === username.toLowerCase());
    const isSelf = username.toLowerCase() === currentUser.username.toLowerCase();
    const profile: UserProfileData = {
      username: username,
      name: peer?.name || (isSelf ? (currentUser.name || currentUser.full_name) : `@${username}`),
      student_id: peer?.studentId || (isSelf ? currentUser.student_id : 'KTU/VERIFIED/PEER'),
      email: isSelf ? currentUser.email : `${username}@st.ktu.edu.gh`,
      phone: isSelf ? '024 555 8921' : undefined,
      faculty: peer?.faculty || (isSelf ? currentUser.faculty : 'KTU Faculty'),
      department: peer?.department || (isSelf ? (currentUser.faculty.includes('Science') ? 'Computer Science' : 'Engineering') : 'Undergraduate Studies'),
      level: isSelf ? 'Level 300' : 'Level 200',
      hostel: isSelf ? 'Universal Hall, Block C' : 'Campus Residence',
      avatar_url: peer?.avatar || (isSelf ? (currentUser.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80') : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80'),
      bio: peer?.statusText || (isSelf ? (currentUser.bio || 'Official KTU student. Creating campus memes, tuning in to 87.7 FM, and building cool projects.') : 'Verified student on KTU CampusSocial.'),
      followers_count: isSelf ? 184 : 142,
      following_count: isSelf ? 92 : 76,
      likes_total: isSelf ? 1250 : 820,
      is_verified: true,
    };
    setViewingProfileUser(profile);
    setActiveTab('profile');
  };

  const handlePublishAdminPoll = (newPollData: { question: string; category: string; options: string[] }) => {
    const newPoll: CampusPollItem = {
      id: Date.now(),
      question: newPollData.question,
      author: currentUser.username,
      authorStudentId: currentUser.student_id,
      authorAvatar: currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      faculty: currentUser.faculty,
      createdAt: 'Just now',
      category: newPollData.category || 'Campus Life',
      userVotedOptionId: null,
      options: newPollData.options.map((opt, i) => ({
        id: Date.now() + i + 1,
        text: opt,
        votes: 0,
      })),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('ktu_campus_polls') || '[]');
      localStorage.setItem('ktu_campus_polls', JSON.stringify([newPoll, ...existing]));
    } catch (e) {}

    triggerToast(`📊 Poll "${newPoll.question}" launched to KTU Hub & Feed!`);
    setHubSection('polls');
  };

  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Hidden file input ref for local video selection
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // 1. TIKTOK-STYLE CAMPUS VLOGS FEED (AUTHENTIC TIKTOK FYP INTERFACE)
  // ---------------------------------------------------------------------------
  const [activeVlogIndex, setActiveVlogIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [vlogProgress, setVlogProgress] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverScrubPercent, setHoverScrubPercent] = useState<number | null>(null);
  const [scrubPreviewSeconds, setScrubPreviewSeconds] = useState<number | null>(null);
  const scrubberContainerRef = useRef<HTMLDivElement>(null);
  const wasPlayingBeforeScrubRef = useRef<boolean>(true);
  const currentVideoRef = useRef<HTMLVideoElement | null>(null);
  const [vlogFeedSubTab, setVlogFeedSubTab] = useState<'foryou' | 'following'>('foryou');
  const [showVlogComments, setShowVlogComments] = useState(false);
  const [showVlogCreator, setShowVlogCreator] = useState(false);
  const [vlogCommentInput, setVlogCommentInput] = useState('');
  const [followedCreators, setFollowedCreators] = useState<Record<string, boolean>>({});
  const [tiktokHearts, setTiktokHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Vertical swipe, touch, and drag gestures (flowing TikTok reel)
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [showPlayIconPulse, setShowPlayIconPulse] = useState(false);
  const lastWheelTime = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const touchStartTimeRef = useRef<number>(0);
  const isDragMoveRef = useRef<boolean>(false);

  // Upload modal state (Only: Story Title, Caption, Hashtags, and Local Device Video File)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadHashtags, setUploadHashtags] = useState('');
  const [localVideoFile, setLocalVideoFile] = useState<File | null>(null);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);

  const [vlogsList, setVlogsList] = useState<VlogItem[]>([
    {
      id: 2,
      author: 'adwoa_procure',
      studentId: 'KTU/FBMS/PSC/22/114',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      caption: 'Golden hour walk from CCB block past the University Library towards GETFund Hostel 👤✨ #campusvibes #ktu',
      duration: 30.0,
      views: 730,
      upvotes: 219,
      downvotes: 1,
      userVote: 0,
      videoPlaceholderBg: 'from-amber-900 via-orange-950 to-stone-900',
      timeAgo: '3h ago',
      videoTitle: 'GETFund & Central Library Sunset',
      facultyBadge: 'FBMS · Procurement',
      category: 'campus_life',
      soundTrack: 'Kweku Smoke - Kweku Playman · KTU Aux Battle',
      location: 'Central Library Walkway to GETFund Hostels',
      comments: [
        {
          id: 3,
          author: 'ama_stats',
          studentId: '04/2023/0201D',
          faculty: 'FAST · Statistics',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
          text: 'The evening breeze along that GETFund avenue hits so differently after 6 hours of continuous lectures.',
          time: '2h ago',
          likes: 18,
          userLiked: true,
        },
      ],
    },
    {
      id: 1,
      author: 'kofi_eng',
      studentId: 'KTU/FOE/AUT/23/041',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      caption: 'Testing the diagnostic scanner in the New 5-Storey Multipurpose Engineering Facility! 🚗⚡ #ktu #foe #practicals',
      duration: 30.0,
      views: 482,
      upvotes: 114,
      downvotes: 2,
      userVote: 1,
      videoPlaceholderBg: 'from-blue-900 via-indigo-950 to-slate-900',
      timeAgo: '1h ago',
      videoTitle: 'Engineering Multipurpose Facility Lab',
      facultyBadge: 'FOE · Automotive',
      category: 'engineering',
      soundTrack: 'King Paluta - Makoma · KTU Radio 87.7 FM',
      location: 'New 5-Storey Multipurpose Engineering Facility (Room E-102)',
      comments: [
        {
          id: 1,
          author: 'yaw_telecom',
          studentId: '04/2024/0082D',
          faculty: 'FOE · Electrical',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
          text: 'The new OBD-II diagnostic sensors in FOE are top tier! Are you guys doing the transmission practicals tomorrow?',
          time: '45m ago',
          likes: 14,
          userLiked: true,
        },
        {
          id: 2,
          author: 'adwoa_procure',
          studentId: '04/2022/1149D',
          faculty: 'FBMS · Procurement',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
          text: 'Engineering students always getting the brand new building equipment while FBMS is still fighting for seats at CCB 😂',
          time: '30m ago',
          likes: 29,
          userLiked: false,
        },
      ],
    },
    {
      id: 3,
      author: 'yaw_telecom',
      studentId: 'KTU/FOE/ELE/24/008',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      caption: 'Antenna frequency tuning in the Telecom lab before our mid-sem test. Pray for us! 📡🔌 #ktuelite',
      duration: 28.0,
      views: 294,
      upvotes: 68,
      downvotes: 4,
      userVote: 0,
      videoPlaceholderBg: 'from-cyan-900 via-sky-950 to-slate-900',
      timeAgo: '5h ago',
      videoTitle: 'Telecoms Frequency Calibration',
      facultyBadge: 'FOE · Electrical',
      category: 'engineering',
      soundTrack: 'Sarkodie - Labadi · KTU Campus Aux',
      location: 'Telecoms Transmission Lab (FOE Block B)',
      comments: [
        {
          id: 4,
          author: 'kofi_eng',
          studentId: 'KTU/FOE/AUT/23/041',
          faculty: 'FOE · Automotive',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          text: 'Make sure you calibrate the standing wave ratio before Lecturer Asare enters the lab 😂',
          time: '4h ago',
          likes: 12,
        },
      ],
    },
    {
      id: 4,
      author: 'kwame_cs',
      studentId: 'KTU/FAST/CS/23/089',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      caption: 'Midnight React & Flask API debugging sprint at CCB Computer Lab 2! Almost ready for deployment 💻🚀 #fast #ktu',
      duration: 30.0,
      views: 512,
      upvotes: 187,
      downvotes: 3,
      userVote: 0,
      videoPlaceholderBg: 'from-emerald-950 via-teal-950 to-slate-950',
      timeAgo: '6h ago',
      videoTitle: 'CCB Computer Lab 2 Coding Sprint',
      facultyBadge: 'FAST · Computer Science',
      category: 'applied_sciences',
      soundTrack: 'Black Sherif - Kwaku the Traveller',
      location: 'CCB Computer Science Laboratory 2',
      comments: [
        {
          id: 5,
          author: 'ama_stats',
          studentId: '04/2023/0201D',
          faculty: 'FAST · Applied Statistics',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
          text: 'The air conditioning in Lab 2 is the only reason students survive mid-sems! Keep pushing team!',
          time: '5h ago',
          likes: 21,
        },
      ],
    },
    {
      id: 5,
      author: 'akosua_food',
      studentId: 'KTU/FAST/HCI/24/019',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      caption: 'Fresh waakye and fried plantain fresh out the pot at Food Village near Haleluya! 🍛😋 Best breakfast on campus #ktufoodie',
      duration: 30.0,
      views: 890,
      upvotes: 342,
      downvotes: 0,
      userVote: 1,
      videoPlaceholderBg: 'from-rose-950 via-amber-950 to-stone-900',
      timeAgo: '7h ago',
      videoTitle: 'Food Village Morning Waakye Line',
      facultyBadge: 'FAST · Hospitality',
      category: 'campus_life',
      soundTrack: 'Kuami Eugene - Monica',
      location: 'Food Village Canteen Pavilions (Near Haleluya)',
      comments: [
        {
          id: 6,
          author: 'yaw_telecom',
          studentId: 'KTU/FOE/ELE/24/008',
          faculty: 'FOE · Electrical',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
          text: 'The shito there is certified 10/10. Line was around the block by 8:30 AM!',
          time: '6h ago',
          likes: 35,
        },
      ],
    },
  ]);

  // 30-Second Vlog auto-playback progress timer (pauses while scrubbing)
  useEffect(() => {
    if (!isPlaying || activeTab !== 'vlogs' || isScrubbing) return;

    const currentVlog = vlogsList[activeVlogIndex];
    const totalDuration = currentVlog?.duration || 30;
    const intervalMs = 100;
    const stepPercent = 100 / (totalDuration * (1000 / intervalMs));

    const timer = setInterval(() => {
      setVlogProgress((prev) => {
        if (prev >= 100) {
          // In TikTok, videos loop seamlessly while user stays on the reel!
          return 0;
        }
        return prev + stepPercent;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, activeTab, activeVlogIndex, vlogsList, isScrubbing]);

  // Sync playing and muted states with current HTML video element if present
  useEffect(() => {
    if (!currentVideoRef.current) return;
    if (isPlaying && !isScrubbing) {
      currentVideoRef.current.play().catch(() => {});
    } else {
      currentVideoRef.current.pause();
    }
  }, [isPlaying, isScrubbing, activeVlogIndex]);

  useEffect(() => {
    if (currentVideoRef.current) {
      currentVideoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Helper to format video seconds into M:SS
  const formatVlogTime = (sec: number) => {
    const totalSec = Math.max(0, Math.floor(sec));
    const mins = Math.floor(totalSec / 60);
    const remainder = totalSec % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  // Calculate percentage from clientX relative to scrubber bar container
  const getScrubPercentageFromClientX = (clientX: number): number => {
    if (!scrubberContainerRef.current) return 0;
    const rect = scrubberContainerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const offsetX = clientX - rect.left;
    return Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
  };

  // Seek video and update progress state
  const applyVlogSeek = (percent: number) => {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    setVlogProgress(clampedPercent);
    const currentVlog = vlogsList[activeVlogIndex];
    const totalDuration = currentVlog?.duration || 30;
    const targetSeconds = (clampedPercent / 100) * totalDuration;
    setScrubPreviewSeconds(targetSeconds);

    if (currentVideoRef.current) {
      const vidDur = currentVideoRef.current.duration;
      const effectiveDur = vidDur && !isNaN(vidDur) && vidDur > 0 ? vidDur : totalDuration;
      currentVideoRef.current.currentTime = (clampedPercent / 100) * effectiveDur;
    }
  };

  // Seek by relative seconds (e.g. +3s, -3s, +5s, -5s)
  const seekVlogRelativeSeconds = (secondsDelta: number) => {
    const currentVlog = vlogsList[activeVlogIndex];
    const totalDuration = currentVlog?.duration || 30;
    const currentSeconds = (vlogProgress / 100) * totalDuration;
    const targetSeconds = Math.max(0, Math.min(totalDuration, currentSeconds + secondsDelta));
    const targetPercent = (targetSeconds / totalDuration) * 100;
    applyVlogSeek(targetPercent);
  };

  // Mouse drag handler for clickable & draggable progress scrubber
  const handleScrubberMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    wasPlayingBeforeScrubRef.current = isPlaying;
    setIsScrubbing(true);

    const initialPercent = getScrubPercentageFromClientX(e.clientX);
    applyVlogSeek(initialPercent);

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const nextPercent = getScrubPercentageFromClientX(moveEvent.clientX);
      applyVlogSeek(nextPercent);
    };

    const onMouseUp = () => {
      setIsScrubbing(false);
      setScrubPreviewSeconds(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (wasPlayingBeforeScrubRef.current) {
        setIsPlaying(true);
        if (currentVideoRef.current) {
          currentVideoRef.current.play().catch(() => {});
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Touch drag handler for mobile/touch screens
  const handleScrubberTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!e.touches || e.touches.length === 0) return;
    wasPlayingBeforeScrubRef.current = isPlaying;
    setIsScrubbing(true);

    const initialTouch = e.touches[0];
    const initialPercent = getScrubPercentageFromClientX(initialTouch.clientX);
    applyVlogSeek(initialPercent);

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (!moveEvent.touches || moveEvent.touches.length === 0) return;
      moveEvent.preventDefault();
      const nextPercent = getScrubPercentageFromClientX(moveEvent.touches[0].clientX);
      applyVlogSeek(nextPercent);
    };

    const onTouchEnd = () => {
      setIsScrubbing(false);
      setScrubPreviewSeconds(null);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      if (wasPlayingBeforeScrubRef.current) {
        setIsPlaying(true);
        if (currentVideoRef.current) {
          currentVideoRef.current.play().catch(() => {});
        }
      }
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
  };

  // Vertical navigation (flowing TikTok reel)
  const goToNextVlog = () => {
    setActiveVlogIndex((curr) => (curr + 1) % vlogsList.length);
    setDragOffsetY(0);
    setVlogProgress(0);
    setIsScrubbing(false);
    setHoverScrubPercent(null);
    setScrubPreviewSeconds(null);
    setIsPlaying(true);
    setShowVlogComments(false);
    setShowVlogCreator(false);
  };

  const goToPrevVlog = () => {
    setActiveVlogIndex((curr) => (curr - 1 + vlogsList.length) % vlogsList.length);
    setDragOffsetY(0);
    setVlogProgress(0);
    setIsScrubbing(false);
    setHoverScrubPercent(null);
    setScrubPreviewSeconds(null);
    setIsPlaying(true);
    setShowVlogComments(false);
    setShowVlogCreator(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, .no-swipe')) return;
    setTouchStartY(e.touches[0].clientY);
    touchStartTimeRef.current = Date.now();
    setIsDragging(true);
    setDragOffsetY(0);
    isDragMoveRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (Math.abs(diff) > 5) {
      isDragMoveRef.current = true;
    }
    // Damping resistance at top and bottom bounds
    if ((activeVlogIndex === 0 && diff > 0) || (activeVlogIndex === vlogsList.length - 1 && diff < 0)) {
      setDragOffsetY(diff * 0.35);
    } else {
      setDragOffsetY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      const elapsed = Date.now() - touchStartTimeRef.current;
      const isQuickFlick = elapsed < 350 && Math.abs(dragOffsetY) > 25;
      if (dragOffsetY < -50 || (isQuickFlick && dragOffsetY < -20)) {
        goToNextVlog();
      } else if (dragOffsetY > 50 || (isQuickFlick && dragOffsetY > 20)) {
        goToPrevVlog();
      } else {
        setDragOffsetY(0);
      }
    }
    setIsDragging(false);
    setTouchStartY(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, .no-swipe')) return;
    setTouchStartY(e.clientY);
    touchStartTimeRef.current = Date.now();
    setIsDragging(true);
    setDragOffsetY(0);
    isDragMoveRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || touchStartY === null) return;
    const diff = e.clientY - touchStartY;
    if (Math.abs(diff) > 5) {
      isDragMoveRef.current = true;
    }
    if ((activeVlogIndex === 0 && diff > 0) || (activeVlogIndex === vlogsList.length - 1 && diff < 0)) {
      setDragOffsetY(diff * 0.35);
    } else {
      setDragOffsetY(diff);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging && touchStartY !== null) {
      const diff = e.clientY - touchStartY;
      const elapsed = Date.now() - touchStartTimeRef.current;
      const isQuickFlick = elapsed < 350 && Math.abs(diff) > 25;
      if (diff < -50 || (isQuickFlick && diff < -20)) {
        goToNextVlog();
      } else if (diff > 50 || (isQuickFlick && diff > 20)) {
        goToPrevVlog();
      } else {
        setDragOffsetY(0);
      }
    }
    setIsDragging(false);
    setTouchStartY(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 450) return;
    if (e.deltaY > 20) {
      lastWheelTime.current = now;
      goToNextVlog();
    } else if (e.deltaY < -20) {
      lastWheelTime.current = now;
      goToPrevVlog();
    }
  };

  // TikTok double-tap to like with popping heart animation & single-tap play/pause
  const handleTikTokTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragMoveRef.current || Math.abs(dragOffsetY) > 6) return;
    if ((e.target as HTMLElement).closest('button, input, textarea, a, .no-swipe')) return;
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (now - lastTapTimeRef.current < 300) {
      // Double tap!
      const currentVlog = vlogsList[activeVlogIndex];
      if (currentVlog && currentVlog.userVote !== 1) {
        handleVlogVote(currentVlog.id, 1);
      }
      const heartId = Date.now() + Math.random();
      setTiktokHearts((prev) => [...prev, { id: heartId, x, y }]);
      setTimeout(() => {
        setTiktokHearts((prev) => prev.filter((h) => h.id !== heartId));
      }, 900);
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
      setTimeout(() => {
        if (lastTapTimeRef.current === now) {
          setIsPlaying((p) => !p);
          setShowPlayIconPulse(true);
          setTimeout(() => setShowPlayIconPulse(false), 500);
        }
      }, 300);
    }
  };

  const handleToggleFollowCreator = (author: string) => {
    setFollowedCreators((prev) => {
      const nextState = !prev[author];
      triggerToast(nextState ? `Followed @${author}!` : `Unfollowed @${author}`);
      return { ...prev, [author]: nextState };
    });
  };

  // Keyboard navigation for vlogs
  useEffect(() => {
    if (activeTab !== 'vlogs') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowDown' || e.code === 'KeyJ') {
        e.preventDefault();
        goToNextVlog();
      } else if (e.code === 'ArrowUp' || e.code === 'KeyK') {
        e.preventDefault();
        goToPrevVlog();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekVlogRelativeSeconds(-3);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekVlogRelativeSeconds(3);
      } else if (e.code === 'KeyM') {
        setIsMuted((m) => !m);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, vlogsList.length, activeVlogIndex, vlogProgress]);

  // ---------------------------------------------------------------------------
  // 2. PEER-TO-PEER MESSAGING ENGINE STATE
  // ---------------------------------------------------------------------------
  const [conversations, setConversations] = useState<ConversationItem[]>([
    {
      partner_id: 2,
      partner_username: 'adwoa_procure',
      partner_student_id: '04/2022/1149D',
      partner_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      faculty: 'FBMS · Procurement',
      last_message: 'Are you joining the study group at Central Library 2nd floor?',
      last_timestamp: '10:42 AM',
      unread_count: 2,
      is_blocked: false,
      is_online: true,
    },
    {
      partner_id: 3,
      partner_username: 'yaw_telecom',
      partner_student_id: '04/2024/0082D',
      partner_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      faculty: 'FOE · Electrical',
      last_message: 'Thanks for the SolidWorks tutorial notes bro!',
      last_timestamp: 'Yesterday',
      unread_count: 0,
      is_blocked: false,
      is_online: false,
    },
    {
      partner_id: 4,
      partner_username: 'ama_stats',
      partner_student_id: '04/2023/0201D',
      partner_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
      faculty: 'FAST · Applied Statistics',
      last_message: 'See you at Food Village near Haleluya.',
      last_timestamp: 'Oct 2',
      unread_count: 0,
      is_blocked: false,
      is_online: true,
    },
  ]);

  const [activePartnerUsername, setActivePartnerUsername] = useState<string>('adwoa_procure');
  const [mobileChatView, setMobileChatView] = useState<'list' | 'chat'>('list');
  const [showChatMoreMenu, setShowChatMoreMenu] = useState(false);
  const [mutedPartners, setMutedPartners] = useState<Record<string, boolean>>({});
  const [blockedPartners, setBlockedPartners] = useState<Record<string, boolean>>({});
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [socketConnected, setSocketConnected] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatInput, setNewChatInput] = useState('');

  // Reusable Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemPreview?: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
    iconType?: 'trash' | 'alert' | 'shield';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerDeleteConfirm = (config: {
    title: string;
    message: string;
    itemPreview?: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
    iconType?: 'trash' | 'alert' | 'shield';
    onConfirm: () => void;
  }) => {
    setDeleteModal({
      ...config,
      isOpen: true,
    });
  };

  const [messageThreads, setMessageThreads] = useState<Record<string, DirectMessage[]>>({
    adwoa_procure: [
      {
        id: 101,
        sender_id: 2,
        recipient_id: 1,
        body: 'Hey Kofi! Did you finish the lab report for Fluid Mechanics?',
        sender_username: 'adwoa_procure',
        created_at: '10:30 AM',
        is_mine: false,
      },
      {
        id: 102,
        sender_id: 1,
        recipient_id: 2,
        body: 'Almost done! Just running the flow calculation tables now.',
        sender_username: 'kofi_eng',
        created_at: '10:35 AM',
        is_mine: true,
      },
      {
        id: 103,
        sender_id: 2,
        recipient_id: 1,
        body: 'Are you joining the study group at Central Library 2nd floor?',
        sender_username: 'adwoa_procure',
        created_at: '10:42 AM',
        is_mine: false,
      },
    ],
    yaw_telecom: [
      {
        id: 201,
        sender_id: 1,
        recipient_id: 3,
        body: 'Sent you the CAD templates on the drive.',
        sender_username: 'kofi_eng',
        created_at: 'Yesterday',
        is_mine: true,
      },
      {
        id: 202,
        sender_id: 3,
        recipient_id: 1,
        body: 'Thanks for the SolidWorks tutorial notes bro!',
        sender_username: 'yaw_telecom',
        created_at: 'Yesterday',
        is_mine: false,
      },
    ],
    ama_stats: [
      {
        id: 301,
        sender_id: 4,
        recipient_id: 1,
        body: 'See you at Food Village near Haleluya.',
        sender_username: 'ama_stats',
        created_at: 'Oct 2',
        is_mine: false,
      },
    ],
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat balloon viewport
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messageThreads, activePartnerUsername]);

  // ---------------------------------------------------------------------------
  // 3. SAFETY ENGINE & ADMIN COMMAND CENTER STATE (PROMPT 4.1 & 4.2)
  // ---------------------------------------------------------------------------
  const [adminTab, setAdminTab] = useState<'queue' | 'tracing' | 'users' | 'hub_manager' | 'broadcast' | 'audit'>('queue');
  const [selectedTraceReportId, setSelectedTraceReportId] = useState<number | null>(1);
  const [manualTraceInput, setManualTraceInput] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Super-Admin Social Media User Control Modal State
  const [isUserControlModalOpen, setIsUserControlModalOpen] = useState(false);
  const [selectedUserForAdminControl, setSelectedUserForAdminControl] = useState<StudentAccount | null>(null);

  // Content moderation controls: Pinning & comment locks
  const [pinnedMemePostIds, setPinnedMemePostIds] = useState<number[]>([1]);
  const [lockedMemePostComments, setLockedMemePostComments] = useState<Record<number, boolean>>({});

  // Campus-wide emergency/advisory broadcast system state
  const [campusBroadcast, setCampusBroadcast] = useState<BroadcastAlertItem | null>({
    id: 'broadcast-1',
    title: 'KTU Semester Safety & Academic Advisory',
    message: 'All mid-semester continuous assessment tests are ongoing across faculties. Check your department noticeboard and portal for hall allocations.',
    severity: 'official',
    active: true,
    dismissible: true,
    created_at: 'Today, 8:00 AM',
    author: 'KTU Administration / SRC',
  });

  // Super-Admin User Management Handler (look up by account object or username)
  const handleOpenAdminUserControl = (target: StudentAccount | string) => {
    if (typeof target === 'string') {
      const existing = studentAccounts.find(
        (s) => s.username.toLowerCase() === target.toLowerCase()
      );
      if (existing) {
        setSelectedUserForAdminControl(existing);
      } else {
        const peer = CAMPUS_STUDENTS.find(
          (p) => p.username.toLowerCase() === target.toLowerCase()
        );
        const newAcc: StudentAccount = {
          id: Date.now(),
          student_id: peer?.studentId || `04/2024/${Math.floor(1000 + Math.random() * 9000)}D`,
          username: target,
          email: `${target.toLowerCase()}@st.ktu.edu.gh`,
          karma_score: 50,
          role: 'student',
          is_suspended: false,
          is_banned: false,
          faculty: peer?.faculty || 'KTU Student Body',
        };
        setStudentAccounts((prev) => [...prev, newAcc]);
        setSelectedUserForAdminControl(newAcc);
      }
    } else {
      setSelectedUserForAdminControl(target);
    }
    setIsUserControlModalOpen(true);
  };

  const handleUpdateUserFromControlModal = (
    updated: StudentAccount,
    log: Omit<ModLogItem, 'id'>,
    _customAction?: string
  ) => {
    setStudentAccounts((prev) =>
      prev.map((s) => (s.id === updated.id || s.username === updated.username ? updated : s))
    );
    setModLogsList((prev) => [
      {
        id: Date.now(),
        ...log,
      },
      ...prev,
    ]);
    setSelectedUserForAdminControl(updated);
  };

  const handleNukeUserContent = (username: string) => {
    setMemePosts((prev) => prev.filter((p) => p.author !== username));
    setVlogsList((prev) => prev.filter((v) => v.author !== username));
    setModLogsList((prev) => [
      {
        id: Date.now(),
        admin_username: currentUser.username,
        action: 'purge_user_content',
        target_type: 'user',
        target_id: username,
        reason_given: `Complete purge / nuke of all posts and vlogs by @${username}`,
        timestamp: 'Just now',
      },
      ...prev,
    ]);
    triggerToast(`All content authored by @${username} has been permanently purged.`);
  };

  const handleIssueFormalWarning = (username: string, memo: string, subject: string) => {
    setStudentAccounts((prev) =>
      prev.map((s) =>
        s.username === username
          ? { ...s, admin_warnings_count: (s.admin_warnings_count || 0) + 1 }
          : s
      )
    );
    setModLogsList((prev) => [
      {
        id: Date.now(),
        admin_username: currentUser.username,
        action: 'warn',
        target_type: 'user',
        target_id: username,
        reason_given: `Disciplinary warning: ${subject} - ${memo.slice(0, 60)}...`,
        timestamp: 'Just now',
      },
      ...prev,
    ]);
    triggerToast(`Formal disciplinary warning issued to @${username}.`);
  };

  const handleTogglePinPost = (postId: number) => {
    setPinnedMemePostIds((prev) => {
      const isPinned = prev.includes(postId);
      const next = isPinned ? prev.filter((id) => id !== postId) : [postId, ...prev];
      setModLogsList((logPrev) => [
        {
          id: Date.now(),
          admin_username: currentUser.username,
          action: 'warn',
          target_type: 'post',
          target_id: postId,
          reason_given: isPinned ? 'Unpinned post from campus feed' : 'Pinned post to top of campus feed',
          timestamp: 'Just now',
        },
        ...logPrev,
      ]);
      triggerToast(isPinned ? '📌 Post unpinned from top.' : '📌 Post pinned to top of campus feed!');
      return next;
    });
  };

  const handleToggleLockComments = (postId: number) => {
    setLockedMemePostComments((prev) => {
      const isLocked = !prev[postId];
      setModLogsList((logPrev) => [
        {
          id: Date.now(),
          admin_username: currentUser.username,
          action: 'warn',
          target_type: 'post',
          target_id: postId,
          reason_given: isLocked ? 'Locked comments on post' : 'Unlocked comments on post',
          timestamp: 'Just now',
        },
        ...logPrev,
      ]);
      triggerToast(isLocked ? '🔒 Comments locked by admin.' : '🔓 Comments unlocked.');
      return { ...prev, [postId]: isLocked };
    });
  };

  // Universal Safety Report Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetType, setReportTargetType] = useState<'post' | 'comment' | 'vlog' | 'aux_submission' | 'review' | 'user'>('post');
  const [reportTargetId, setReportTargetId] = useState<number>(1);
  const [reportTargetPreview, setReportTargetPreview] = useState('');
  const [reportReason, setReportReason] = useState<'harassment' | 'hate_speech' | 'illegal_content' | 'spam' | 'explicit_media' | 'impersonation'>('harassment');
  const [reportDetails, setReportDetails] = useState('');

  // Suspension prompt modal state
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendTargetReportId, setSuspendTargetReportId] = useState<number | null>(null);
  const [suspendTargetUserId, setSuspendTargetUserId] = useState<number | null>(null);
  const [suspendDurationDays, setSuspendDurationDays] = useState<number>(7);
  const [suspendReasonNote, setSuspendReasonNote] = useState('');

  // Moderation Reports Queue
  const [reportsList, setReportsList] = useState<ModerationReport[]>([
    {
      id: 1,
      reporter_id: 2,
      reporter_username: 'adwoa_procure',
      reporter_student_id: '04/2022/1149D',
      target_type: 'review',
      target_id: 101,
      reason: 'harassment',
      details: 'Targeted character assassination against FOE Engineering Lecturer Dr. Boateng in anonymous course rating.',
      status: 'pending',
      created_at: '12 mins ago',
      target_preview: 'COE 201 Anonymous Review: "Lecturer Boateng is intentionally malicious, cancels lectures at CCB..."',
      is_anonymous: true,
      real_author: {
        id: 8,
        username: 'kwame_cs',
        student_id: '04/2023/1089D',
        email: 'k.mensah@ktu.edu.gh',
        karma_score: -4,
        is_suspended: false,
        is_banned: false,
        is_anonymous_to_public: true,
      },
    },
    {
      id: 2,
      reporter_id: 4,
      reporter_username: 'ama_stats',
      reporter_student_id: '04/2023/0201D',
      target_type: 'vlog',
      target_id: 3,
      reason: 'explicit_media',
      details: 'Unauthorized recording inside Haleluya private hostel corridor without consent of residents.',
      status: 'pending',
      created_at: '34 mins ago',
      target_preview: 'Vlog #3: Late night corridor filming at Haleluya Hostel hallway',
      is_anonymous: false,
      real_author: {
        id: 3,
        username: 'yaw_telecom',
        student_id: '04/2024/0082D',
        email: 'y.boakye@ktu.edu.gh',
        karma_score: 18,
        is_suspended: false,
        is_banned: false,
        is_anonymous_to_public: false,
      },
    },
    {
      id: 3,
      reporter_id: 1,
      reporter_username: 'kofi_eng',
      reporter_student_id: '04/2023/0411D',
      target_type: 'post',
      target_id: 204,
      reason: 'illegal_content',
      details: 'User attempting to sell unverified leaked exam papers for Applied Mathematics mid-semesters.',
      status: 'pending',
      created_at: '1 hour ago',
      target_preview: 'Anonymous Confession: "DM @leaks_guy for verified solved FAST mid-sem questions and marking schemes."',
      is_anonymous: true,
      real_author: {
        id: 15,
        username: 'exam_intel',
        student_id: '04/2021/0882D',
        email: 'e.intel@ktu.edu.gh',
        karma_score: -28,
        is_suspended: false,
        is_banned: false,
        is_anonymous_to_public: true,
      },
    },
  ]);

  // Moderation Action Logs (ModLog)
  const [modLogsList, setModLogsList] = useState<ModLogItem[]>([
    {
      id: 101,
      admin_username: 'kofi_eng',
      action: 'suspend_user',
      target_type: 'user',
      target_id: 19,
      reason_given: '7-day suspension: Repeated spamming in textbook barter channel.',
      timestamp: 'Today · 08:30 AM',
    },
    {
      id: 102,
      admin_username: 'kofi_eng',
      action: 'delete_content',
      target_type: 'vlog',
      target_id: 42,
      reason_given: 'Unsafe rooftop stunt near GETFund project stairs.',
      timestamp: 'Yesterday · 04:15 PM',
    },
  ]);

  // Verified KTU Student Directory for Admin Management
  const [studentAccounts, setStudentAccounts] = useState<StudentAccount[]>([
    {
      id: 1,
      student_id: '04/2023/0411D',
      username: 'kofi_eng',
      email: 'k.owusu@ktu.edu.gh',
      karma_score: 114,
      role: 'admin',
      is_suspended: false,
      is_banned: false,
      faculty: 'FOE · Automotive Engineering',
    },
    {
      id: 2,
      student_id: '04/2022/1149D',
      username: 'adwoa_procure',
      email: 'a.mensah@ktu.edu.gh',
      karma_score: 219,
      role: 'student',
      is_suspended: false,
      is_banned: false,
      faculty: 'FBMS · Procurement & Supply',
    },
    {
      id: 3,
      student_id: '04/2024/0082D',
      username: 'yaw_telecom',
      email: 'y.boakye@ktu.edu.gh',
      karma_score: 68,
      role: 'student',
      is_suspended: false,
      is_banned: false,
      faculty: 'FOE · Electrical & Telecom',
    },
    {
      id: 4,
      student_id: '04/2023/0201D',
      username: 'ama_stats',
      email: 'a.agyemang@ktu.edu.gh',
      karma_score: 95,
      role: 'student',
      is_suspended: false,
      is_banned: false,
      faculty: 'FAST · Applied Statistics',
    },
    {
      id: 8,
      student_id: '04/2023/1089D',
      username: 'kwame_cs',
      email: 'k.mensah@ktu.edu.gh',
      karma_score: -4,
      role: 'student',
      is_suspended: false,
      is_banned: false,
      faculty: 'FAST · Computer Science',
    },
    {
      id: 15,
      student_id: '04/2021/0882D',
      username: 'exam_intel',
      email: 'e.intel@ktu.edu.gh',
      karma_score: -28,
      role: 'student',
      is_suspended: false,
      is_banned: false,
      faculty: 'FAST · Mathematics',
    },
  ]);

  // Open Universal Report Modal
  const openReportModal = (type: any, id: number, preview: string) => {
    setReportTargetType(type);
    setReportTargetId(id);
    setReportTargetPreview(preview);
    setReportReason('harassment');
    setReportDetails('');
    setShowReportModal(true);
  };

  // Submit Safety Report
  const handleSafetyReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: ModerationReport = {
      id: reportsList.length + 1,
      reporter_id: currentUser.id,
      reporter_username: currentUser.username,
      reporter_student_id: currentUser.student_id,
      target_type: reportTargetType,
      target_id: reportTargetId,
      reason: reportReason,
      details: reportDetails || 'Report submitted by student.',
      status: 'pending',
      created_at: 'Just now',
      target_preview: reportTargetPreview || `${reportTargetType.toUpperCase()} #${reportTargetId}`,
      is_anonymous: false,
    };

    setReportsList([newReport, ...reportsList]);
    setShowReportModal(false);
    triggerToast('Report submitted for review. Thank you for keeping KTU safe.');
  };

  // Execute Moderation Action (Dismiss, Delete, Suspend, Ban)
  const handleExecuteModAction = (
    reportId: number,
    action: 'dismiss' | 'delete_content' | 'suspend_user' | 'ban_user',
    days = 7,
    reasonNote = ''
  ) => {
    const report = reportsList.find((r) => r.id === reportId);
    if (!report) return;

    // Update report status
    const newStatus = action === 'dismiss' ? 'dismissed' : 'actioned';
    setReportsList((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    );

    // Apply sanction if user-targeted
    if (report.real_author) {
      const authorId = report.real_author.id;
      if (action === 'suspend_user') {
        setStudentAccounts((prev) =>
          prev.map((u) =>
            u.id === authorId
              ? { ...u, is_suspended: true, suspension_until: `In ${days} days` }
              : u
          )
        );
      } else if (action === 'ban_user') {
        setStudentAccounts((prev) =>
          prev.map((u) =>
            u.id === authorId
              ? { ...u, is_banned: true, is_suspended: false }
              : u
          )
        );
      }
    }

    // Add ModLog entry
    const newLog: ModLogItem = {
      id: modLogsList.length + 101,
      admin_username: currentUser.username,
      action: action === 'dismiss' ? 'dismiss_report' : action,
      target_type: report.target_type,
      target_id: report.target_id,
      reason_given: reasonNote || `Moderation action: ${action} executed by staff.`,
      timestamp: 'Just now',
    };
    setModLogsList([newLog, ...modLogsList]);

    const actionLabels: Record<string, string> = {
      dismiss: `Report #${reportId} dismissed.`,
      delete_content: `Offending ${report.target_type} deleted and report resolved.`,
      suspend_user: `Offending author suspended for ${days} days.`,
      ban_user: `Student account permanently banned.`,
    };
    triggerToast(actionLabels[action] || 'Action completed.');
  };

  // Direct Account Sanctions
  const handleDirectUserSanction = (userId: number, action: 'suspend' | 'unsuspend' | 'ban' | 'unban', days = 7) => {
    setStudentAccounts((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        if (action === 'suspend') {
          return { ...u, is_suspended: true, suspension_until: `In ${days} days` };
        }
        if (action === 'unsuspend') {
          return { ...u, is_suspended: false, suspension_until: undefined };
        }
        if (action === 'ban') {
          return { ...u, is_banned: true, is_suspended: false };
        }
        if (action === 'unban') {
          return { ...u, is_banned: false };
        }
        return u;
      })
    );

    const logAction = action === 'suspend' ? 'suspend_user' : action === 'ban' ? 'ban_user' : 'warn';
    const newLog: ModLogItem = {
      id: modLogsList.length + 101,
      admin_username: currentUser.username,
      action: logAction as any,
      target_type: 'user',
      target_id: userId,
      reason_given: `Direct account ${action} executed by admin.`,
      timestamp: 'Just now',
    };
    setModLogsList([newLog, ...modLogsList]);
    triggerToast(`User account status updated: ${action}.`);
  };

  // ---------------------------------------------------------------------------
  // 4. UNIVERSAL REAL-WORLD SHARE MODAL STATE
  // ---------------------------------------------------------------------------
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [sentDmMap, setSentDmMap] = useState<Record<string, boolean>>({});
  const [showQrCode, setShowQrCode] = useState(false);

  // TikTok Sound Drawer State
  const [showSoundDrawer, setShowSoundDrawer] = useState(false);
  const [activeSoundTrack, setActiveSoundTrack] = useState<string | null>(null);
  const [isPlayingSoundPreview, setIsPlayingSoundPreview] = useState(false);

  // ---------------------------------------------------------------------------
  // 5. MEMES & FEEDS STATE & INTERACTIVE COMMENTS (PICTURES, TAGS, TIKTOK AUDIO)
  // ---------------------------------------------------------------------------
  const [showMemeModal, setShowMemeModal] = useState(false);
  const [postType, setPostType] = useState<'meme' | 'feed'>('meme');
  const [memeFormCaption, setMemeFormCaption] = useState('');
  const [memeFormTag, setMemeFormTag] = useState('#ktu');
  const [memeImageFile, setMemeImageFile] = useState<string | null>(null);
  const [postTags, setPostTags] = useState<string[]>(['#ktu', '#campusvibes']);
  const [tagInputText, setTagInputText] = useState('');
  const [attachedSound, setAttachedSound] = useState<SoundItem | null>(null);
  const [showSoundPickerModal, setShowSoundPickerModal] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [playingPostSoundId, setPlayingPostSoundId] = useState<number | null>(null);
  const [expandedMemeComments, setExpandedMemeComments] = useState<Record<number, boolean>>({});
  const [memeCommentInputs, setMemeCommentInputs] = useState<Record<number, string>>({});
  const [memePosts, setMemePosts] = useState<Array<{
    id: number;
    author: string;
    studentId?: string;
    caption: string;
    upvotes: number;
    downvotes: number;
    userVote: number;
    isSaved: boolean;
    comments: number;
    time: string;
    badge: string;
    imagePlaceholderBg?: string;
    imageUrl?: string;
    tags?: string[];
    soundTitle?: string;
    soundArtist?: string;
    audioUrl?: string;
    type: 'meme' | 'feed';
    commentsList: Array<{
      id: number;
      author: string;
      studentId?: string;
      text: string;
      time: string;
      likes: number;
      userLiked?: boolean;
    }>;
  }>>([
    {
      id: 1,
      author: 'kofi_cs',
      studentId: 'KTU/FAST/CS/23/089',
      caption: 'When the FOE Electrical lecturer says the test is 5 minutes and 1 question, but it has parts (a) to (z) with circuit diagrams 💀 #ktu #engineering #examseason',
      upvotes: 248,
      downvotes: 11,
      userVote: 0,
      isSaved: false,
      comments: 3,
      time: '2h ago',
      badge: 'FAST · Computer Science',
      imagePlaceholderBg: 'from-amber-500 to-red-600',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      tags: ['#ktu', '#engineering', '#examseason'],
      soundTitle: 'Emotional Damage! (Original Clip)',
      soundArtist: 'TikTok Viral Meme',
      type: 'meme' as const,
      commentsList: [
        {
          id: 101,
          author: 'yaw_telecom',
          studentId: '04/2024/0082D',
          text: 'And part (d) starts with "Hence, prove that the impedance approaches infinity" 😭💀',
          time: '1h ago',
          likes: 24,
          userLiked: false,
        },
        {
          id: 102,
          author: 'adwoa_procure',
          studentId: '04/2022/1149D',
          text: 'This is why FBMS students stay on our side of campus. No physics allowed 😂',
          time: '45m ago',
          likes: 18,
          userLiked: true,
        },
        {
          id: 103,
          author: 'serwaa_stats',
          studentId: '04/2023/0441D',
          text: 'Statistics students calculating our probability of surviving this semester: 0.0001%',
          time: '20m ago',
          likes: 9,
          userLiked: false,
        },
      ],
    },
    {
      id: 2,
      author: 'adwoa_procure',
      studentId: 'KTU/FBMS/PSC/22/114',
      caption: 'Walking in the sun from CCB to the New Engineering block at 1:00 PM for a 2-credit hour course just to find an empty hall 😭🔥 #ktulife #adweso #sunburn',
      upvotes: 312,
      downvotes: 8,
      userVote: 1,
      isSaved: true,
      comments: 2,
      time: '4h ago',
      badge: 'FBMS · Procurement',
      imagePlaceholderBg: 'from-blue-600 to-indigo-800',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
      tags: ['#ktulife', '#adweso', '#sunburn'],
      soundTitle: 'Kwaku The Traveller (Campus Drill)',
      soundArtist: 'Black Sherif',
      type: 'feed' as const,
      commentsList: [
        {
          id: 201,
          author: 'kwame_cs',
          studentId: 'KTU/FAST/CS/23/089',
          text: 'The WhatsApp group rep always says "Lecturer is on his way" while lecturer is in Accra 🚗💨',
          time: '3h ago',
          likes: 42,
          userLiked: true,
        },
        {
          id: 202,
          author: 'kofi_foe',
          studentId: '04/2023/0411D',
          text: 'That CCB hill climb under 34°C sun builds character though!',
          time: '2h ago',
          likes: 15,
          userLiked: false,
        },
      ],
    },
    {
      id: 3,
      author: 'selorm_fast',
      studentId: 'KTU/FAST/CS/22/045',
      caption: 'Code compiled with 0 warnings and 0 errors on first attempt before the lab assistant arrived. We celebrate small victories! 🚀💻 #fast #computerscience #ktu',
      upvotes: 189,
      downvotes: 3,
      userVote: 1,
      isSaved: false,
      comments: 1,
      time: '5h ago',
      badge: 'FAST · Computer Science',
      imagePlaceholderBg: 'from-emerald-600 to-teal-800',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
      tags: ['#fast', '#computerscience', '#ktu'],
      soundTitle: 'Amapiano Campus Bass Drop 2026',
      soundArtist: 'Koforidua Club Mix',
      type: 'feed' as const,
      commentsList: [
        {
          id: 301,
          author: 'kofi_cs',
          studentId: 'KTU/FAST/CS/23/089',
          text: 'Bro is the campus senior dev! Teach us your ways 🙏',
          time: '4h ago',
          likes: 12,
          userLiked: true,
        },
      ],
    },
  ]);

  // ---------------------------------------------------------------------------
  // 6. AUX BATTLE (87.7 FM) STATE
  // ---------------------------------------------------------------------------
  const [showAuxModal, setShowAuxModal] = useState(false);
  const [auxFormTitle, setAuxFormTitle] = useState('');
  const [auxFormArtist, setAuxFormArtist] = useState('');
  const [playingAuxTrackId, setPlayingAuxTrackId] = useState<number | null>(null);
  const [auxTracks, setAuxTracks] = useState([
    {
      id: 1,
      title: 'Makoma',
      artist: 'King Paluta',
      submittedBy: 'kofi_foe',
      studentId: '04/2023/0411D',
      faculty: 'FOE · Automotive',
      upvotes: 184,
      downvotes: 12,
      userVote: 1,
      currentRank: 1,
      time: '1h ago',
    },
    {
      id: 2,
      title: 'Kweku Playman',
      artist: 'Kweku Smoke',
      submittedBy: 'ama_fast',
      studentId: '04/2023/0201D',
      faculty: 'FAST · Statistics',
      upvotes: 142,
      downvotes: 19,
      userVote: 0,
      currentRank: 2,
      time: '2h ago',
    },
    {
      id: 3,
      title: 'Kwaku the Traveller',
      artist: 'Black Sherif',
      submittedBy: 'yaw_telecom',
      studentId: '04/2024/0082D',
      faculty: 'FOE · Electrical',
      upvotes: 129,
      downvotes: 7,
      userVote: 0,
      currentRank: 3,
      time: '3h ago',
    },
  ]);

  // ---------------------------------------------------------------------------
  // 7. KTU HUB: COURSE REVIEWS & SKILL BARTER STATE
  // ---------------------------------------------------------------------------
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [showCourseReviewModal, setShowCourseReviewModal] = useState(false);
  const [reviewCourseCode, setReviewCourseCode] = useState('AUT 201');
  const [reviewLecturer, setReviewLecturer] = useState('Dr. K. Frimpong');
  const [reviewRatingStars, setReviewRatingStars] = useState(5);
  const [reviewCommentText, setReviewCommentText] = useState('');

  const [courseList, setCourseList] = useState([
    {
      code: 'AUT 201',
      title: 'Automotive Thermodynamics & Heat Transfer',
      faculty: 'Faculty of Engineering (FOE)',
      lecturer: 'Dr. K. Frimpong',
      avgRating: 4.7,
      reviewsCount: 28,
      reviews: [
        {
          id: 1,
          author: 'kofi_eng',
          studentId: '04/2023/0411D',
          rating: 5,
          text: 'Dr. Frimpong gives excellent practical lab sessions in the New Multipurpose Building. Make sure to attend all lab tests!',
          helpfulCount: 24,
          userHelpful: true,
          time: '3 days ago',
        },
        {
          id: 2,
          author: 'yaw_telecom',
          studentId: '04/2024/0082D',
          rating: 4,
          text: 'Mid-sem was tough but calculations are straightforward if you study past questions from 2022-2024.',
          helpfulCount: 11,
          userHelpful: false,
          time: '1 week ago',
        },
      ],
    },
    {
      code: 'CS 305',
      title: 'Software Engineering Principles & System Architecture',
      faculty: 'Faculty of Applied Sciences (FAST)',
      lecturer: 'Eng. A. Mensah',
      avgRating: 4.9,
      reviewsCount: 35,
      reviews: [
        {
          id: 3,
          author: 'kwame_cs',
          studentId: '04/2023/089D',
          rating: 5,
          text: 'Best lecturer in FAST! The term project building a real full-stack web app taught me more than 3 theory semesters.',
          helpfulCount: 39,
          userHelpful: true,
          time: '4 days ago',
        },
      ],
    },
    {
      code: 'PSC 204',
      title: 'Public Procurement Law & Contract Administration',
      faculty: 'Faculty of Business & Management (FBMS)',
      lecturer: 'Mrs. G. Ofori',
      avgRating: 4.3,
      reviewsCount: 19,
      reviews: [
        {
          id: 4,
          author: 'adwoa_procure',
          studentId: '04/2022/1149D',
          rating: 4,
          text: 'Requires heavy memorization of the Public Procurement Act (Act 663 as amended by Act 914), but grading is fair.',
          helpfulCount: 15,
          userHelpful: false,
          time: '2 weeks ago',
        },
      ],
    },
  ]);

  // Skill Barter State
  const [showSkillSwapModal, setShowSkillSwapModal] = useState(false);
  const [swapOfferingInput, setSwapOfferingInput] = useState('');
  const [swapSeekingInput, setSwapSeekingInput] = useState('');
  const [swapDescriptionInput, setSwapDescriptionInput] = useState('');
  const [skillSwapList, setSkillSwapList] = useState([
    {
      id: 1,
      author: 'kwame_cs',
      handle: '@kwame_cs',
      studentId: 'KTU/FAST/CS/23/089',
      faculty: 'FAST · Computer Science',
      offering: 'React, TypeScript & Python API Development',
      seeking: 'Electrical Circuit Analysis (FOE Lab 3)',
      bio: 'Willing to build your project front-end or portfolio website in exchange for tutoring on circuit schematics!',
      time: '3h ago',
    },
    {
      id: 2,
      author: 'adwoa_procure',
      handle: '@adwoa_procure',
      studentId: 'KTU/FBMS/PSC/22/114',
      faculty: 'FBMS · Procurement',
      offering: 'Financial Accounting & Excel Data Modeling',
      seeking: 'Canva & Figma Graphic Design for Event Flyers',
      bio: 'Can tutor you through mid-sem Cost Accounting in exchange for 3 society flyer templates.',
      time: '5h ago',
    },
    {
      id: 3,
      author: 'derrick_civil',
      handle: '@derrick_civil',
      studentId: '04/2024/0339D',
      faculty: 'FOSIS · Civil Engineering',
      offering: 'AutoCAD 2D/3D Architectural Blueprints',
      seeking: 'Engineering Mathematics & Calculus II',
      bio: 'Civil level 200 offering drafting assistance in exchange for ODE and differential equations study sessions.',
      time: '1d ago',
    },
  ]);

  // ---------------------------------------------------------------------------
  // 6. ROULETTE & COURSES STATE (Opposite Sex & Same Level Matching)
  // ---------------------------------------------------------------------------
  const [rouletteActivity, setRouletteActivity] = useState<'study_buddy' | 'lab_partner' | 'dining_hall' | 'campus_walk'>('study_buddy');
  const [rouletteSlot, setRouletteSlot] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [matchedPartner, setMatchedPartner] = useState<any | null>(null);

  const PEER_CANDIDATES = [
    // LEVEL 100
    {
      id: 1,
      name: 'Akosua Boakye',
      handle: '@akosua_fast',
      studentId: '04/2025/0112D',
      gender: 'female',
      level: 100,
      faculty: 'Faculty of Applied Sciences (FAST)',
      program: 'BTech Computer Science',
      location: 'Central Library (1st Floor Silent Reading)',
      activity: 'Quiet Study Session',
      bio: 'Level 100 looking for an opposite-sex study partner in Calculus I and Intro to Programming.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      name: 'Yaa Konadu',
      handle: '@yaa_procure',
      studentId: '04/2025/0784D',
      gender: 'female',
      level: 100,
      faculty: 'Faculty of Business & Management (FBMS)',
      program: 'BTech Procurement & Logistics',
      location: 'Food Village Pavilions',
      activity: 'Dining & Study Chat',
      bio: 'Level 100 business student looking for an opposite-sex peer to collaborate on Principles of Management.',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      name: 'Kojo Antwi',
      handle: '@kojo_antwi',
      studentId: '04/2025/0304D',
      gender: 'male',
      level: 100,
      faculty: 'Faculty of Engineering (FOE)',
      program: 'BTech Mechanical Engineering',
      location: 'Engineering Workshop 1',
      activity: 'Practicals Lab Partner',
      bio: 'Level 100 freshman engineering student looking for an opposite-sex partner for Technical Drawing and Workshop practicals.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 4,
      name: 'Emmanuel Mensah',
      handle: '@emmanuel_elec',
      studentId: '04/2025/0912D',
      gender: 'male',
      level: 100,
      faculty: 'Faculty of Engineering (FOE)',
      program: 'BTech Electrical & Electronic Engineering',
      location: 'New 5-Storey Multipurpose Engineering Facility (Room E-101)',
      activity: 'Quiet Study Session',
      bio: 'Level 100 seeking a focused female study partner for Physics I and Basic Electronics.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    },
    // LEVEL 200
    {
      id: 5,
      name: 'Adwoa Mensah',
      handle: '@adwoa_procure',
      studentId: '04/2024/1149D',
      gender: 'female',
      level: 200,
      faculty: 'Faculty of Business & Management (FBMS)',
      program: 'BTech Procurement & Supply Chain',
      location: 'University Central Library (2nd Floor Discussion Area)',
      activity: 'Quiet Study Session',
      bio: 'Level 200 student reviewing Supply Chain Logistics and Business Law mid-semester questions.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 6,
      name: 'Abena Serwaa',
      handle: '@abena_it',
      studentId: '04/2024/0552D',
      gender: 'female',
      level: 200,
      faculty: 'Faculty of Applied Sciences (FAST)',
      program: 'BTech Information Technology',
      location: 'CCB Block Computer Lab 1',
      activity: 'Coding & Lab Practicals',
      bio: 'Level 200 IT student seeking an opposite-sex study peer for Database Management & Java OOP.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 7,
      name: 'Kwesi Appiah',
      handle: '@kwesi_telecom',
      studentId: '04/2024/0821D',
      gender: 'male',
      level: 200,
      faculty: 'Faculty of Engineering (FOE)',
      program: 'BTech Electrical & Electronic Engineering',
      location: 'New 5-Storey Multipurpose Engineering Facility (Room E-204)',
      activity: 'Workshop Practicals Partner',
      bio: 'Level 200 looking for an opposite-sex study partner in Circuit Analysis and Digital Electronics.',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 8,
      name: 'Derrick Boateng',
      handle: '@derrick_civil',
      studentId: '04/2024/0339D',
      gender: 'male',
      level: 200,
      faculty: 'Faculty of Built Environment (FOSIS)',
      program: 'BTech Civil Engineering',
      location: 'Civil Concrete Testing Laboratory',
      activity: 'Lab Partner',
      bio: 'Level 200 Civil student looking for a female peer for Strength of Materials and Surveying fieldwork.',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    },
    // LEVEL 300
    {
      id: 9,
      name: 'Serwaa Acheampong',
      handle: '@serwaa_stats',
      studentId: '04/2023/0441D',
      gender: 'female',
      level: 300,
      faculty: 'Faculty of Applied Sciences (FAST)',
      program: 'BTech Applied Statistics',
      location: 'CCB Block Computer Lab 2',
      activity: 'Quiet Study Session',
      bio: 'Level 300 statistics major looking for an opposite-sex study peer for SPSS and Econometrics project work.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 10,
      name: 'Priscilla Antwi',
      handle: '@priscilla_cs',
      studentId: '04/2023/0187D',
      gender: 'female',
      level: 300,
      faculty: 'Faculty of Applied Sciences (FAST)',
      program: 'BTech Computer Science',
      location: 'Central Library E-Learning Zone',
      activity: 'Project & Thesis Research',
      bio: 'Level 300 CS major looking for an opposite-sex study partner for Software Engineering and Distributed Systems.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 11,
      name: 'Yaw Osei',
      handle: '@yaw_civil',
      studentId: '04/2023/0902D',
      gender: 'male',
      level: 300,
      faculty: 'Faculty of Built Environment (FOSIS)',
      program: 'BTech Civil Engineering',
      location: 'Surveying Field / CCB Hall A',
      activity: 'Practicals Lab Partner',
      bio: 'Level 300 Civil student working on structural mechanics calculations.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 12,
      name: 'Kelvin Asante',
      handle: '@kelvin_auto',
      studentId: '04/2023/0672D',
      gender: 'male',
      level: 300,
      faculty: 'Faculty of Engineering (FOE)',
      program: 'BTech Automotive Engineering',
      location: 'New Multipurpose Engineering Lab (Room E-301)',
      activity: 'Workshop Practicals',
      bio: 'Level 300 Automotive student looking for an opposite-sex partner for Thermodynamics practical reports.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    },
    // LEVEL 400
    {
      id: 13,
      name: 'Efua Darko',
      handle: '@efua_tech',
      studentId: '04/2022/0155D',
      gender: 'female',
      level: 400,
      faculty: 'Faculty of Engineering (FOE)',
      program: 'BTech Computer Systems Engineering',
      location: 'Final Year Project Hub (FOE Lab 4)',
      activity: 'Study Grind & Project Work',
      bio: 'Level 400 final-year student working on IoT capstone project and thesis defense.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 14,
      name: 'Mawusi Gbedemah',
      handle: '@mawusi_mkt',
      studentId: '04/2022/0831D',
      gender: 'female',
      level: 400,
      faculty: 'Faculty of Business & Management (FBMS)',
      program: 'BTech Marketing',
      location: 'Central Library 3rd Floor Research Wing',
      activity: 'Thesis Research Partner',
      bio: 'Level 400 student completing final dissertation in Digital Consumer Behavior.',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 15,
      name: 'Kofi Owusu',
      handle: '@kofi_eng',
      studentId: '04/2022/0411D',
      gender: 'male',
      level: 400,
      faculty: 'Faculty of Engineering (FOE)',
      program: 'BTech Automotive Engineering',
      location: 'Automotive Diagnostics Center',
      activity: 'Workshop Practicals Partner',
      bio: 'Level 400 preparing thesis on electric drivetrain diagnostics.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 16,
      name: 'Prince Gyasi',
      handle: '@prince_telecom',
      studentId: '04/2022/0290D',
      gender: 'male',
      level: 400,
      faculty: 'Faculty of Engineering (FOE)',
      program: 'BTech Telecommunications Engineering',
      location: 'Telecom Signal Processing Lab',
      activity: 'Final Year Project Partner',
      bio: 'Level 400 student working on 5G network modeling and thesis simulations.',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    },
  ];

  const startRouletteMatch = () => {
    setIsSearchingMatch(true);
    setMatchedPartner(null);
    setTimeout(() => {
      setIsSearchingMatch(false);
      const targetGender = currentUser.gender === 'male' ? 'female' : 'male';
      const targetLevel = currentUser.level;

      // STRICT CRITERIA: OPPOSITE SEX & SAME ACADEMIC LEVEL (Level 100, 200, 300, 400)
      const eligible = PEER_CANDIDATES.filter(
        (c) => (currentUser.gender === 'Prefer not to say' || c.gender === targetGender) && c.level === targetLevel
      );

      const partner = eligible.length > 0
        ? eligible[Math.floor(Math.random() * eligible.length)]
        : PEER_CANDIDATES.find((c) => c.level === targetLevel) || PEER_CANDIDATES[Math.floor(Math.random() * PEER_CANDIDATES.length)];

      setMatchedPartner(partner);
      if (partner) {
        triggerToast(`Study match found: ${partner.name}!`);
      } else {
        triggerToast('No matching study peer available right now. Please try again.');
      }
    }, 1200);
  };

  // Helper toast trigger
  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  // Messaging: send message handler
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatMessageInput.trim();
    if (!text) return;

    const newMsg: DirectMessage = {
      id: Date.now(),
      sender_id: currentUser.id,
      recipient_id: 2,
      body: text,
      sender_username: currentUser.username,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_mine: true,
    };

    setMessageThreads((prev) => ({
      ...prev,
      [activePartnerUsername]: [...(prev[activePartnerUsername] || []), newMsg],
    }));

    // Update conversation snippet
    setConversations((prev) =>
      prev.map((c) =>
        c.partner_username === activePartnerUsername
          ? { ...c, last_message: text, last_timestamp: 'Just now', unread_count: 0 }
          : c
      )
    );

    setChatMessageInput('');

    // Simulate real-time peer reply via SocketIO / polling
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyMsg: DirectMessage = {
          id: Date.now() + 1,
          sender_id: 2,
          recipient_id: currentUser.id,
          body: 'Got your message! Meet at the Central Library lobby or Food Village?',
          sender_username: activePartnerUsername,
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          is_mine: false,
        };
        setMessageThreads((prev) => ({
          ...prev,
          [activePartnerUsername]: [...(prev[activePartnerUsername] || []), replyMsg],
        }));
      }, 1400);
    }, 800);
  };

  // ---------------------------------------------------------------------------
  // VLOG ACTION HANDLERS
  // ---------------------------------------------------------------------------
  const handleVlogVote = (vlogId: number, direction: 1 | -1) => {
    setVlogsList((prev) =>
      prev.map((v) => {
        if (v.id !== vlogId) return v;
        const currentVote = v.userVote;
        if (currentVote === direction) {
          // Untoggle
          return {
            ...v,
            userVote: 0,
            upvotes: direction === 1 ? Math.max(0, v.upvotes - 1) : v.upvotes,
            downvotes: direction === -1 ? Math.max(0, v.downvotes - 1) : v.downvotes,
          };
        }
        return {
          ...v,
          userVote: direction,
          upvotes: direction === 1 ? v.upvotes + 1 : (currentVote === 1 ? Math.max(0, v.upvotes - 1) : v.upvotes),
          downvotes: direction === -1 ? v.downvotes + 1 : (currentVote === -1 ? Math.max(0, v.downvotes - 1) : v.downvotes),
        };
      })
    );
    triggerToast(direction === 1 ? 'Upvoted campus story! +2 Karma' : 'Downvoted campus story');
  };

  // ---------------------------------------------------------------------------
  // UNIVERSAL SHARE SYSTEM (TIKTOK / REAL SOCIAL WEB APP STANDARD)
  // ---------------------------------------------------------------------------
  const openShareModal = (payload: SharePayload) => {
    setSharePayload(payload);
    setShareCopied(false);
    setSentDmMap({});
    setShowQrCode(false);
    setShowShareModal(true);
  };

  const handleCopyShareLink = () => {
    if (!sharePayload) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sharePayload.url);
    }
    setShareCopied(true);
    triggerToast('Link copied to clipboard!');
    setTimeout(() => setShareCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (!sharePayload) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: sharePayload.title,
          text: `Check this out on KTU Social: "${sharePayload.title}" by @${sharePayload.author}`,
          url: sharePayload.url,
        });
        triggerToast('Shared successfully!');
      } catch (err) {
        // user dismiss, do nothing
      }
    } else {
      handleCopyShareLink();
    }
  };

  const handleSendShareViaDm = (recipientHandle: string) => {
    if (!sharePayload) return;
    const cleanHandle = recipientHandle.replace('@', '');
    const dmText = `Check this out: "${sharePayload.title}" (${sharePayload.url}) shared by @${sharePayload.author}`;
    
    const newMsg: DirectMessage = {
      id: Date.now(),
      sender_id: currentUser.id,
      recipient_id: 2,
      body: dmText,
      sender_username: currentUser.username,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_mine: true,
    };

    setMessageThreads((prev) => ({
      ...prev,
      [cleanHandle]: [...(prev[cleanHandle] || []), newMsg],
    }));

    setSentDmMap((prev) => ({ ...prev, [cleanHandle]: true }));
    triggerToast(`Sent directly to @${cleanHandle}!`);
  };

  const handleQuickRepost = () => {
    if (!sharePayload) return;
    triggerToast(`Reposted "${sharePayload.title}" to your KTU Campus Feed! +5 Karma`);
    setShowShareModal(false);
  };

  const handleCopyShareQuote = () => {
    if (!sharePayload) return;
    const textToCopy = `"${sharePayload.title}" by @${sharePayload.author} on KTU Social: ${sharePayload.url}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
    }
    triggerToast('Formatted post summary & link copied!');
  };

  const handleShareRouletteMatch = (partner: any) => {
    openShareModal({
      type: 'swap',
      id: `roulette-${partner.id}`,
      title: `KTU Peer Match: ${partner.name} & @${currentUser.username}`,
      subtitle: `Matched on KTU Hub for ${partner.activity || 'Course Study Session'} (${partner.program})`,
      author: currentUser.username,
      badge: `Opposite-Sex Level ${partner.level} Match`,
      avatar: partner.avatar,
      url: `${window.location.origin}/#match-${partner.id}`,
    });
  };

  const handleShareVlog = (vlog: VlogItem) => {
    openShareModal({
      type: 'vlog',
      id: vlog.id,
      title: vlog.videoTitle,
      subtitle: vlog.caption,
      author: vlog.author,
      badge: vlog.facultyBadge,
      avatar: vlog.avatar,
      url: `${window.location.origin}/#story-${vlog.id}`,
    });
  };

  // ---------------------------------------------------------------------------
  // MEMES INTERACTION HANDLERS
  // ---------------------------------------------------------------------------
  const handleMemeVote = (memeId: number, direction: 1 | -1) => {
    setMemePosts((prev) =>
      prev.map((m) => {
        if (m.id !== memeId) return m;
        const currentVote = m.userVote;
        if (currentVote === direction) {
          return {
            ...m,
            userVote: 0,
            upvotes: direction === 1 ? Math.max(0, m.upvotes - 1) : m.upvotes,
            downvotes: direction === -1 ? Math.max(0, m.downvotes - 1) : m.downvotes,
          };
        }
        return {
          ...m,
          userVote: direction,
          upvotes: direction === 1 ? m.upvotes + 1 : (currentVote === 1 ? Math.max(0, m.upvotes - 1) : m.upvotes),
          downvotes: direction === -1 ? m.downvotes + 1 : (currentVote === -1 ? Math.max(0, m.downvotes - 1) : m.downvotes),
        };
      })
    );
    triggerToast(direction === 1 ? 'Upvoted meme! +2 Karma' : 'Downvoted meme');
  };

  const handleMemeSave = (memeId: number) => {
    setMemePosts((prev) =>
      prev.map((m) => {
        if (m.id !== memeId) return m;
        const nextSaved = !m.isSaved;
        triggerToast(nextSaved ? 'Meme saved to your favorites!' : 'Removed from saved');
        return { ...m, isSaved: nextSaved };
      })
    );
  };

  const handleToggleMemeComments = (memeId: number) => {
    setExpandedMemeComments((prev) => ({ ...prev, [memeId]: !prev[memeId] }));
  };

  const handleAddMemeComment = (memeId: number) => {
    const text = (memeCommentInputs[memeId] || '').trim();
    if (!text) return;
    const newComment = {
      id: Date.now(),
      author: currentUser.username,
      studentId: currentUser.student_id,
      text: text,
      time: 'Just now',
      likes: 0,
      userLiked: false,
    };
    setMemePosts((prev) =>
      prev.map((m) => {
        if (m.id !== memeId) return m;
        return {
          ...m,
          comments: m.comments + 1,
          commentsList: [newComment, ...(m.commentsList || [])],
        };
      })
    );
    setMemeCommentInputs((prev) => ({ ...prev, [memeId]: '' }));
    triggerToast('Comment posted to meme discussion!');
  };

  const handleLikeMemeComment = (memeId: number, commentId: number) => {
    setMemePosts((prev) =>
      prev.map((m) => {
        if (m.id !== memeId) return m;
        return {
          ...m,
          commentsList: m.commentsList.map((c) => {
            if (c.id !== commentId) return c;
            const nextLiked = !c.userLiked;
            return {
              ...c,
              userLiked: nextLiked,
              likes: nextLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
            };
          }),
        };
      })
    );
  };

  const handleShareMeme = (meme: any) => {
    openShareModal({
      type: 'meme',
      id: meme.id,
      title: `@${meme.author}'s Campus Meme`,
      subtitle: meme.caption,
      author: meme.author,
      badge: meme.badge,
      imageBg: meme.imagePlaceholderBg,
      url: `${window.location.origin}/#meme-${meme.id}`,
    });
  };

  const handleAddMemePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memeFormCaption.trim()) return;
    const gradients = [
      'from-amber-500 via-orange-600 to-red-600',
      'from-purple-600 via-pink-600 to-rose-500',
      'from-emerald-500 via-teal-600 to-cyan-600',
      'from-blue-600 via-indigo-600 to-violet-700',
    ];
    const randomBg = gradients[Math.floor(Math.random() * gradients.length)];
    const finalTags = postTags.length > 0 ? postTags : [memeFormTag || '#ktu'];

    const newPost = {
      id: Date.now(),
      author: currentUser.username,
      studentId: currentUser.student_id,
      badge: postType === 'feed' ? 'Campus Feed' : (memeFormTag || 'Campus Banter'),
      caption: memeFormCaption.trim(),
      imagePlaceholderBg: randomBg,
      imageUrl: memeImageFile || undefined,
      tags: finalTags,
      soundTitle: attachedSound?.title,
      soundArtist: attachedSound?.artist,
      audioUrl: attachedSound?.audioUrl,
      type: postType,
      upvotes: 1,
      downvotes: 0,
      userVote: 1 as const,
      comments: 0,
      time: 'Just now',
      isSaved: false,
      commentsList: [],
    };
    setMemePosts((prev) => [newPost, ...prev]);
    setMemeFormCaption('');
    setMemeImageFile(null);
    setAttachedSound(null);
    setPostTags(['#ktu', '#campusvibes']);
    setShowMemeModal(false);
    triggerToast(postType === 'feed' ? 'Story published to campus feed! +5 Karma' : 'Meme published to KTU Brainrot vault! +5 Karma');
  };

  // ---------------------------------------------------------------------------
  // AUX BATTLE INTERACTION HANDLERS
  // ---------------------------------------------------------------------------
  const handleAuxVote = (trackId: number) => {
    setAuxTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const currentVote = t.userVote;
        if (currentVote === 1) {
          triggerToast('Vote removed from track');
          return { ...t, userVote: 0, upvotes: Math.max(0, t.upvotes - 1) };
        }
        triggerToast(`Voted for "${t.title}" on 87.7 FM!`);
        return { ...t, userVote: 1, upvotes: t.upvotes + 1 };
      })
    );
  };

  const handlePlayAuxTrack = (trackId: number) => {
    if (playingAuxTrackId === trackId) {
      setPlayingAuxTrackId(null);
      triggerToast('Audio preview stopped');
    } else {
      setPlayingAuxTrackId(trackId);
      const track = auxTracks.find((t) => t.id === trackId);
      triggerToast(`Now playing 87.7 FM live preview: "${track?.title}" by ${track?.artist}`);
    }
  };

  const handleShareAuxTrack = (track: any) => {
    openShareModal({
      type: 'track',
      id: track.id,
      title: `${track.title} - ${track.artist}`,
      subtitle: `Vote for this track on KTU Radio 87.7 FM Aux Battle! Submitted by @${track.submittedBy}`,
      author: track.submittedBy,
      badge: 'KTU 87.7 FM Aux Battle',
      url: `${window.location.origin}/#aux-${track.id}`,
    });
  };

  const handleAddAuxTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auxFormTitle.trim() || !auxFormArtist.trim()) return;
    const newTrack = {
      id: Date.now(),
      title: auxFormTitle.trim(),
      artist: auxFormArtist.trim(),
      submittedBy: currentUser.username,
      studentId: currentUser.student_id,
      faculty: currentUser.faculty,
      upvotes: 1,
      downvotes: 0,
      userVote: 1,
      currentRank: auxTracks.length + 1,
      time: 'Just now',
    };
    setAuxTracks((prev) => [...prev, newTrack]);
    setAuxFormTitle('');
    setAuxFormArtist('');
    setShowAuxModal(false);
    triggerToast(`"${newTrack.title}" submitted to KTU 87.7 FM Aux Battle!`);
  };

  // ---------------------------------------------------------------------------
  // KTU HUB REVIEWS & SWAP HANDLERS
  // ---------------------------------------------------------------------------
  const handleHelpfulReview = (courseCode: string, reviewId: number) => {
    setCourseList((prev) =>
      prev.map((c) => {
        if (c.code !== courseCode) return c;
        return {
          ...c,
          reviews: c.reviews.map((r) => {
            if (r.id !== reviewId) return r;
            const nextHelpful = !r.userHelpful;
            triggerToast(nextHelpful ? 'Marked review as helpful!' : 'Helpful vote removed');
            return {
              ...r,
              userHelpful: nextHelpful,
              helpfulCount: nextHelpful ? r.helpfulCount + 1 : Math.max(0, r.helpfulCount - 1),
            };
          }),
        };
      })
    );
  };

  const handleAddCourseReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewCommentText.trim()) return;
    const newRev = {
      id: Date.now(),
      author: currentUser.username,
      studentId: currentUser.student_id,
      rating: reviewRatingStars,
      text: reviewCommentText.trim(),
      helpfulCount: 0,
      userHelpful: false,
      time: 'Just now',
    };
    setCourseList((prev) =>
      prev.map((c) =>
        c.code === reviewCourseCode
          ? {
              ...c,
              reviewsCount: c.reviewsCount + 1,
              reviews: [newRev, ...c.reviews],
            }
          : c
      )
    );
    setReviewCommentText('');
    setShowCourseReviewModal(false);
    triggerToast(`Review submitted for ${reviewCourseCode}! +5 Karma`);
  };

  const handleOfferSwap = (swapItem: any) => {
    setActivePartnerUsername(swapItem.handle.replace('@', ''));
    setChatMessageInput(`Hey @${swapItem.handle.replace('@', '')}! I saw your KTU skill barter listing offering "${swapItem.offering}" seeking "${swapItem.seeking}". I would love to trade skills!`);
    setActiveTab('chat');
    triggerToast(`Chat opened with @${swapItem.handle.replace('@', '')}! Hit send to propose swap.`);
  };

  const handleAddSkillSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapOfferingInput.trim() || !swapSeekingInput.trim()) return;
    const newSwap = {
      id: Date.now(),
      author: currentUser.username,
      handle: `@${currentUser.username}`,
      studentId: currentUser.student_id,
      faculty: currentUser.faculty,
      offering: swapOfferingInput.trim(),
      seeking: swapSeekingInput.trim(),
      bio: swapDescriptionInput.trim() || 'Excited to barter peer tutoring and skills on campus!',
      time: 'Just now',
    };
    setSkillSwapList([newSwap, ...skillSwapList]);
    setSwapOfferingInput('');
    setSwapSeekingInput('');
    setSwapDescriptionInput('');
    setShowSkillSwapModal(false);
    triggerToast('Your skill barter listing is now live on KTU Hub!');
  };

  const handleSaveVlog = (vlogId: number) => {
    setVlogsList((prev) =>
      prev.map((v) => {
        if (v.id !== vlogId) return v;
        const nextSaved = !v.isSaved;
        triggerToast(nextSaved ? 'Saved to your saved stories collection!' : 'Removed from saved stories');
        return { ...v, isSaved: nextSaved };
      })
    );
  };

  const handleAddVlogComment = (e: React.FormEvent, vlogId: number) => {
    e.preventDefault();
    if (!vlogCommentInput.trim()) return;
    const newComment: VlogComment = {
      id: Date.now(),
      author: currentUser.username,
      studentId: currentUser.student_id,
      faculty: currentUser.faculty,
      avatar: currentUser.avatar,
      text: vlogCommentInput.trim(),
      time: 'Just now',
      likes: 0,
      userLiked: false,
    };
    setVlogsList((prev) =>
      prev.map((v) =>
        v.id === vlogId ? { ...v, comments: [newComment, ...v.comments] } : v
      )
    );
    setVlogCommentInput('');
    triggerToast('Comment posted to campus story discussion!');
  };

  const handleLikeVlogComment = (vlogId: number, commentId: number) => {
    setVlogsList((prev) =>
      prev.map((v) => {
        if (v.id !== vlogId) return v;
        return {
          ...v,
          comments: v.comments.map((c) => {
            if (c.id !== commentId) return c;
            const nextLiked = !c.userLiked;
            return {
              ...c,
              userLiked: nextLiked,
              likes: nextLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
            };
          }),
        };
      })
    );
  };

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalVideoFile(file);
    const url = URL.createObjectURL(file);
    setLocalVideoUrl(url);
    if (!uploadTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadTitle(cleanName);
    }
    triggerToast(`Selected local video: ${file.name}`);
  };

  const handleUploadVlogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      triggerToast('Please enter a story title');
      return;
    }
    if (!uploadCaption.trim()) {
      triggerToast('Please enter a caption');
      return;
    }
    if (!localVideoFile && !localVideoUrl) {
      triggerToast('Please select a local video file from your device to upload');
      return;
    }

    const cleanHashtags = uploadHashtags
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith('#') ? t : `#${t}`))
      .join(' ');

    const combinedCaption = cleanHashtags
      ? `${uploadCaption.trim()} ${cleanHashtags}`
      : uploadCaption.trim();

    const gradients = [
      'from-slate-900 via-indigo-950 to-slate-900',
      'from-rose-950 via-purple-950 to-slate-950',
      'from-emerald-950 via-teal-950 to-slate-950',
      'from-blue-950 via-slate-900 to-indigo-950',
    ];
    const randomBg = gradients[Math.floor(Math.random() * gradients.length)];

    const newVlog: VlogItem = {
      id: Date.now(),
      author: currentUser.username,
      studentId: currentUser.student_id,
      avatar: currentUser.avatar,
      videoTitle: uploadTitle.trim(),
      caption: combinedCaption,
      duration: 25.0,
      views: 1,
      upvotes: 1,
      downvotes: 0,
      userVote: 1,
      videoPlaceholderBg: randomBg,
      videoSrcUrl: localVideoUrl || undefined,
      timeAgo: 'Just now',
      facultyBadge: currentUser.faculty,
      category: 'campus_life',
      soundTrack: 'Original Sound - KTU Campus',
      location: 'KTU Main Campus (Adweso, Koforidua)',
      comments: [],
      isSaved: false,
    };

    setVlogsList([newVlog, ...vlogsList]);
    setActiveVlogIndex(0);
    setDragOffsetY(0);
    setVlogProgress(0);
    setIsPlaying(true);
    setShowUploadModal(false);
    setUploadTitle('');
    setUploadCaption('');
    setUploadHashtags('');
    setLocalVideoFile(null);
    setLocalVideoUrl(null);
    triggerToast(`Campus story "${newVlog.videoTitle}" published! +10 Karma`);
  };

  const pendingReportsCount = reportsList.filter((r) => r.status === 'pending').length;
  const suspendedCount = studentAccounts.filter((u) => u.is_suspended).length;
  const bannedCount = studentAccounts.filter((u) => u.is_banned).length;

  // DEFAULT ROOT ROUTE (/):
  // When unauthenticated (isLoggedIn === false), show the KTU Landing Page immediately.
  // If already logged in, redirect directly to the main campus feed (/feed).
  if (!isLoggedIn) {
    return (
      <>
        {feedbackToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-slate-700 backdrop-blur-xs whitespace-nowrap animate-in fade-in slide-in-from-top-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{feedbackToast}</span>
          </div>
        )}
        <KTULandingPage
          onLoginSuccess={(userData) => {
            if (userData) {
              const isBruceAdmin =
                userData.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase() ||
                userData.email?.toLowerCase().trim() === 'brucedoku3@gmail.com' ||
                userData.email?.toLowerCase().trim().startsWith('brucedoku') ||
                userData.username?.toLowerCase().trim().startsWith('brucedoku') ||
                userData.email?.toLowerCase().trim() === 'bruce20597216248@gmail.com' ||
                userData.is_admin === true;

              const cleanUserData = {
                ...userData,
                ...(isBruceAdmin ? { is_admin: true, role: 'admin' } : {}),
              };

              setCurrentUser((prev: CurrentStudentUser) => {
                const updated = { ...prev, ...cleanUserData };
                try {
                  localStorage.setItem('ktu_active_user', JSON.stringify(updated));
                } catch (e) {}
                return updated;
              });
              setStudentAccounts((prev) => {
                const existing = prev.filter((a) => a.username !== cleanUserData.username && a.email !== cleanUserData.email);
                return [
                  {
                    id: cleanUserData.id || Date.now(),
                    student_id: cleanUserData.student_id || `KTU/2026/${Math.floor(1000 + Math.random() * 9000)}`,
                    username: cleanUserData.username,
                    email: cleanUserData.email,
                    karma_score: isBruceAdmin ? 100 : 50,
                    role: isBruceAdmin ? 'admin' : 'student',
                    is_suspended: false,
                    is_banned: false,
                    faculty: cleanUserData.faculty || 'Faculty of Applied Science and Technology (FAST)',
                  },
                  ...existing,
                ];
              });
            }
            setIsLoggedIn(true);
            try {
              localStorage.setItem('ktu_is_logged_in', 'true');
            } catch (e) {}
            setActiveTab('vlogs');
          }}
          triggerToast={triggerToast}
          adminEmail={ADMIN_EMAIL}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* ===================================================================== */}
      {/* 1. MAIN CLEAN INSTITUTIONAL HEADER WITH HAMBURGER DRAWER BUTTON      */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className={`mx-auto px-3 sm:px-6 h-14 flex items-center justify-between transition-all duration-300 ${activeTab === 'vlogs' ? 'max-w-7xl' : 'max-w-4xl'}`}>
          
          {/* Official KTU Crest Logo & Campus Title (Matching Screenshot 11) */}
          <div
            onClick={() => {
              setActiveTab('vlogs');
              setIsMenuDrawerOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer group select-none"
            title="Koforidua Technical University · CampusSocial"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0080ff] text-white flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-[#0066cc]">
              <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
                <path d="M5 10.5v5a7 7 0 0014 0v-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-[14px] tracking-tight text-[#002147] uppercase leading-none">
                KTU
              </span>
              <span className="font-black text-[12px] tracking-tight text-[#002147] uppercase leading-tight">
                CAMPUSSOCIAL
              </span>
            </div>
          </div>

          {/* =================================================================== */}
          {/* DESKTOP HORIZONTAL NAVIGATION MENU BAR (Instant campus navigation)  */}
          {/* =================================================================== */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* Feed / Stories */}
            <button
              onClick={() => {
                setActiveTab('vlogs');
                setIsMenuDrawerOpen(false);
                setDesktopDropdown(null);
              }}
              className={`px-3 py-1.5 text-xs xl:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'vlogs'
                  ? 'bg-[#002147] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-[#002147] hover:bg-slate-100'
              }`}
            >
              <Video className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-rose-500" />
              <span>Feed</span>
            </button>

            {/* Chat */}
            <button
              onClick={() => {
                setActiveTab('chat');
                setIsMenuDrawerOpen(false);
                setDesktopDropdown(null);
              }}
              className={`px-3 py-1.5 text-xs xl:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-[#002147] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-[#002147] hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-emerald-500" />
              <span>Chat</span>
            </button>

            {/* Explore / Memes */}
            <button
              onClick={() => {
                setActiveTab('memes');
                setIsMenuDrawerOpen(false);
                setDesktopDropdown(null);
              }}
              className={`px-3 py-1.5 text-xs xl:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'memes'
                  ? 'bg-[#002147] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-[#002147] hover:bg-slate-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-amber-500" />
              <span>Memes</span>
            </button>

            {/* Aux Cord Battles */}
            <button
              onClick={() => {
                setActiveTab('aux');
                setIsMenuDrawerOpen(false);
                setDesktopDropdown(null);
              }}
              className={`px-3 py-1.5 text-xs xl:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'aux'
                  ? 'bg-[#002147] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-[#002147] hover:bg-slate-100'
              }`}
            >
              <Music className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-indigo-500" />
              <span>87.7 FM Aux</span>
            </button>

            {/* Student Hub Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDesktopDropdown(desktopDropdown === 'hub' ? null : 'hub')}
                className={`px-3 py-1.5 text-xs xl:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'hub' || desktopDropdown === 'hub'
                    ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                    : 'text-slate-700 hover:text-[#002147] hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-emerald-500" />
                <span>Student Hub</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${desktopDropdown === 'hub' ? 'rotate-180 text-indigo-600' : ''}`} />
              </button>

              {desktopDropdown === 'hub' && (
                <div
                  className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1"
                  onMouseLeave={() => setDesktopDropdown(null)}
                >
                  <button
                    onClick={() => {
                      setActiveTab('hub');
                      setHubSection('polls');
                      setDesktopDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left text-xs xl:text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <BarChart2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">Campus Polls & Surveys</div>
                      <div className="text-[11px] text-slate-500 font-normal">Student voting & SRC surveys</div>
                    </div>
                  </button>
                  {currentUser.is_admin && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setDesktopDropdown(null);
                      }}
                      className="w-full px-4 py-2 text-left text-xs xl:text-sm font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>
                        <div className="font-bold text-rose-900">Safety Command Center</div>
                        <div className="text-[11px] text-rose-600 font-normal">Admin Moderation & Student Records</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Admin Center (if admin) */}
            {currentUser.is_admin && (
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setIsMenuDrawerOpen(false);
                  setDesktopDropdown(null);
                }}
                className={`px-3 py-1.5 text-xs xl:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-rose-500" />
                <span>Admin</span>
                {pendingReportsCount > 0 && (
                  <span className="w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-mono flex items-center justify-center font-bold">
                    {pendingReportsCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Quick Header Actions & Prominent MENU Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Quick action buttons for active tab */}
            {activeTab === 'chat' && (
              <button
                onClick={() => setShowNewChatModal(true)}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors cursor-pointer"
                title="Start New Peer Chat"
              >
                <SquarePen className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>
            )}

            {activeTab === 'vlogs' && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors cursor-pointer"
                title="Upload Campus Story"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Post Story</span>
              </button>
            )}

            {activeTab === 'memes' && (
              <button
                onClick={() => setShowMemeModal(true)}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors cursor-pointer"
                title="Publish Campus Meme"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Post Meme</span>
              </button>
            )}

            {/* Verified Student Pill */}
            <button
              onClick={() => {
                setActiveTab('profile');
                setIsMenuDrawerOpen(false);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[#002147] transition-colors cursor-pointer"
              title={`Logged in as @${currentUser.username}`}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                className="w-4.5 h-4.5 rounded-full object-cover shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80';
                }}
              />
              <span className="truncate max-w-[65px] sm:max-w-[95px]">@{currentUser.username}</span>
            </button>

            {/* Prominent KTU MENU Button (Matching Screenshot 11 & 13) */}
            <button
              onClick={() => setIsMenuDrawerOpen(!isMenuDrawerOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer shadow-2xs ${
                isMenuDrawerOpen
                  ? 'bg-[#002147] border-[#002147] text-white ring-2 ring-[#002147]/20'
                  : 'bg-white border-slate-300 hover:border-[#002147] hover:bg-slate-50 text-[#002147]'
              }`}
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuDrawerOpen}
              title="Toggle KTU Campus Navigation Menu"
            >
              {isMenuDrawerOpen ? (
                <>
                  <span className="text-sm font-black leading-none">✕</span>
                  <span className="uppercase text-[11px] sm:text-xs font-black">CLOSE</span>
                </>
              ) : (
                <>
                  <Menu className="w-4 h-4 stroke-[2.5]" />
                  <span className="uppercase text-[11px] sm:text-xs font-black">MENU</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. EXPANDABLE NAVIGATION DRAWER MENU (MAINTAINING OLD FEATURES)     */}
        {/* =================================================================== */}
        {/* Backdrop for outside click */}
        <div
          className={`fixed inset-0 top-14 bg-slate-900/40 backdrop-blur-xs z-30 transition-all duration-300 ease-in-out ${
            isMenuDrawerOpen
              ? 'opacity-100 visible pointer-events-auto'
              : 'opacity-0 invisible pointer-events-none'
          }`}
          onClick={() => setIsMenuDrawerOpen(false)}
        />

        <nav
          className={`fixed top-14 left-0 right-0 md:left-auto md:right-4 z-40 w-full md:max-w-[400px] bg-white border-t md:border border-slate-200 shadow-2xl border-b-4 border-[#002147] md:rounded-b-2xl max-h-[calc(100vh-4rem)] overflow-y-auto transition-all duration-300 ease-in-out transform ${
            isMenuDrawerOpen
              ? 'opacity-100 visible pointer-events-auto translate-y-0 scale-100'
              : 'opacity-0 invisible pointer-events-none -translate-y-2 scale-98 pointer-events-none'
          }`}
        >
              <div className="w-full">
                
                {/* Student Identity Card in Menu */}
                <div className="p-3.5 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-white shadow-xs shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900">{currentUser.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#002147] text-white font-mono">
                          {currentUser.student_id}
                        </span>
                        {currentUser.is_admin ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            👑 Admin
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Verified Student
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {currentUser.faculty} · @{currentUser.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setIsMenuDrawerOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[#002147] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowReportModal(true);
                        setIsMenuDrawerOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>
                  </div>
                </div>

                {/* Quick Menu Item Filter Bar */}
                <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-100 flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={menuFilterQuery}
                    onChange={(e) => setMenuFilterQuery(e.target.value)}
                    placeholder="Filter features (feed, chat, memes, aux, polls)..."
                    className="w-full text-xs sm:text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400"
                  />
                  {menuFilterQuery && (
                    <button
                      onClick={() => setMenuFilterQuery('')}
                      className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Main Student Features Navigation List (Matching Screenshot 13) */}
                <div className="divide-y divide-slate-100">
                  
                  {/* 1. Home / Feed */}
                  {(!menuFilterQuery || 'feed home stories vlogs videos'.includes(menuFilterQuery.toLowerCase())) && (
                    <button
                      onClick={() => {
                        setActiveTab('vlogs');
                        setIsMenuDrawerOpen(false);
                      }}
                      className={`w-full text-left px-5 sm:px-8 py-3.5 text-[14px] sm:text-[15px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        activeTab === 'vlogs' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Video className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                        <div>
                          <div className="font-bold">Campus Feed & Stories</div>
                          <div className="text-[11px] text-slate-500 font-normal">30-second student micro-vlogs & reels</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">Watch</span>
                    </button>
                  )}

                  {/* 2. Direct Messages */}
                  {(!menuFilterQuery || 'chat messages dm peers inbox'.includes(menuFilterQuery.toLowerCase())) && (
                    <button
                      onClick={() => {
                        setActiveTab('chat');
                        setIsMenuDrawerOpen(false);
                      }}
                      className={`w-full text-left px-5 sm:px-8 py-3.5 text-[14px] sm:text-[15px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        activeTab === 'chat' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                        <div>
                          <div className="font-bold">Peer Direct Messages</div>
                          <div className="text-[11px] text-slate-500 font-normal">Direct encrypted student chat & classmates</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Chat</span>
                    </button>
                  )}

                  {/* 3. Brainrot Meme Vault */}
                  {(!menuFilterQuery || 'memes brainrot vault hall banter explore'.includes(menuFilterQuery.toLowerCase())) && (
                    <button
                      onClick={() => {
                        setActiveTab('memes');
                        setIsMenuDrawerOpen(false);
                      }}
                      className={`w-full text-left px-5 sm:px-8 py-3.5 text-[14px] sm:text-[15px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        activeTab === 'memes' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Flame className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                        <div>
                          <div className="font-bold">Brainrot Meme Vault & Hall Wars</div>
                          <div className="text-[11px] text-slate-500 font-normal">Campus satire, banter & viral memes</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Viral</span>
                    </button>
                  )}

                  {/* 4. 87.7 FM Aux Cord Battles */}
                  {(!menuFilterQuery || 'aux music battles radio audio tracks dj'.includes(menuFilterQuery.toLowerCase())) && (
                    <button
                      onClick={() => {
                        setActiveTab('aux');
                        setIsMenuDrawerOpen(false);
                      }}
                      className={`w-full text-left px-5 sm:px-8 py-3.5 text-[14px] sm:text-[15px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        activeTab === 'aux' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Music className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                        <div>
                          <div className="font-bold">87.7 FM Aux Cord Battles</div>
                          <div className="text-[11px] text-slate-500 font-normal">Daily music duels & campus radio</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">87.7 FM</span>
                    </button>
                  )}

                  {/* 5. Live Campus Polls */}
                  {(!menuFilterQuery || 'polls voting surveys src elections hub'.includes(menuFilterQuery.toLowerCase())) && (
                    <button
                      onClick={() => {
                        setActiveTab('hub');
                        setHubSection('polls');
                        setIsMenuDrawerOpen(false);
                      }}
                      className="w-full text-left px-5 sm:px-8 py-3.5 text-[14px] sm:text-[15px] font-bold text-slate-900 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <BarChart2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                        <div>
                          <div className="font-bold">Live Student Polls & Surveys</div>
                          <div className="text-[11px] text-slate-500 font-normal">SRC voting & real-time campus opinions</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  {/* Admin Safety Command Center (when admin) */}
                  {currentUser.is_admin ? (
                    <div className="bg-rose-50/60 p-3 sm:px-6 space-y-2">
                      <button
                        onClick={() => {
                          setActiveTab('admin');
                          setIsMenuDrawerOpen(false);
                        }}
                        className="w-full text-left p-3 bg-white border border-rose-200 rounded-xl shadow-xs font-bold text-rose-900 hover:bg-rose-50 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Shield className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                          <div>
                            <div className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                              <span>Safety Command Center</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-600 text-white font-mono">
                                👑 Dean Oversight
                              </span>
                            </div>
                            <div className="text-[10px] text-rose-700 font-normal">
                              Moderate reports ({pendingReportsCount} pending), bans & campus safety
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-rose-400" />
                      </button>

                      <button
                        type="button"
                        onClick={loginAsStudentKwame}
                        className="w-full text-center py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer"
                      >
                        Switch to Student View (@kwame_cs)
                      </button>
                    </div>
                  ) : (
                    /* Easy Quick Admin Login for Bruce Doku (brucedoku3@gmail.com) */
                    <div className="p-3 sm:px-6 bg-slate-50 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={loginAsBruceAdmin}
                        className="w-full py-2.5 px-3 bg-white border border-indigo-200 rounded-xl shadow-xs text-xs font-bold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-between cursor-pointer"
                        title="Instant administrator access for Bruce Doku"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-indigo-600" />
                          <div className="text-left">
                            <span className="block font-bold">Admin Login (Bruce Doku)</span>
                            <span className="block text-[10px] text-slate-500 font-mono">brucedoku3@gmail.com</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                          Login 👑
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Sign Out / Exit */}
                  <div className="px-5 sm:px-8 py-3.5 bg-slate-50 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setIsLoggedIn(false);
                        setIsMenuDrawerOpen(false);
                        try {
                          localStorage.setItem('ktu_is_logged_in', 'false');
                        } catch (e) {}
                        triggerToast('Signed out. Returned to KTU Welcome Screen.');
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-2 cursor-pointer py-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out of KTU Social
                    </button>
                    <span className="text-[11px] text-slate-400 font-medium">
                      KTU CampusSocial · 2026
                    </span>
                  </div>

                </div>
              </div>
            </nav>
      </header>

      {/* Real-time Campus Emergency & Advisory Broadcast System Banner */}
      <CampusBroadcastBanner
        broadcast={campusBroadcast}
        isAdmin={currentUser.is_admin}
        onUpdateBroadcast={(updated) => {
          setCampusBroadcast(updated);
          if (updated) {
            triggerToast('📢 Live Campus Broadcast Alert updated!');
          }
        }}
        triggerToast={triggerToast}
      />

      {/* ===================================================================== */}
      {/* MAIN VIEWPORT                                                         */}
      {/* ===================================================================== */}
      <main className={`flex-1 w-full mx-auto px-2.5 sm:px-6 py-2 sm:py-4 pb-20 md:pb-8 transition-all duration-300 ${
        activeTab === 'vlogs' ? 'max-w-7xl' : 'max-w-4xl'
      }`}>
        {feedbackToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-slate-700 backdrop-blur-xs whitespace-nowrap animate-in fade-in slide-in-from-top-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB: ADMIN COMMAND CENTER (PROMPT 4.1)                               */}
        {/* =================================================================== */}
        {activeTab === 'admin' && (
          currentUser.is_admin ? (
            <div className="space-y-4">
            {/* Top Status Banner with Hardcoded Super-Admin Badge */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="p-0.5 rounded-2xl bg-white border border-slate-200 shadow-xs shrink-0">
                    <KTULogo size={46} alt="KTU Dean of Students Crest" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">
                        KTU Safety Command Center
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-800 font-mono">
                        👑 Dean of Student Affairs Oversight
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Koforidua Technical University · Dean of Student Affairs & Safety Oversight
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>System Health: Operational</span>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold font-mono text-slate-900">{studentAccounts.length} Students</div>
                    <div className="text-[10px] text-slate-500">Verified Database</div>
                  </div>
                </div>
              </div>

              {/* 3 Metric Cards Grid per Prompt 4.1.1 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3.5 pt-3.5 border-t border-slate-100">
                {/* 1. Pending Reports (Red Accent Badge) */}
                <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-800">Pending Reports</span>
                    <span className="text-[10px] font-bold font-mono bg-rose-600 text-white px-1.5 py-0.2 rounded">
                      {pendingReportsCount} Active
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-rose-900 mt-1">{pendingReportsCount}</div>
                  <div className="text-[10px] text-rose-600">Reports awaiting staff action</div>
                </div>

                {/* 2. Banned/Suspended Students */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-800">Banned / Suspended</span>
                    <span className="text-base">⏸️</span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-amber-900 mt-1">
                    {suspendedCount + bannedCount}
                  </div>
                  <div className="text-[10px] text-amber-700 font-mono">
                    {suspendedCount} suspended · {bannedCount} permanent bans
                  </div>
                </div>

                {/* 3. Active Vlogs & Confessions */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Active Vlogs & Confessions</span>
                    <span className="text-base">📹</span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
                    {vlogsList.length + reportsList.filter(r => r.is_anonymous).length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {vlogsList.length} micro-vlogs · 42 campus confessions
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex gap-1.5 border-b border-slate-200 pb-1 overflow-x-auto">
              {[
                { id: 'queue', label: `Pending Queue (${pendingReportsCount})` },
                { id: 'tracing', label: 'Anonymous Tracing Panel' },
                { id: 'users', label: 'Student Accounts & Sanctions' },
                { id: 'hub_manager', label: '📢 Hub Bulletins & Polls' },
                { id: 'broadcast', label: '📻 Emergency Broadcast' },
                { id: 'audit', label: `Audit Trail (${modLogsList.length})` },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setAdminTab(sub.id as any)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
                    adminTab === sub.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* SUB-VIEW 1: MODERATION QUEUE */}
            {adminTab === 'queue' && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">Safety Flagged Content Queue</h3>
                  <span className="text-[11px] text-slate-500">Non-AI Human Administrative Moderation</span>
                </div>

                {reportsList.filter((r) => r.status === 'pending').length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {reportsList
                      .filter((r) => r.status === 'pending')
                      .map((report) => (
                        <div key={report.id} className="p-3.5 space-y-2 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[11px] font-bold text-slate-400">#{report.id}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                                {report.target_type} #{report.target_id}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                {report.reason.replace('_', ' ')}
                              </span>
                              {report.is_anonymous && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  🔒 Traced Anonymous
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{report.created_at}</span>
                          </div>

                          {/* Content Snippet */}
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800">
                            <p className="font-medium">{report.target_preview}</p>
                            <p className="text-[11px] text-slate-500 mt-1 italic">
                              Reporter @{report.reporter_username} note: "{report.details}"
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                            <div className="text-[11px] text-slate-500">
                              Reported by <span className="font-semibold text-slate-700">@{report.reporter_username}</span> ({report.reporter_student_id})
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => {
                                  setSelectedTraceReportId(report.id);
                                  setAdminTab('tracing');
                                }}
                                className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 cursor-pointer"
                              >
                                🔍 Trace
                              </button>
                              <button
                                onClick={() => handleExecuteModAction(report.id, 'dismiss')}
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 cursor-pointer"
                              >
                                ✓ Dismiss
                              </button>
                              <button
                                onClick={() => {
                                  triggerDeleteConfirm({
                                    title: 'Delete Reported Content?',
                                    message: `As KTU Administrator, you are executing permanent deletion of this reported ${report.target_type}. This action will be logged in the Dean of Student Affairs audit trail.`,
                                    itemPreview: report.target_preview,
                                    confirmText: 'Delete Content',
                                    iconType: 'shield',
                                    onConfirm: () => {
                                      handleExecuteModAction(report.id, 'delete_content');
                                    },
                                  });
                                }}
                                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 cursor-pointer"
                              >
                                🗑️ Delete
                              </button>
                              <button
                                onClick={() => {
                                  setSuspendTargetReportId(report.id);
                                  setSuspendTargetUserId(null);
                                  setShowSuspendModal(true);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 cursor-pointer"
                              >
                                ⏸️ Suspend
                              </button>
                              <button
                                onClick={() => {
                                  triggerDeleteConfirm({
                                    title: 'Permanently Ban User Account?',
                                    message: 'Are you sure you want to permanently ban this user account from KTU Social? They will lose access to login, campus feeds, messaging, and university services.',
                                    itemPreview: `Account: @${report.real_author?.username || report.reporter_username}`,
                                    confirmText: 'Permanently Ban',
                                    isDangerous: true,
                                    iconType: 'alert',
                                    onConfirm: () => {
                                      handleExecuteModAction(report.id, 'ban_user');
                                    },
                                  });
                                }}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-md cursor-pointer"
                              >
                                ⛔ Ban
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 space-y-2">
                    <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">Queue is Clear</p>
                    <p className="text-[11px] text-slate-400">All student submissions comply with campus community guidelines.</p>
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 2: ANONYMOUS TRACING PANEL */}
            {adminTab === 'tracing' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Accountable Anonymous Content Safety Audit</h3>
                      <p className="text-[11px] text-slate-500">
                        While confessions & reviews are anonymous to the student public, underlying KTU student IDs are strictly traced in the DB.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded">
                      🔒 ADMIN EYES ONLY
                    </span>
                  </div>

                  {/* Selector */}
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter Report ID (e.g. 1, 2, 3...)"
                      value={manualTraceInput}
                      onChange={(e) => setManualTraceInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => {
                        const id = parseInt(manualTraceInput, 10);
                        if (id) setSelectedTraceReportId(id);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg cursor-pointer"
                    >
                      Audit Report
                    </button>
                  </div>
                </div>

                {/* Selected Report Inspection Card */}
                {(() => {
                  const targetReport = reportsList.find((r) => r.id === selectedTraceReportId) || reportsList[0];
                  if (!targetReport) return null;

                  return (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">Report #{targetReport.id} Detailed Audit</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                            {targetReport.target_type} #{targetReport.target_id}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          {targetReport.is_anonymous ? 'PUBLICLY ANONYMOUS' : 'PUBLIC ATTRIBUTION'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Reported Content Box */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reported Content Preview</h4>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-2.5 rounded border border-slate-200">
                            {targetReport.target_preview}
                          </p>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <div><strong className="text-slate-700">Flagged Reason:</strong> {targetReport.reason}</div>
                            <div><strong className="text-slate-700">Reporter:</strong> @{targetReport.reporter_username} ({targetReport.reporter_student_id})</div>
                            <div><strong className="text-slate-700">Details:</strong> {targetReport.details}</div>
                          </div>
                        </div>

                        {/* Real Author DB Record (Admin Safety Decryption) */}
                        <div className="bg-rose-50/50 border border-rose-200 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Underlying Author Record</h4>
                            <span className="text-[9px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded">VERIFIED KTU DB</span>
                          </div>

                          {targetReport.real_author ? (
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between py-1 border-b border-rose-100">
                                <span className="text-slate-500 text-[11px]">KTU Student ID:</span>
                                <span className="font-mono font-bold text-slate-900">{targetReport.real_author.student_id}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-rose-100">
                                <span className="text-slate-500 text-[11px]">User Primary Key:</span>
                                <span className="font-mono text-slate-700">ID #{targetReport.real_author.id}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-rose-100">
                                <span className="text-slate-500 text-[11px]">Student Handle:</span>
                                <span className="font-bold text-slate-900">@{targetReport.real_author.username}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-rose-100">
                                <span className="text-slate-500 text-[11px]">Campus Email:</span>
                                <span className="font-mono text-slate-700">{targetReport.real_author.email}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-slate-500 text-[11px]">Karma Score:</span>
                                <span className="font-semibold text-slate-900">{targetReport.real_author.karma_score}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 italic py-4 text-center">
                              Author record not located in database.
                            </div>
                          )}

                          <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                triggerDeleteConfirm({
                                  title: 'Delete Offending Content?',
                                  message: `Permanently delete this reported ${targetReport.target_type}? This will remove it immediately from KTU campus platform.`,
                                  itemPreview: targetReport.target_preview,
                                  confirmText: 'Delete Content',
                                  iconType: 'shield',
                                  onConfirm: () => {
                                    handleExecuteModAction(targetReport.id, 'delete_content');
                                  },
                                });
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-white border border-rose-300 rounded hover:bg-rose-100 cursor-pointer"
                            >
                              🗑️ Delete Content
                            </button>
                            <button
                              onClick={() => {
                                setSuspendTargetReportId(targetReport.id);
                                setSuspendTargetUserId(null);
                                setShowSuspendModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-white border border-amber-300 rounded hover:bg-amber-100 cursor-pointer"
                            >
                              ⏸️ Suspend Student
                            </button>
                            <button
                              onClick={() => {
                                triggerDeleteConfirm({
                                  title: 'Permanently Ban Student Account?',
                                  message: `Are you sure you want to permanently ban student @${targetReport.real_author?.username || 'user'}? All account privileges will be permanently revoked.`,
                                  itemPreview: `Student ID: ${targetReport.real_author?.student_id || 'N/A'} · Email: ${targetReport.real_author?.email || 'N/A'}`,
                                  confirmText: 'Permanently Ban',
                                  isDangerous: true,
                                  iconType: 'alert',
                                  onConfirm: () => {
                                    handleExecuteModAction(targetReport.id, 'ban_user');
                                  },
                                });
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 rounded hover:bg-black cursor-pointer"
                            >
                              ⛔ Permanent Ban
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUB-VIEW 3: STUDENT ACCOUNT MANAGEMENT */}
            {adminTab === 'users' && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-3 p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-xs font-bold text-slate-900">Student Directory & Sanctions</h3>
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Filter student ID or username..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {studentAccounts
                    .filter((u) => {
                      const q = userSearchTerm.toLowerCase();
                      return (
                        u.username.toLowerCase().includes(q) ||
                        u.student_id.toLowerCase().includes(q) ||
                        u.faculty.toLowerCase().includes(q)
                      );
                    })
                    .map((student) => (
                      <div key={student.id} className="py-2.5 flex items-center justify-between gap-2 flex-wrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">@{student.username}</span>
                            <span className="font-mono text-[10px] text-slate-400">({student.student_id})</span>
                            {student.role === 'admin' && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-indigo-100 text-indigo-700 rounded">
                                Admin
                              </span>
                            )}
                            {student.is_verified && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-100 text-blue-700 rounded flex items-center gap-0.5">
                                Verified ✓
                              </span>
                            )}
                            {student.is_shadowbanned && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-purple-100 text-purple-800 rounded">
                                Shadowbanned
                              </span>
                            )}
                            {student.is_muted && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-900 rounded">
                                Muted
                              </span>
                            )}
                            {(student.admin_warnings_count || 0) > 0 && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-100 text-rose-800 rounded">
                                {student.admin_warnings_count} Strikes
                              </span>
                            )}
                            {student.is_banned ? (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-100 text-rose-700 rounded">
                                Banned
                              </span>
                            ) : student.is_suspended ? (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">
                                Suspended ({student.suspension_until})
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {student.email} · Karma: {student.karma_score} · {student.faculty}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenAdminUserControl(student)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                            title="Open Complete Social Media Administrator Control Suite"
                          >
                            <Shield className="w-3 h-3 text-amber-300" />
                            <span>Manage & Sanction</span>
                          </button>
                          {student.is_banned ? (
                            <button
                              onClick={() => handleDirectUserSanction(student.id, 'unban')}
                              className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded cursor-pointer"
                            >
                              Lift Ban
                            </button>
                          ) : student.is_suspended ? (
                            <>
                              <button
                                onClick={() => handleDirectUserSanction(student.id, 'unsuspend')}
                                className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded cursor-pointer"
                              >
                                Lift Suspension
                              </button>
                              <button
                                onClick={() => handleDirectUserSanction(student.id, 'ban')}
                                className="px-2 py-1 text-[11px] font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded cursor-pointer"
                              >
                                Ban
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setSuspendTargetReportId(null);
                                  setSuspendTargetUserId(student.id);
                                  setShowSuspendModal(true);
                                }}
                                className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded cursor-pointer"
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => handleDirectUserSanction(student.id, 'ban')}
                                className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded cursor-pointer"
                              >
                                Ban
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* SUB-VIEW: CAMPUS HUB & OFFICIAL BULLETINS */}
            {adminTab === 'hub_manager' && (
              <AdminHubManager
                onPublishNews={(news) => {
                  setHubNewsList((prev) => [news, ...prev]);
                  triggerToast('📢 Official campus bulletin published to KTU Hub!');
                }}
                onPublishPoll={handlePublishAdminPoll}
                onPublishEvent={(event) => {
                  setHubEventsList((prev) => [event, ...prev]);
                  triggerToast('📅 Campus event added to schedule!');
                }}
                triggerToast={triggerToast}
              />
            )}

            {/* SUB-VIEW: LIVE CAMPUS BROADCAST ALERTS */}
            {adminTab === 'broadcast' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Live Campus Broadcast & Alert Dispatcher</h3>
                      <p className="text-[11px] text-slate-500">Push high-priority real-time banners to all KTU students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${campusBroadcast?.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      Status: {campusBroadcast?.active ? '🔴 Active Alert Live' : 'Standby / Inactive'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Current Broadcast Content:</h4>
                  {campusBroadcast ? (
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{campusBroadcast.title}</span>
                        <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                          {campusBroadcast.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{campusBroadcast.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>Issued by: {campusBroadcast.author}</span>
                        <span>{campusBroadcast.created_at}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No alert currently configured.</p>
                  )}

                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setCampusBroadcast({
                          id: `broadcast-${Date.now()}`,
                          title: 'KTU Urgent Campus Safety Alert',
                          message: 'Immediate safety notice: Continuous assessment test sessions at CCB Complex are scheduled strictly as announced. Keep student IDs visible.',
                          severity: 'emergency',
                          active: true,
                          dismissible: true,
                          created_at: 'Just now',
                          author: 'Dean of Student Affairs',
                        });
                        triggerToast('🚨 Emergency Campus Broadcast Activated!');
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                    >
                      Broadcast Emergency Alert
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCampusBroadcast({
                          id: `broadcast-${Date.now()}`,
                          title: 'KTU Academic & Examination Advisory',
                          message: 'Library 2nd and 3rd floors are open 24/7 for students preparing for examinations. Quiet hours strictly enforced.',
                          severity: 'official',
                          active: true,
                          dismissible: true,
                          created_at: 'Just now',
                          author: 'KTU Administration / SRC',
                        });
                        triggerToast('📢 Official Campus Advisory Broadcast Activated!');
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                    >
                      Broadcast Academic Advisory
                    </button>
                    {campusBroadcast?.active && (
                      <button
                        type="button"
                        onClick={() => {
                          setCampusBroadcast(prev => prev ? { ...prev, active: false } : null);
                          triggerToast('Campus broadcast alert deactivated.');
                        }}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        Deactivate Alert
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 4: MODLOG AUDIT TRAIL */}
            {adminTab === 'audit' && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="p-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900">Administrative ModLog Audit Trail</h3>
                  <p className="text-[11px] text-slate-500">Immutable ledger of all disciplinary and moderation actions taken.</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {modLogsList.map((log) => (
                    <div key={log.id} className="p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 font-bold">#{log.id}</span>
                          <span className="font-bold text-slate-800">@{log.admin_username}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {log.target_type} #{log.target_id}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-600 pl-6">{log.reason_given}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto my-12 space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <Shield className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900">Restricted Access</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The Dean of Students & Campus Safety moderation command center is restricted to authorized university administrators. Normal student accounts do not have permission to view this console.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  onClick={loginAsBruceAdmin}
                  className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Authenticate as Bruce Doku (Admin)</span>
                </button>
                <button
                  onClick={() => setActiveTab('vlogs')}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Return to Campus Feed
                </button>
              </div>
            </div>
          )
        )}

        {/* =================================================================== */}
        {/* TAB: STUDENT VERIFIED PROFILE & TIKTOK STYLE MEMES/FEEDS VAULT      */}
        {/* =================================================================== */}
        {activeTab === 'onboarding' && (
          <StudentOnboardingFlow
            currentUser={currentUser}
            onUpdateCurrentUser={(updated) => {
              setCurrentUser(updated);
              try {
                localStorage.setItem('ktu_active_user', JSON.stringify(updated));
              } catch (e) {}
              setStudentAccounts((prev) =>
                prev.map((acc) =>
                  acc.username === updated.username || acc.email === updated.email
                    ? { ...acc, faculty: updated.faculty, email: updated.email }
                    : acc
                )
              );
            }}
            onFinish={() => {
              setActiveTab('profile');
              triggerToast('🎉 Profile updated! Welcome to KTU CampusSocial.');
            }}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === 'profile' && (() => {
          const profileToDisplay: UserProfileData = viewingProfileUser || {
            username: currentUser.username,
            name: currentUser.name || `@${currentUser.username}`,
            student_id: currentUser.student_id,
            email: currentUser.email,
            phone: '024 555 8921',
            faculty: currentUser.faculty,
            department: currentUser.faculty.includes('Science') ? 'Computer Science' : 'Engineering',
            level: 'Level 300 (Degree)',
            hostel: 'Universal Hall, Block C',
            avatar_url: currentUser.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
            bio: currentUser.bio || 'Official KTU student. Creating campus memes, tuning in to 87.7 FM, and building cool projects.',
            followers_count: 184,
            following_count: 92,
            likes_total: 1250,
            is_verified: true,
          };

          return (
            <StudentProfileView
              profileUser={profileToDisplay}
              currentUser={currentUser}
              userPosts={memePosts}
              userVlogs={vlogsList}
              onBack={viewingProfileUser ? () => setViewingProfileUser(null) : undefined}
              onStartChatWithUser={(uname) => {
                const peer = CAMPUS_STUDENTS.find((s) => s.username.toLowerCase() === uname.toLowerCase());
                if (peer) {
                  const exists = conversations.find((c) => c.partner_username.toLowerCase() === uname.toLowerCase());
                  if (!exists) {
                    setConversations((prev) => [
                      {
                        partner_id: Date.now(),
                        partner_username: peer.username,
                        partner_student_id: peer.studentId,
                        partner_avatar: peer.avatar,
                        faculty: peer.faculty,
                        last_message: 'Started new peer conversation',
                        last_timestamp: 'Just now',
                        unread_count: 0,
                        is_blocked: false,
                        is_online: peer.isOnline ?? true,
                      },
                      ...prev,
                    ]);
                  }
                }
                setActivePartnerUsername(uname);
                setMobileChatView('chat');
                setActiveTab('chat');
              }}
              onEditProfileClick={() => setActiveTab('onboarding')}
              onDeletePost={(postId, caption) => {
                triggerDeleteConfirm({
                  title: 'Delete Campus Post?',
                  message: 'Are you sure you want to permanently delete this post from your profile and the campus feed?',
                  itemPreview: caption,
                  confirmText: 'Delete Post',
                  onConfirm: () => {
                    setMemePosts((prev) => prev.filter((p) => p.id !== postId));
                    triggerToast('Post deleted from your profile and feed.');
                  },
                });
              }}
              triggerToast={triggerToast}
              openShareModal={openShareModal}
              onAdminAction={(action, uname) => {
                handleOpenAdminUserControl(uname);
              }}
            />
          );
        })()}

        {/* =================================================================== */}
        {/* TAB: PEER-TO-PEER MESSAGING (WHATSAPP / SOCIAL MEDIA ARCHITECTURE) */}
        {/* =================================================================== */}
        {activeTab === 'chat' && (() => {
          const filteredConversations = conversations.filter(
            (c) =>
              !chatSearchQuery.trim() ||
              c.partner_username.toLowerCase().includes(chatSearchQuery.toLowerCase().trim()) ||
              c.partner_student_id.toLowerCase().includes(chatSearchQuery.toLowerCase().trim()) ||
              c.faculty.toLowerCase().includes(chatSearchQuery.toLowerCase().trim()) ||
              c.last_message.toLowerCase().includes(chatSearchQuery.toLowerCase().trim())
          );
          const currentPartner = conversations.find((c) => c.partner_username === activePartnerUsername) || conversations[0];

          return (
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100dvh-8rem)] sm:h-[calc(100vh-130px)] max-h-[820px]">
              {/* ================================================================= */}
              {/* LEFT COLUMN: RECENT CHATS LIST (ARRANGED VERTICALLY LIKE WHATSAPP) */}
              {/* ================================================================= */}
              <div
                className={`w-full md:w-80 lg:w-96 md:border-r border-slate-200 flex flex-col bg-white shrink-0 min-h-0 h-full overflow-hidden ${
                  mobileChatView === 'chat' ? 'hidden md:flex' : 'flex'
                }`}
              >
                {/* Chats Top Bar */}
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Chats</h2>
                    {conversations.reduce((acc, c) => acc + c.unread_count, 0) > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-600 text-white shadow-xs">
                        {conversations.reduce((acc, c) => acc + c.unread_count, 0)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNewChatModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer active:scale-95 transition-all"
                    title="Start new conversation"
                  >
                    <SquarePen className="w-3.5 h-3.5" />
                    <span>New Chat</span>
                  </button>
                </div>

                {/* Search Bar for Conversations */}
                <div className="p-2.5 border-b border-slate-100 bg-white shrink-0">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      placeholder="Search recent chats or student..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100/80 border border-transparent rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-slate-200 transition-all"
                    />
                    {chatSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setChatSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Vertical Conversations List */}
                <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100/80 scrollbar-thin">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conv) => {
                      const isSelected = conv.partner_username === activePartnerUsername;
                      const isMuted = !!mutedPartners[conv.partner_username];
                      const isBlocked = !!blockedPartners[conv.partner_username];

                      return (
                        <div
                          key={conv.partner_username}
                          onClick={() => {
                            setActivePartnerUsername(conv.partner_username);
                            setConversations((prev) =>
                              prev.map((c) =>
                                c.partner_username === conv.partner_username ? { ...c, unread_count: 0 } : c
                              )
                            );
                            setMobileChatView('chat');
                            setShowChatMoreMenu(false);
                          }}
                          className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors relative select-none ${
                            isSelected
                              ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                              : 'hover:bg-slate-50 bg-white'
                          }`}
                        >
                          {/* Avatar with Online Green Dot */}
                          <div className="relative shrink-0">
                            <img
                              src={conv.partner_avatar}
                              alt={conv.partner_username}
                              className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs"
                            />
                            {conv.is_online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                            )}
                          </div>

                          {/* Conversation Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`text-xs truncate ${isSelected ? 'font-black text-indigo-950' : 'font-bold text-slate-900'}`}>
                                  @{conv.partner_username}
                                </span>
                                {isBlocked && (
                                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                                    Blocked
                                  </span>
                                )}
                                {isMuted && <BellOff className="w-3 h-3 text-slate-400 shrink-0" />}
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                {conv.last_timestamp}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-slate-500 truncate leading-snug">
                                {conv.last_message || 'Tap to view chat'}
                              </p>
                              {conv.unread_count > 0 && !isSelected && (
                                <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                              {conv.faculty}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center space-y-2 text-slate-400">
                      <MessageSquare className="w-8 h-8 mx-auto stroke-1" />
                      <p className="text-xs">No conversations found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ================================================================= */}
              {/* RIGHT COLUMN: ACTIVE CONVERSATION (WHATSAPP HEADER & 3-DOTS MORE) */}
              {/* ================================================================= */}
              <div
                className={`flex-1 flex flex-col bg-slate-50/50 min-h-0 h-full overflow-hidden ${
                  mobileChatView === 'list' ? 'hidden md:flex' : 'flex'
                }`}
              >
                {/* Active Chat WhatsApp-Style Header */}
                <div className="px-3.5 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between relative z-20 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Back button on mobile */}
                    <button
                      type="button"
                      onClick={() => setMobileChatView('list')}
                      className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="Back to all chats"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div
                      className="relative shrink-0 cursor-pointer"
                      onClick={() => openUserProfile(activePartnerUsername)}
                      title="View student profile"
                    >
                      <img
                        src={
                          currentPartner?.partner_avatar ||
                          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'
                        }
                        alt={activePartnerUsername}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs hover:ring-2 hover:ring-indigo-500 transition-all"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                    </div>

                    <div
                      className="min-w-0 cursor-pointer"
                      onClick={() => openUserProfile(activePartnerUsername)}
                      title="View student profile"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate hover:text-indigo-600 transition-colors">
                          @{activePartnerUsername}
                        </span>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 truncate">
                          {currentPartner?.partner_student_id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                        <span className="truncate">{currentPartner?.faculty}</span>
                        <span>·</span>
                        <span className="text-emerald-600 font-semibold shrink-0">Active now</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Header Actions with WhatsApp 3-Dots */}
                  <div className="flex items-center gap-1 relative">
                    <button
                      type="button"
                      onClick={() => setShowChatMoreMenu(!showChatMoreMenu)}
                      className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
                      title="More options"
                      aria-label="More chat options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* WhatsApp Dropdown Popover */}
                    {showChatMoreMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setShowChatMoreMenu(false)}
                        />
                        <div className="absolute right-0 top-11 z-40 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 text-xs text-slate-700">
                          {currentUser.is_admin && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowChatMoreMenu(false);
                                handleOpenAdminUserControl(activePartnerUsername);
                              }}
                              className="w-full px-3.5 py-2.5 text-left bg-indigo-50/75 hover:bg-indigo-100 text-indigo-900 font-bold flex items-center gap-2 cursor-pointer border-b border-indigo-100"
                            >
                              <Shield className="w-4 h-4 text-indigo-600" />
                              <span>Admin User Control Suite</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setShowChatMoreMenu(false);
                              openUserProfile(activePartnerUsername);
                            }}
                            className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <GraduationCap className="w-4 h-4 text-indigo-600" />
                            <span>View Student Profile</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowChatMoreMenu(false);
                              const isMuted = !mutedPartners[activePartnerUsername];
                              setMutedPartners((prev) => ({ ...prev, [activePartnerUsername]: isMuted }));
                              triggerToast(isMuted ? `Notifications muted for @${activePartnerUsername}` : `Notifications unmuted for @${activePartnerUsername}`);
                            }}
                            className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                          >
                            <BellOff className="w-4 h-4 text-slate-400" />
                            <span>{mutedPartners[activePartnerUsername] ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowChatMoreMenu(false);
                              triggerDeleteConfirm({
                                title: `Clear Chat with @${activePartnerUsername}?`,
                                message: `All messages in this peer thread with @${activePartnerUsername} will be permanently cleared from your device.`,
                                confirmText: 'Clear Chat',
                                onConfirm: () => {
                                  setMessageThreads((prev) => ({
                                    ...prev,
                                    [activePartnerUsername]: [],
                                  }));
                                  setConversations((prev) =>
                                    prev.map((c) =>
                                      c.partner_username === activePartnerUsername
                                        ? { ...c, last_message: 'Chat history cleared', unread_count: 0 }
                                        : c
                                    )
                                  );
                                  triggerToast(`Chat history with @${activePartnerUsername} cleared.`);
                                },
                              });
                            }}
                            className="w-full px-3.5 py-2.5 text-left hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 cursor-pointer border-t border-slate-100"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                            <span>Clear Chat History</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowChatMoreMenu(false);
                              const isBlocked = !blockedPartners[activePartnerUsername];
                              setBlockedPartners((prev) => ({ ...prev, [activePartnerUsername]: isBlocked }));
                              triggerToast(isBlocked ? `@${activePartnerUsername} has been blocked` : `@${activePartnerUsername} unblocked`);
                            }}
                            className="w-full px-3.5 py-2.5 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                          >
                            <Ban className="w-4 h-4 text-rose-600" />
                            <span>{blockedPartners[activePartnerUsername] ? 'Unblock Student' : 'Block Student'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowChatMoreMenu(false);
                              openReportModal('user', 2, `@${activePartnerUsername}`);
                            }}
                            className="w-full px-3.5 py-2.5 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                          >
                            <Flag className="w-4 h-4 text-rose-600" />
                            <span>Report Student</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Scrollable Chat Viewport */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 min-h-0 p-4 space-y-3 overflow-y-auto bg-slate-50/60"
                >
                  <div className="text-center my-1">
                    <span className="text-[10px] font-mono text-slate-400 bg-white/90 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                      🔒 KTU Verified Peer Session · End-to-End Encrypted
                    </span>
                  </div>

                  {(messageThreads[activePartnerUsername] || []).length === 0 && (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <MessageSquare className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                      <p className="text-xs font-medium">No messages yet with @{activePartnerUsername}</p>
                      <p className="text-[11px] text-slate-400">Say hello and start collaborating!</p>
                    </div>
                  )}

                  {(messageThreads[activePartnerUsername] || []).map((msg) => (
                    <div
                      key={msg.id}
                      className={`group flex flex-col ${msg.is_mine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="relative flex items-center gap-1.5 max-w-[85%] sm:max-w-[75%]">
                        {/* Message delete hover button */}
                        {msg.is_mine && (
                          <button
                            type="button"
                            onClick={() => {
                              triggerDeleteConfirm({
                                title: 'Delete Message?',
                                message: 'Are you sure you want to remove this message from the conversation?',
                                itemPreview: msg.body,
                                confirmText: 'Delete',
                                onConfirm: () => {
                                  setMessageThreads((prev) => ({
                                    ...prev,
                                    [activePartnerUsername]: (prev[activePartnerUsername] || []).filter((m) => m.id !== msg.id),
                                  }));
                                  triggerToast('Message deleted.');
                                },
                              });
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer shrink-0"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                            msg.is_mine
                              ? 'bg-indigo-600 text-white rounded-br-xs'
                              : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-mono ${
                              msg.is_mine ? 'text-indigo-200' : 'text-slate-400'
                            }`}
                          >
                            <span>{msg.created_at}</span>
                            {msg.is_mine && <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 italic bg-white px-3 py-1.5 rounded-full w-fit border border-slate-200 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-ping"></span>
                      <span>@{activePartnerUsername} is typing...</span>
                    </div>
                  )}
                </div>

                {/* Chat Footer Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0 relative z-10"
                >
                  <input
                    type="text"
                    value={chatMessageInput}
                    onChange={(e) => setChatMessageInput(e.target.value)}
                    placeholder={`Message @${activePartnerUsername}...`}
                    disabled={blockedPartners[activePartnerUsername]}
                    className="flex-1 min-h-[44px] px-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-indigo-400 transition-all disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!chatMessageInput.trim() || blockedPartners[activePartnerUsername]}
                    className="min-h-[44px] px-4 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl cursor-pointer shadow-xs font-bold text-xs transition-all active:scale-95"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </div>
          );
        })()}

        {/* =================================================================== */}
        {/* TAB: CAMPUS VLOGS (AUTHENTIC TIKTOK FOR YOU FEED INTERFACE)         */}
        {/* =================================================================== */}
        {activeTab === 'vlogs' && (
          <div className="w-full flex items-center justify-center animate-in fade-in duration-300">
            {(() => {
              const currentVlog = vlogsList[activeVlogIndex];
              if (!currentVlog) return null;
              const isFollowed = !!followedCreators[currentVlog.author];

              return (
                <div className="relative flex items-center justify-center w-full py-0 sm:py-2">
                  {/* DESKTOP SIDE NAVIGATION DOCK (TIKTOK WEB DESKTOP CONTROLS) */}
                  <div className="hidden lg:flex flex-col items-center gap-3 absolute right-6 xl:right-16 top-1/2 -translate-y-1/2 z-20">
                    <button
                      type="button"
                      onClick={goToPrevVlog}
                      className="p-3.5 rounded-full bg-slate-900/90 text-white border border-slate-700 shadow-xl hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all cursor-pointer group"
                      title="Previous video (Swipe down or ↑ arrow)"
                    >
                      <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>

                    <div className="px-3 py-1 bg-slate-900/90 text-white text-[11px] font-mono rounded-full font-bold border border-slate-700 shadow-md">
                      {activeVlogIndex + 1}/{vlogsList.length}
                    </div>

                    <button
                      type="button"
                      onClick={goToNextVlog}
                      className="p-3.5 rounded-full bg-slate-900/90 text-white border border-slate-700 shadow-xl hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all cursor-pointer group"
                      title="Next video (Swipe upwards or ↓ arrow)"
                    >
                      <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                    </button>

                    <div className="flex flex-col items-center gap-1 text-[10px] text-slate-400 mt-2 font-medium">
                      <span>Swipe up</span>
                      <span>for next</span>
                    </div>
                  </div>

                  {/* ============================================================= */}
                  {/* MAIN TIKTOK VIDEO CANVAS (9:16 VERTICAL REEL)                 */}
                  {/* ============================================================= */}
                  <div
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    className="relative w-full max-w-[420px] h-[calc(100dvh-8rem)] sm:h-[calc(100vh-130px)] max-h-[720px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10 select-none flex flex-col justify-between cursor-pointer"
                  >
                    {/* FIXED TIKTOK TOP FLOATING NAVIGATION BAR */}
                    <div className="absolute top-0 left-0 right-0 z-30 pt-3.5 px-4 pb-4 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/80 via-black/30 to-transparent">
                      {/* LIVE Badge */}
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-[#FE2C55] animate-ping"></span>
                        <span className="tracking-wide">LIVE</span>
                      </div>

                      {/* Following | For You Tabs */}
                      <div className="flex items-center gap-4 text-sm font-bold drop-shadow-md">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVlogFeedSubTab('following');
                            triggerToast('Showing stories from followed KTU creators');
                          }}
                          className={`transition-colors cursor-pointer ${
                            vlogFeedSubTab === 'following'
                              ? 'text-white font-extrabold scale-105'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Following
                        </button>
                        <span className="text-white/30 text-xs">|</span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVlogFeedSubTab('foryou');
                            }}
                            className={`transition-colors cursor-pointer ${
                              vlogFeedSubTab === 'foryou'
                                ? 'text-white font-extrabold scale-105'
                                : 'text-white/60 hover:text-white'
                            }`}
                          >
                            For You
                          </button>
                          {vlogFeedSubTab === 'foryou' && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-white rounded-full"></span>
                          )}
                        </div>
                      </div>

                      {/* Search & Mute Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMuted(!isMuted);
                          }}
                          className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 border border-white/20 cursor-pointer transition-colors"
                          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                        >
                          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUploadModal(true);
                          }}
                          className="px-2.5 py-1 bg-white text-slate-950 font-black rounded-lg flex items-center gap-1.5 shadow-md hover:bg-slate-100 transition-colors cursor-pointer select-none"
                          title="Post Campus Story"
                        >
                          <Camera className="w-3.5 h-3.5 text-slate-900 stroke-[2.5]" />
                          <span className="text-[10px] font-black tracking-tight uppercase">STORY</span>
                        </button>
                      </div>
                    </div>

                    {/* CONTINUOUS FLOWING TIKTOK VERTICAL REEL TRACK */}
                    <div
                      className="w-full h-full flex flex-col"
                      style={{
                        transform: `translate3d(0, calc(-${activeVlogIndex * 100}% + ${dragOffsetY}px), 0)`,
                        transition: isDragging ? 'none' : 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
                        willChange: 'transform',
                      }}
                    >
                      {vlogsList.map((vlog, idx) => {
                        const isCurrent = idx === activeVlogIndex;
                        const isFollowed = !!followedCreators[vlog.author];

                        return (
                          <div
                            key={vlog.id}
                            onClick={handleTikTokTap}
                            className="w-full h-full shrink-0 relative overflow-hidden flex flex-col justify-between"
                          >
                            {/* Video / Animated Background */}
                            {vlog.videoSrcUrl ? (
                              <video
                                ref={(el) => {
                                  if (isCurrent) {
                                    currentVideoRef.current = el;
                                  }
                                }}
                                src={vlog.videoSrcUrl}
                                className="w-full h-full object-cover"
                                autoPlay={isCurrent && isPlaying}
                                loop
                                muted={isMuted}
                                playsInline
                                onTimeUpdate={(e) => {
                                  if (isCurrent && !isScrubbing) {
                                    const vid = e.currentTarget;
                                    if (vid.duration && !isNaN(vid.duration) && vid.duration > 0) {
                                      setVlogProgress((vid.currentTime / vid.duration) * 100);
                                    }
                                  }
                                }}
                              />
                            ) : (
                              <div
                                className={`absolute inset-0 bg-gradient-to-b ${vlog.videoPlaceholderBg} flex items-center justify-center overflow-hidden`}
                              >
                                <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
                                <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />

                                <div className="text-center p-6 relative z-10 pointer-events-none">
                                  <div className="relative mx-auto w-24 h-24 rounded-3xl bg-black/40 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center shadow-2xl">
                                    <Video className="w-10 h-10 text-white" />
                                    <div className="flex items-end gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/20">
                                      <span className="w-1 h-3 bg-[#FE2C55] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                      <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                      <span className="w-1 h-2 bg-[#25F4EE] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                      <span className="w-1 h-3.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Floating Popping Hearts */}
                            {isCurrent && tiktokHearts.map((heart) => (
                              <div
                                key={heart.id}
                                style={{ left: heart.x - 30, top: heart.y - 30 }}
                                className="absolute z-40 pointer-events-none animate-in zoom-in-50 fade-in duration-300"
                              >
                                <Heart className="w-16 h-16 fill-[#FE2C55] text-[#FE2C55] filter drop-shadow-[0_0_15px_rgba(254,44,85,0.8)] -rotate-12 animate-pulse" />
                              </div>
                            ))}

                            {/* Centered Play/Pause Feedback Pulse */}
                            {isCurrent && showPlayIconPulse && (
                              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                                <div className="p-6 rounded-full bg-black/60 text-white backdrop-blur-md animate-in zoom-in-75 fade-in duration-200">
                                  {isPlaying ? <Play className="w-12 h-12 fill-white" /> : <Pause className="w-12 h-12 fill-white" />}
                                </div>
                              </div>
                            )}

                            {/* RIGHT ACTION COLUMN */}
                            <div className="absolute right-1.5 sm:right-2.5 bottom-3 sm:bottom-6 z-30 flex flex-col items-center gap-1.5 sm:gap-2.5 pointer-events-auto">
                              {/* Quick Post Story Action Rail Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowUploadModal(true);
                                }}
                                className="group relative w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#FE2C55] via-[#FF0050] to-[#EE1D52] p-0.5 shadow-lg shadow-rose-500/40 cursor-pointer active:scale-90 transition-transform hover:scale-105 flex items-center justify-center text-white"
                                title="Post Your Campus Story"
                              >
                                <div className="w-full h-full rounded-full bg-slate-950/20 backdrop-blur-xs flex items-center justify-center border border-white/60">
                                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform group-hover:scale-110" />
                                </div>
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white text-rose-600 text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-xs">
                                  +
                                </span>
                              </button>

                              {/* Creator Avatar & Follow Button */}
                              <div className="relative">
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowVlogCreator(true);
                                  }}
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#FE2C55] to-[#25F4EE] cursor-pointer shadow-xl active:scale-95 transition-transform"
                                  title={`View @${vlog.author}'s student profile`}
                                >
                                  <img
                                    src={vlog.avatar}
                                    alt={vlog.author}
                                    className="w-full h-full rounded-full object-cover border-2 border-white"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFollowCreator(vlog.author);
                                  }}
                                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-extrabold border-2 border-slate-950 shadow-md cursor-pointer transition-all hover:scale-110 active:scale-95 ${
                                    isFollowed
                                      ? 'bg-white text-emerald-600 scale-90'
                                      : 'bg-[#FE2C55] hover:bg-rose-600 text-white'
                                  }`}
                                  title={isFollowed ? 'Following' : 'Follow Creator'}
                                >
                                  {isFollowed ? '✓' : '+'}
                                </button>
                              </div>

                              {/* Like Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVlogVote(vlog.id, 1);
                                }}
                                className="flex flex-col items-center gap-0.5 text-white cursor-pointer active:scale-80 transition-transform group"
                                title="Like video"
                              >
                                <div className="p-0.5 sm:p-1">
                                  <Heart
                                    className={`w-6 h-6 sm:w-7 sm:h-7 transition-all drop-shadow-lg ${
                                      vlog.userVote === 1
                                        ? 'fill-[#FE2C55] text-[#FE2C55] scale-110'
                                        : 'fill-transparent text-white group-hover:scale-110'
                                    }`}
                                  />
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold drop-shadow-md tracking-tight">
                                  {vlog.upvotes}
                                </span>
                              </button>

                              {/* Comment Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowVlogComments(true);
                                }}
                                className="flex flex-col items-center gap-0.5 text-white cursor-pointer active:scale-80 transition-transform group"
                                title="Open comments"
                              >
                                <div className="p-0.5 sm:p-1">
                                  <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold drop-shadow-md tracking-tight">
                                  {vlog.comments.length}
                                </span>
                              </button>

                              {/* Bookmark Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveVlog(vlog.id);
                                }}
                                className="flex flex-col items-center gap-0.5 text-white cursor-pointer active:scale-80 transition-transform group"
                                title={vlog.isSaved ? 'Saved to Favorites' : 'Add to Favorites'}
                              >
                                <div className="p-0.5 sm:p-1">
                                  <Bookmark
                                    className={`w-6 h-6 sm:w-7 sm:h-7 drop-shadow-lg transition-all ${
                                      vlog.isSaved
                                        ? 'fill-[#FACE15] text-[#FACE15] scale-110'
                                        : 'text-white group-hover:scale-110'
                                    }`}
                                  />
                                </div>
                                <span className="text-[10px] sm:text-xs font-bold drop-shadow-md tracking-tight">
                                  {vlog.isSaved ? 'Saved' : 'Save'}
                                </span>
                              </button>

                              {/* Share Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareVlog(vlog);
                                }}
                                className="flex flex-col items-center gap-0.5 text-white cursor-pointer active:scale-80 transition-transform group"
                                title="Share video"
                              >
                                <div className="p-0.5 sm:p-1">
                                  <Share2 className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-[10px] sm:text-[11px] font-bold drop-shadow-md tracking-tight">
                                  Share
                                </span>
                              </button>

                              {/* Delete Story Button (Owner or Admin) */}
                              {(vlog.author === currentUser.username || currentUser.is_admin) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerDeleteConfirm({
                                      title: 'Delete Campus Story?',
                                      message: 'Are you sure you want to delete your 30s campus vlog? All views, comments, and upvotes will be permanently removed.',
                                      itemPreview: vlog.caption,
                                      confirmText: 'Delete Story',
                                      onConfirm: () => {
                                        setVlogsList((prev) => prev.filter((v) => v.id !== vlog.id));
                                        triggerToast('Campus story deleted.');
                                      },
                                    });
                                  }}
                                  className="flex flex-col items-center gap-0.5 text-white/90 hover:text-rose-400 cursor-pointer active:scale-80 transition-colors group"
                                  title="Delete your campus story"
                                >
                                  <div className="p-0.5 sm:p-1">
                                    <Trash2 className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-white group-hover:text-rose-400 drop-shadow-lg group-hover:scale-110 transition-transform" />
                                  </div>
                                  <span className="text-[9px] sm:text-[10px] font-bold drop-shadow-md tracking-tight">
                                    Delete
                                  </span>
                                </button>
                              )}
                            </div>

                            {/* BOTTOM-LEFT OVERLAY (TIKTOK METADATA & 30s TIME BADGE) */}
                            <div className="absolute left-0 right-14 sm:right-16 bottom-8 sm:bottom-9 z-20 p-3 sm:p-4 pb-1 bg-gradient-to-t from-black/95 via-black/75 to-transparent text-white space-y-1 pointer-events-auto">
                              {/* Department Tag Pill & 30s Video Badge */}
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <div className="inline-block px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/90 text-[10px] sm:text-[11px] font-black tracking-wider uppercase">
                                  {vlog.facultyBadge.replace(' · ', ' • ')}
                                </div>
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] text-white/90 font-mono font-bold">
                                  <Clock className="w-2.5 h-2.5 text-[#FE2C55]" />
                                  <span>
                                    {formatVlogTime(
                                      isCurrent && isScrubbing && scrubPreviewSeconds !== null
                                        ? scrubPreviewSeconds
                                        : isCurrent
                                        ? (vlogProgress / 100) * (vlog.duration || 30)
                                        : 0
                                    )}
                                  </span>
                                  <span className="text-white/40">/</span>
                                  <span className="text-white/70">{formatVlogTime(vlog.duration || 30)}</span>
                                </div>
                              </div>

                              {/* Large Bold Video Title */}
                              <h2 className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-md leading-tight">
                                {vlog.videoTitle}
                              </h2>

                              {/* Author with Blue Verified Badge */}
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowVlogCreator(true);
                                  }}
                                  className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1 hover:underline cursor-pointer drop-shadow-md"
                                >
                                  <span>@{vlog.author}</span>
                                  <span className="w-3.5 h-3.5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[8px] font-bold shadow-xs">
                                    ✓
                                  </span>
                                </button>
                                <span className="text-[10px] text-white/70">· {vlog.timeAgo}</span>
                              </div>

                              {/* Caption */}
                              <p className="text-xs sm:text-[13px] text-white/95 leading-snug font-normal drop-shadow-md line-clamp-2">
                                {vlog.caption}
                              </p>

                              {/* Location */}
                              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-white/80 font-medium pt-0.5">
                                <div className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 text-[#FE2C55] shrink-0" />
                                  <span className="truncate">{vlog.location}</span>
                                </div>
                                {isCurrent && (
                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        seekVlogRelativeSeconds(-5);
                                      }}
                                      className="px-1.5 py-0.5 rounded bg-black/40 hover:bg-white/20 text-[9px] font-mono text-white/90 border border-white/10 cursor-pointer active:scale-95 transition-all"
                                      title="Seek back 5 seconds"
                                    >
                                      -5s
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        seekVlogRelativeSeconds(5);
                                      }}
                                      className="px-1.5 py-0.5 rounded bg-black/40 hover:bg-white/20 text-[9px] font-mono text-white/90 border border-white/10 cursor-pointer active:scale-95 transition-all"
                                      title="Seek forward 5 seconds"
                                    >
                                      +5s
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* ===================================================================== */}
                            {/* CLICKABLE & DRAGGABLE PROGRESS SCRUBBER (30-SECOND DURATION)          */}
                            {/* ===================================================================== */}
                            {isCurrent ? (
                              <div
                                ref={scrubberContainerRef}
                                onMouseDown={handleScrubberMouseDown}
                                onTouchStart={handleScrubberTouchStart}
                                onMouseMove={(e) => {
                                  if (isScrubbing) return;
                                  setHoverScrubPercent(getScrubPercentageFromClientX(e.clientX));
                                }}
                                onMouseLeave={() => {
                                  if (!isScrubbing) setHoverScrubPercent(null);
                                }}
                                className="no-swipe group/scrubber absolute bottom-0 left-0 right-0 z-40 h-8 sm:h-9 flex flex-col justify-end pb-1.5 sm:pb-2 px-2.5 sm:px-3 cursor-ew-resize select-none pointer-events-auto"
                                title="Click or drag anywhere to seek through 30s video (Arrow keys: seek 3s)"
                              >
                                {/* Floating Seek Tooltip Bubble during Drag or Hover */}
                                {(isScrubbing || hoverScrubPercent !== null) && (
                                  <div
                                    className="absolute bottom-6 sm:bottom-7 -translate-x-1/2 pointer-events-none transition-all duration-75 z-50 flex flex-col items-center"
                                    style={{
                                      left: `${Math.max(8, Math.min(92, isScrubbing ? vlogProgress : (hoverScrubPercent ?? vlogProgress)))}%`,
                                    }}
                                  >
                                    <div className="px-2.5 py-1 bg-black/95 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-mono font-bold rounded-lg shadow-2xl border border-white/25 flex items-center gap-1.5 whitespace-nowrap">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#FE2C55] animate-ping" />
                                      <span className="text-white font-extrabold">
                                        {formatVlogTime(
                                          ((isScrubbing ? vlogProgress : (hoverScrubPercent ?? vlogProgress)) / 100) *
                                            (vlog.duration || 30)
                                        )}
                                      </span>
                                      <span className="text-white/40">/</span>
                                      <span className="text-white/70">{formatVlogTime(vlog.duration || 30)}</span>
                                      <span className="text-[9px] bg-rose-500/25 text-rose-300 px-1 py-0.2 rounded font-sans uppercase font-bold ml-0.5">
                                        SEEK
                                      </span>
                                    </div>
                                    <div className="w-2 h-2 bg-black/95 rotate-45 -mt-1 border-r border-b border-white/25" />
                                  </div>
                                )}

                                {/* Interactive Timeline Track */}
                                <div className="relative w-full h-1 sm:h-1.5 group-hover/scrubber:h-2.5 rounded-full bg-white/25 backdrop-blur-xs transition-all flex items-center">
                                  {/* Hover preview ghost bar */}
                                  {hoverScrubPercent !== null && !isScrubbing && (
                                    <div
                                      className="absolute top-0 bottom-0 left-0 rounded-full bg-white/20 pointer-events-none transition-all"
                                      style={{ width: `${hoverScrubPercent}%` }}
                                    />
                                  )}

                                  {/* Played Progress Bar Fill */}
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#FE2C55] via-rose-500 to-white shadow-[0_0_8px_rgba(254,44,85,0.7)] relative pointer-events-none"
                                    style={{
                                      width: `${vlogProgress}%`,
                                      transition: isScrubbing ? 'none' : 'width 100ms linear',
                                    }}
                                  />

                                  {/* Draggable Scrubber Thumb Handle */}
                                  <div
                                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow-xl border-2 border-[#FE2C55] pointer-events-none transition-transform duration-75 ${
                                      isScrubbing
                                        ? 'w-4 h-4 scale-125 ring-4 ring-rose-500/50'
                                        : 'w-2.5 h-2.5 group-hover/scrubber:w-3.5 group-hover/scrubber:h-3.5 group-hover/scrubber:scale-125'
                                    }`}
                                    style={{ left: `${vlogProgress}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/10 overflow-hidden">
                                <div className="h-full bg-white/20 w-0" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                      {/* ========================================================= */}
                      {/* TIKTOK SLIDE-UP COMMENTS DRAWER OVER VIDEO                */}
                      {/* ========================================================= */}
                      {showVlogComments && (
                        <div
                          className="absolute inset-x-0 bottom-0 z-40 bg-[#121212]/98 backdrop-blur-xl rounded-t-3xl border-t border-white/10 p-4 h-[68%] flex flex-col justify-between shadow-2xl animate-in slide-in-from-bottom duration-250 no-swipe text-white pointer-events-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Drawer Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-white/10">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white tracking-wide">
                                {currentVlog.comments.length} Comments
                              </h4>
                              <span className="text-[10px] text-slate-400 font-mono">KTU Verified</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowVlogComments(false)}
                              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Comments List */}
                          <div className="flex-1 overflow-y-auto py-2 space-y-3 scrollbar-thin">
                            {currentVlog.comments.length === 0 ? (
                              <div className="py-8 text-center text-slate-400 space-y-1">
                                <MessageSquare className="w-6 h-6 mx-auto text-slate-500" />
                                <p className="text-xs">No comments yet.</p>
                                <p className="text-[11px] text-slate-500">Be the first to comment on this story!</p>
                              </div>
                            ) : (
                              currentVlog.comments.map((comment) => (
                                <div key={comment.id} className="flex items-start gap-2.5 text-xs">
                                  <img
                                    src={comment.avatar}
                                    alt={comment.author}
                                    className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0 mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-white text-[12px]">@{comment.author}</span>
                                      <span className="text-[9px] text-slate-400 font-mono">({comment.studentId})</span>
                                      <span className="text-[9px] text-slate-500">· {comment.time}</span>
                                    </div>
                                    <p className="text-slate-200 text-xs mt-0.5 leading-relaxed">{comment.text}</p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleLikeVlogComment(currentVlog.id, comment.id)}
                                      className={`p-1 flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
                                        comment.userLiked ? 'text-[#FE2C55]' : 'text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      <Heart className={`w-3.5 h-3.5 ${comment.userLiked ? 'fill-[#FE2C55]' : ''}`} />
                                      <span className="text-[9px] font-bold">{comment.likes}</span>
                                    </button>

                                    {(comment.author === currentUser.username || currentUser.is_admin) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          triggerDeleteConfirm({
                                            title: 'Delete Comment?',
                                            message: 'Are you sure you want to remove your comment?',
                                            itemPreview: comment.text,
                                            confirmText: 'Delete',
                                            onConfirm: () => {
                                              setVlogsList((prev) =>
                                                prev.map((v) =>
                                                  v.id === currentVlog.id
                                                    ? { ...v, comments: v.comments.filter((c) => c.id !== comment.id) }
                                                    : v
                                                )
                                              );
                                              triggerToast('Comment removed.');
                                            },
                                          });
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
                                        title="Delete comment"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Comment Input */}
                          <form
                            onSubmit={(e) => handleAddVlogComment(e, currentVlog.id)}
                            className="pt-2 border-t border-white/10 flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={vlogCommentInput}
                              onChange={(e) => setVlogCommentInput(e.target.value)}
                              placeholder={`Add comment as @${currentUser.username}...`}
                              className="flex-1 px-3.5 py-2 text-xs bg-white/10 border border-white/15 rounded-full text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FE2C55] transition-all"
                            />
                            <button
                              type="submit"
                              disabled={!vlogCommentInput.trim()}
                              className="px-3.5 py-2 bg-[#FE2C55] hover:bg-rose-600 disabled:opacity-40 text-white text-xs font-bold rounded-full cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        </div>
                      )}

                      {/* ========================================================= */}
                      {/* TIKTOK SLIDE-UP CREATOR PROFILE SHEET OVER VIDEO          */}
                      {/* ========================================================= */}
                      {showVlogCreator && (
                        <div
                          className="absolute inset-x-0 bottom-0 z-40 bg-[#121212]/98 backdrop-blur-xl rounded-t-3xl border-t border-white/10 p-5 h-[58%] flex flex-col justify-between shadow-2xl animate-in slide-in-from-bottom duration-250 no-swipe text-white pointer-events-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-white/10">
                            <span className="text-xs font-bold text-slate-300">Creator Profile</span>
                            <button
                              type="button"
                              onClick={() => setShowVlogCreator(false)}
                              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="flex items-center gap-3 py-2">
                            <img
                              src={currentVlog.avatar}
                              alt={currentVlog.author}
                              className="w-14 h-14 rounded-full object-cover border-2 border-[#FE2C55] shadow-lg"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-sm text-white">@{currentVlog.author}</h4>
                                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold">
                                  ✓ Verified
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-mono">{currentVlog.studentId}</p>
                              <p className="text-xs text-rose-300 mt-0.5">{currentVlog.facultyBadge}</p>
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-xs flex justify-around text-center">
                            <div>
                              <div className="font-bold text-sm text-white">{currentVlog.views}</div>
                              <div className="text-[10px] text-slate-400">Views</div>
                            </div>
                            <div className="border-r border-white/10" />
                            <div>
                              <div className="font-bold text-sm text-[#FE2C55]">+{currentVlog.upvotes * 2}</div>
                              <div className="text-[10px] text-slate-400">Karma</div>
                            </div>
                            <div className="border-r border-white/10" />
                            <div>
                              <div className="font-bold text-sm text-white">{currentVlog.comments.length}</div>
                              <div className="text-[10px] text-slate-400">Comments</div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActivePartnerUsername(currentVlog.author);
                                setActiveTab('chat');
                              }}
                              className="flex-1 py-2.5 bg-[#FE2C55] hover:bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Direct Message</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                openShareModal({
                                  type: 'vlog',
                                  id: `creator-${currentVlog.author}`,
                                  title: `@${currentVlog.author}'s Profile`,
                                  subtitle: `KTU Campus Creator (${currentVlog.facultyBadge})`,
                                  author: currentVlog.author,
                                  avatar: currentVlog.avatar,
                                  badge: currentVlog.facultyBadge,
                                  url: `${window.location.origin}/#creator-${currentVlog.author}`,
                                });
                              }}
                              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                              title="Share creator profile"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openReportModal('vlog', currentVlog.id, currentVlog.caption)}
                              className="px-3.5 py-2.5 bg-white/10 hover:bg-rose-950/40 text-rose-300 border border-rose-400/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                              title="Report story"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB: BRAINROT MEMES (FULLY INTERACTIVE WITH COMMENTS & SHARING)     */}
        {/* =================================================================== */}
        {activeTab === 'memes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>KTU Brainrot Memes & Campus Feeds</span>
                </h3>
                <p className="text-[11px] text-slate-500">Trending campus jokes, photo stories, and viral TikTok sounds</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMemeModal(true)}
                className="group relative inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-110 text-white text-xs font-extrabold rounded-full shadow-sm shadow-orange-500/30 cursor-pointer active:scale-95 transition-all border border-amber-300/40"
                title="Publish Campus Meme or Feed Post"
              >
                <Flame className="w-3.5 h-3.5 fill-amber-200 text-amber-200 transition-transform group-hover:scale-110" />
                <span>+ Post Meme / Feed</span>
              </button>
            </div>

            {/* Multiple Tags Filter Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTagFilter(null)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  activeTagFilter === null
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🔥 All Posts ({memePosts.length})
              </button>
              {['#ktu', '#engineering', '#compsci', '#procurement', '#exams', '#hostellife', '#ootd', '#fast'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                    activeTagFilter === tag
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {[...memePosts]
              .sort((a, b) => (pinnedMemePostIds.includes(b.id) ? 1 : 0) - (pinnedMemePostIds.includes(a.id) ? 1 : 0))
              .filter((post) => {
                // Shadowban check: If author is shadowbanned and viewer is not admin and not the author, hide it
                const authorAcc = studentAccounts.find(s => s.username.toLowerCase() === post.author.toLowerCase());
                if (authorAcc?.is_shadowbanned && !currentUser.is_admin && currentUser.username.toLowerCase() !== post.author.toLowerCase()) {
                  return false;
                }
                if (!activeTagFilter) return true;
                return (
                  post.tags?.some((t) => t.toLowerCase() === activeTagFilter.toLowerCase()) ||
                  post.caption.toLowerCase().includes(activeTagFilter.toLowerCase()) ||
                  post.badge.toLowerCase().includes(activeTagFilter.toLowerCase())
                );
              })
              .map((post) => {
                const isCommentsOpen = !!expandedMemeComments[post.id];
                const isPinned = pinnedMemePostIds.includes(post.id);
                const isCommentsLocked = !!lockedMemePostComments[post.id];
                const authorAcc = studentAccounts.find(s => s.username.toLowerCase() === post.author.toLowerCase());

                return (
                  <div key={post.id} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
                    {/* Pinned Post Badge */}
                    {isPinned && (
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold w-fit">
                        <Pin className="w-3 h-3 text-amber-600 fill-amber-500" />
                        <span>PINNED BY CAMPUS ADMIN</span>
                      </div>
                    )}

                    {/* Author Header */}
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-2.5 cursor-pointer group"
                        onClick={() => openUserProfile(post.author)}
                        title={`View @${post.author}'s profile`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 text-white font-bold text-xs flex items-center justify-center shadow-xs group-hover:ring-2 group-hover:ring-indigo-500 transition-all">
                          {post.author[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                              @{post.author}
                            </span>
                            {authorAcc?.is_verified && (
                              <span className="text-[10px] text-blue-600 font-bold" title="Verified KTU Student">✓</span>
                            )}
                            {authorAcc?.is_shadowbanned && currentUser.is_admin && (
                              <span className="text-[9px] bg-purple-100 text-purple-800 px-1 rounded font-bold">Shadowbanned</span>
                            )}
                            {authorAcc?.is_muted && currentUser.is_admin && (
                              <span className="text-[9px] bg-amber-100 text-amber-900 px-1 rounded font-bold">Muted</span>
                            )}
                            <span className="text-[10px] font-mono text-slate-400">{post.studentId}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">{post.badge}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400">{post.time}</span>
                        <button
                          type="button"
                          onClick={() => openReportModal('post', post.id, post.caption)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                          title="Report meme"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>

                        {/* Super-Admin Social Media Post & Author Controls */}
                        {currentUser.is_admin && (
                          <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5 ml-0.5">
                            <button
                              type="button"
                              onClick={() => handleTogglePinPost(post.id)}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isPinned ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-amber-600'
                              }`}
                              title={isPinned ? 'Unpin post from feed' : 'Pin post to top of campus feed'}
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleLockComments(post.id)}
                              className={`p-1 rounded cursor-pointer transition-colors ${
                                isCommentsLocked ? 'text-rose-600 bg-rose-50' : 'text-slate-400 hover:text-rose-600'
                              }`}
                              title={isCommentsLocked ? 'Unlock comments' : 'Lock comments on post'}
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAdminUserControl(post.author)}
                              className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors"
                              title={`Admin User Controls for @${post.author}`}
                            >
                              <Shield className="w-3.5 h-3.5 text-indigo-600" />
                            </button>
                          </div>
                        )}

                        {(post.author === currentUser.username || currentUser.is_admin) && (
                          <button
                            type="button"
                            onClick={() => {
                              triggerDeleteConfirm({
                                title: 'Delete Campus Post?',
                                message: 'Are you sure you want to delete this campus post? It will be permanently removed from the KTU feed.',
                                itemPreview: post.caption,
                                confirmText: 'Delete Post',
                                onConfirm: () => {
                                  setMemePosts((prev) => prev.filter((m) => m.id !== post.id));
                                  triggerToast('Post removed.');
                                },
                              });
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                            title="Delete meme"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Caption */}
                    <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-normal">{post.caption}</p>

                    {/* Visual Graphic Banner or Uploaded Picture */}
                    {post.imageUrl ? (
                      <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 group">
                        <img
                          src={post.imageUrl}
                          alt="Campus meme or feed"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        {post.soundTitle && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlayingPostSoundId(playingPostSoundId === post.id ? null : post.id);
                              triggerToast(`🎵 Playing: ${post.soundTitle}`);
                            }}
                            className="absolute bottom-2.5 left-2.5 bg-slate-950/85 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20 cursor-pointer hover:bg-slate-900 transition-colors"
                          >
                            <Disc className={`w-3.5 h-3.5 text-pink-400 ${playingPostSoundId === post.id ? 'animate-spin' : ''}`} />
                            <span className="truncate max-w-[160px]">{post.soundTitle}</span>
                            {playingPostSoundId === post.id ? (
                              <Pause className="w-3 h-3 fill-current ml-0.5" />
                            ) : (
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`h-44 rounded-2xl bg-gradient-to-r ${post.imagePlaceholderBg} flex flex-col items-center justify-center text-white/90 shadow-inner relative overflow-hidden group cursor-pointer`}
                        onClick={() => handleMemeVote(post.id, 1)}
                        title="Click to upvote"
                      >
                        <Flame className="w-12 h-12 text-white/80 group-hover:scale-125 transition-transform" />
                        <span className="text-[11px] font-bold tracking-wider uppercase mt-1 text-white/90 drop-shadow">
                          {post.badge}
                        </span>
                      </div>
                    )}

                    {/* Attached TikTok Sound Bar (if no image attached) */}
                    {post.soundTitle && !post.imageUrl && (
                      <div
                        onClick={() => {
                          setPlayingPostSoundId(playingPostSoundId === post.id ? null : post.id);
                          triggerToast(`🎵 Playing sound: ${post.soundTitle}`);
                        }}
                        className="p-2 px-3 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-200/80 flex items-center justify-between gap-2 cursor-pointer hover:border-pink-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Disc className={`w-4 h-4 text-pink-600 shrink-0 ${playingPostSoundId === post.id ? 'animate-spin' : ''}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{post.soundTitle}</p>
                            <p className="text-[10px] text-slate-500 truncate">{post.soundArtist || 'TikTok Trending Sound'}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-pink-600 bg-white px-2 py-0.5 rounded-lg border border-pink-200 shrink-0 flex items-center gap-1">
                          {playingPostSoundId === post.id ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                          <span>{playingPostSoundId === post.id ? 'Pause' : 'Play Sound'}</span>
                        </span>
                      </div>
                    )}

                    {/* Multiple Tags Row */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {post.tags.map((t, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveTagFilter(t)}
                            className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                          >
                            {t.startsWith('#') ? t : `#${t}`}
                          </button>
                        ))}
                      </div>
                    )}

                  {/* Action Bar (Upvote, Downvote, Comment, Bookmark, Share) */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {/* Upvote Button */}
                      <button
                        type="button"
                        onClick={() => handleMemeVote(post.id, 1)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          post.userVote === 1
                            ? 'bg-orange-50 border-orange-300 text-orange-600 shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                        title="Upvote meme (+2 Karma)"
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${post.userVote === 1 ? 'fill-orange-500' : ''}`} />
                        <span>{post.upvotes}</span>
                      </button>

                      {/* Downvote Button */}
                      <button
                        type="button"
                        onClick={() => handleMemeVote(post.id, -1)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          post.userVote === -1
                            ? 'bg-rose-50 border-rose-300 text-rose-600'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                        title="Downvote meme"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Comment Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleMemeComments(post.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          isCommentsOpen
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                        title="Open comments"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.comments}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Save / Favorite Button */}
                      <button
                        type="button"
                        onClick={() => handleMemeSave(post.id)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          post.isSaved
                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                        }`}
                        title={post.isSaved ? 'Saved to Favorites' : 'Save meme'}
                      >
                        <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-amber-500' : ''}`} />
                      </button>

                      {/* Share Button (Opens Universal Share Modal!) */}
                      <button
                        type="button"
                        onClick={() => handleShareMeme(post)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors"
                        title="Share meme across WhatsApp, DMs, Twitter"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Meme Comments Section */}
                  {isCommentsOpen && (
                    <div className="pt-2 border-t border-slate-100 space-y-2.5 animate-in fade-in">
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                        {(post.commentsList || []).map((comm) => (
                          <div key={comm.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2 text-xs">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">@{comm.author}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({comm.studentId})</span>
                                <span className="text-[10px] text-slate-400">· {comm.time}</span>
                              </div>
                              <p className="text-slate-700 leading-relaxed">{comm.text}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleLikeMemeComment(post.id, comm.id)}
                                className={`p-1 flex flex-col items-center gap-0.5 cursor-pointer shrink-0 transition-colors ${
                                  comm.userLiked ? 'text-rose-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title="Like comment"
                              >
                                <Heart className={`w-3 h-3 ${comm.userLiked ? 'fill-rose-600' : ''}`} />
                                <span className="text-[9px]">{comm.likes}</span>
                              </button>

                              {currentUser.is_admin && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAdminUserControl(comm.author)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors"
                                  title={`Admin controls for @${comm.author}`}
                                >
                                  <Shield className="w-3 h-3 text-indigo-600" />
                                </button>
                              )}

                              {(comm.author === currentUser.username || currentUser.is_admin) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerDeleteConfirm({
                                      title: 'Delete Comment?',
                                      message: 'Are you sure you want to remove this comment?',
                                      itemPreview: comm.text,
                                      confirmText: 'Delete',
                                      onConfirm: () => {
                                        setMemePosts((prev) =>
                                          prev.map((m) =>
                                            m.id === post.id
                                              ? {
                                                  ...m,
                                                  commentsList: (m.commentsList || []).filter((c) => c.id !== comm.id),
                                                  comments: Math.max(0, m.comments - 1),
                                                }
                                              : m
                                          )
                                        );
                                        triggerToast('Comment removed.');
                                      },
                                    });
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add comment input or locked announcement */}
                      {isCommentsLocked ? (
                        <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500 font-semibold flex items-center justify-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Comments have been locked on this post by campus administration.</span>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const currentAcc = studentAccounts.find(s => s.username.toLowerCase() === currentUser.username.toLowerCase());
                            if (currentAcc?.is_muted) {
                              triggerToast('⚠️ Your account is currently muted by campus administration.');
                              return;
                            }
                            handleAddMemeComment(post.id);
                          }}
                          className="flex items-center gap-2 pt-1"
                        >
                          <input
                            type="text"
                            value={memeCommentInputs[post.id] || ''}
                            onChange={(e) => setMemeCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder={`Comment as @${currentUser.username}...`}
                            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <button
                            type="submit"
                            disabled={!(memeCommentInputs[post.id] || '').trim()}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Mobile Floating Action Button (FAB) for Post Meme */}
            <div className="fixed bottom-20 right-4 z-30 md:hidden">
              <button
                type="button"
                onClick={() => setShowMemeModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold text-xs shadow-xl shadow-orange-500/40 border border-amber-300/40 backdrop-blur-md cursor-pointer active:scale-95 transition-transform hover:scale-105"
                title="Post Campus Meme"
              >
                <Flame className="w-4 h-4 fill-amber-200 text-amber-200" />
                <span>Post Meme</span>
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB: AUX BATTLE (87.7 FM) (AUDIO PREVIEWS, VOTES & SHARING)         */}
        {/* =================================================================== */}
        {activeTab === 'aux' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white p-4 rounded-2xl shadow-xs space-y-2 flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-white animate-pulse" />
                  <h3 className="font-extrabold text-sm tracking-tight">KTU Radio 87.7 FM · Daily Aux Battle</h3>
                </div>
                <p className="text-xs text-amber-100 mt-0.5">
                  Theme: "Songs that get you through late-night lab sessions in FOE & FAST"
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuxModal(true)}
                className="px-3 py-1.5 bg-white text-slate-900 hover:bg-amber-50 text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Track</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {auxTracks.map((track) => {
                const isPlayingThis = playingAuxTrackId === track.id;
                const isVoted = track.userVote === 1;

                return (
                  <div key={track.id} className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2 shadow-xs transition-all hover:border-slate-300">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {/* Play / Preview Live Track Button */}
                      <button
                        type="button"
                        onClick={() => handlePlayAuxTrack(track.id)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                          isPlayingThis
                            ? 'bg-amber-500 text-white shadow-md animate-pulse'
                            : 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-700'
                        }`}
                        title={isPlayingThis ? 'Pause radio preview' : 'Play 87.7 FM preview'}
                      >
                        {isPlayingThis ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                      </button>

                      <span className={`text-sm sm:text-base font-extrabold font-mono w-5 sm:w-6 text-center shrink-0 ${
                        track.currentRank === 1 ? 'text-amber-500' : track.currentRank === 2 ? 'text-slate-400' : 'text-amber-700'
                      }`}>
                        #{track.currentRank}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{track.title}</h4>
                          {isPlayingThis && (
                            <span className="flex items-end gap-0.5 h-3 px-1 py-0.5 rounded bg-emerald-100 border border-emerald-300 shrink-0">
                              <span className="w-1 h-2 bg-emerald-600 rounded-full animate-bounce"></span>
                              <span className="w-1 h-3 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-1 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          {track.artist} · <span className="font-semibold text-slate-700">@{track.submittedBy}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Upvote Button */}
                      <button
                        type="button"
                        onClick={() => handleAuxVote(track.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer border transition-all flex items-center gap-1 ${
                          isVoted
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
                        }`}
                        title="Vote for this song on 87.7 FM"
                      >
                        <span>▲</span>
                        <span>{track.upvotes}</span>
                      </button>

                      {/* Share Button (Opens Universal Share Modal!) */}
                      <button
                        type="button"
                        onClick={() => handleShareAuxTrack(track)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-indigo-600 cursor-pointer transition-colors"
                        title="Share track to get votes"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB: KTU HUB (PEER ROULETTE, COURSE RATINGS & SKILL BARTER)         */}
        {/* =================================================================== */}
        {activeTab === 'hub' && (
          <div className="space-y-4">
            {/* KTU Institutional Hub Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <KTULogo size={46} alt="KTU Official Crest" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      Koforidua Technical University Hub
                    </h2>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200 font-mono">
                      Official 2026 Portal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Innovating For Development · Live Student Polls & University Surveys
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                  87.7 FM Radio & Polls
                </span>
              </div>
            </div>

            {/* Sub-view: Campus Polls (Live Interactive Animated Percentage Growth) */}
            <CampusPollWidget
                currentUsername={currentUser.username}
                isAdmin={currentUser.is_admin}
                onRequestDeletePoll={(poll) => {
                  triggerDeleteConfirm({
                    title: 'Delete Campus Poll?',
                    message: `Are you sure you want to permanently delete this poll ("${poll.question}")? All recorded student votes will be permanently removed.`,
                    itemPreview: poll.question,
                    confirmText: 'Delete Poll',
                    onConfirm: () => {
                      try {
                        const stored = JSON.parse(localStorage.getItem('ktu_campus_polls') || '[]');
                        const filtered = stored.filter((p: any) => p.id !== poll.id);
                        localStorage.setItem('ktu_campus_polls', JSON.stringify(filtered));
                      } catch (e) {}
                      triggerToast('Campus poll deleted.');
                    },
                  });
                }}
                onSharePoll={(poll) => {
                  openShareModal({
                    type: 'course',
                    id: poll.id,
                    title: poll.question,
                    subtitle: `${poll.options.reduce((a, b) => a + b.votes, 0)} student votes · ${poll.category}`,
                    author: poll.author,
                    url: window.location.href,
                    badge: poll.category,
                  });
                }}
                triggerToast={triggerToast}
              />
          </div>
        )}
      </main>

      {/* ===================================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden flex items-center justify-around px-1 h-14 pb-[env(safe-area-inset-bottom,2px)] shadow-lg select-none">
        {[
          { id: 'vlogs', label: 'Feed', icon: Video },
          { id: 'chat', label: 'Chat', icon: MessageSquare },
          { id: 'memes', label: 'Explore', icon: Flame },
          { id: 'hub', label: 'Hub', icon: BookOpen },
          { id: 'menu', label: 'Menu', icon: Menu, isMenuToggle: true },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = item.isMenuToggle ? isMenuDrawerOpen : (!isMenuDrawerOpen && activeTab === item.id);
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isMenuToggle) {
                  setIsMenuDrawerOpen(!isMenuDrawerOpen);
                } else {
                  setIsMenuDrawerOpen(false);
                  setActiveTab(item.id as any);
                }
              }}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all relative ${
                isActive ? 'text-[#002147] font-black' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5] text-[#002147]' : 'stroke-[1.8]'}`} />
                {item.id === 'menu' && currentUser.is_admin && pendingReportsCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[8px] font-bold flex items-center justify-center font-mono">
                    !
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight leading-none truncate font-bold">{item.label}</span>
              {isActive && (
                <span className="w-3.5 h-0.5 bg-[#002147] rounded-full mt-0.5"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ===================================================================== */}
      {/* MODAL: UNIVERSAL SAFETY REPORT MODAL (PROMPT 4.1)                      */}
      {/* ===================================================================== */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <KTULogo size={28} />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">KTU Safety & Conduct Report</h3>
                  <p className="text-[10px] text-slate-500">Office of the Dean of Student Affairs</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSafetyReportSubmit} className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800 uppercase">{reportTargetType}</span>: {reportTargetPreview}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Violation Reason:
                </label>
                <div className="space-y-1">
                  {[
                    { id: 'harassment', title: 'Harassment or Bullying', desc: 'Targeted insults or intimidation' },
                    { id: 'hate_speech', title: 'Hate Speech or Slurs', desc: 'Attacks on identity or community' },
                    { id: 'explicit_media', title: 'Explicit or NSFW Media', desc: 'Inappropriate or non-consensual media' },
                    { id: 'illegal_content', title: 'Academic Misconduct / Leaks', desc: 'Exam leaks, cheating, or fraud' },
                    { id: 'spam', title: 'Spam or Promotion', desc: 'Commercial ads or repetitive bots' },
                    { id: 'impersonation', title: 'Impersonation', desc: 'Pretending to be student or faculty' },
                  ].map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                        reportReason === r.id
                          ? 'border-indigo-600 bg-indigo-50/60'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        checked={reportReason === r.id}
                        onChange={() => setReportReason(r.id as any)}
                        className="mt-0.5 accent-indigo-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">{r.title}</div>
                        <div className="text-[10px] text-slate-500">{r.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                  Additional Details <span className="font-normal text-slate-400">(Optional)</span>:
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Explain why this violates KTU campus rules..."
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADMIN SUSPENSION PROMPT                                        */}
      {/* ===================================================================== */}
      {showSuspendModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3"
          onClick={() => setShowSuspendModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Suspend Student Account</h3>
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration:</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { days: 3, label: '3 Days' },
                    { days: 7, label: '7 Days' },
                    { days: 14, label: '14 Days' },
                    { days: 30, label: '30 Days' },
                  ].map((d) => (
                    <button
                      key={d.days}
                      onClick={() => setSuspendDurationDays(d.days)}
                      className={`p-2 rounded-lg border font-semibold cursor-pointer ${
                        suspendDurationDays === d.days
                          ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-0.5">Enforcement Memo:</label>
                <input
                  type="text"
                  value={suspendReasonNote}
                  onChange={(e) => setSuspendReasonNote(e.target.value)}
                  placeholder="e.g. Defamation in course reviews"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (suspendTargetReportId) {
                      handleExecuteModAction(
                        suspendTargetReportId,
                        'suspend_user',
                        suspendDurationDays,
                        suspendReasonNote
                      );
                    } else if (suspendTargetUserId) {
                      handleDirectUserSanction(
                        suspendTargetUserId,
                        'suspend',
                        suspendDurationDays
                      );
                    }
                    setShowSuspendModal(false);
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm Suspension
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: UPLOAD CAMPUS STORY / VIDEO                                    */}
      {/* ===================================================================== */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FE2C55] text-white flex items-center justify-center shadow-xs">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Upload Video or Story</h3>
                  <p className="text-[11px] text-slate-500">Share your KTU story to the campus feed</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-lg cursor-pointer transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadVlogSubmit} className="space-y-4">
              {/* Hidden Local File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleLocalFileChange}
                className="hidden"
              />

              {/* 1. Story Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Story Title:
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter story title (e.g. Electrical Engineering Practical)"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-all font-medium text-slate-900"
                />
              </div>

              {/* 2. Caption */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Caption:
                </label>
                <textarea
                  required
                  rows={3}
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Describe your story or what's happening on campus..."
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-all font-medium text-slate-900 resize-none"
                />
              </div>

              {/* 3. Hashtags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hashtags:
                </label>
                <input
                  type="text"
                  value={uploadHashtags}
                  onChange={(e) => setUploadHashtags(e.target.value)}
                  placeholder="#ktu #campuslife #engineering #koforidua"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-all font-medium text-indigo-600 placeholder-slate-400"
                />
              </div>

              {/* 4. Button that takes user to their local file to upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Local Video File:
                </label>
                {localVideoFile ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Film className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-emerald-950 block truncate">{localVideoFile.name}</span>
                        <span className="text-[10px] text-emerald-700 font-mono block">
                          {(localVideoFile.size / (1024 * 1024)).toFixed(1)} MB · Ready to upload
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-100 rounded-xl cursor-pointer shrink-0 transition-colors"
                    >
                      Change Video
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-5 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-2xl bg-indigo-50/50 hover:bg-indigo-50/80 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-indigo-950 block">Choose Video File from Device</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Click to browse your local video files (MP4, MOV, WebM)</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Publish Story</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: UNIVERSAL REAL-WORLD SHARE MODAL (TIKTOK / SOCIAL STANDARD)    */}
      {/* ===================================================================== */}
      {showShareModal && sharePayload && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-600 text-white flex items-center justify-center shadow-xs">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Share to Campus & Beyond</h3>
                  <p className="text-[11px] text-slate-500">Send to peers or share across external social platforms</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Content Preview Card */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {sharePayload.type.toUpperCase()}
                </span>
                {sharePayload.badge && (
                  <span className="text-[10px] font-medium text-slate-500 truncate max-w-[180px]">
                    {sharePayload.badge}
                  </span>
                )}
              </div>
              <div className="flex items-start gap-2.5">
                {sharePayload.avatar ? (
                  <img
                    src={sharePayload.avatar}
                    alt={sharePayload.author}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    {sharePayload.author ? sharePayload.author[0].toUpperCase() : 'K'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{sharePayload.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">{sharePayload.subtitle}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">By @{sharePayload.author}</p>
                </div>
              </div>
            </div>

            {/* SECTION 1: QUICK SEND DIRECT MESSAGE (IN-APP) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Quick Send to KTU Peers (Direct Message):</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {[
                  { name: 'Akosua', handle: 'akosua_fast', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' },
                  { name: 'Yaa', handle: 'yaa_procure', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80' },
                  { name: 'Kojo', handle: 'kojo_antwi', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
                  { name: 'Emmanuel', handle: 'emmanuel_elec', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' },
                  { name: 'Ama', handle: 'ama_fast', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80' },
                  { name: 'Derrick', handle: 'derrick_civil', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80' },
                ].map((peer) => {
                  const isSent = !!sentDmMap[peer.handle];
                  return (
                    <div
                      key={peer.handle}
                      className="flex flex-col items-center gap-1 min-w-[70px] p-2 rounded-2xl hover:bg-slate-50 border border-slate-100 text-center shrink-0 transition-colors"
                    >
                      <img
                        src={peer.avatar}
                        alt={peer.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                      />
                      <span className="text-[10px] font-bold text-slate-800 truncate w-14">{peer.name}</span>
                      <button
                        type="button"
                        onClick={() => handleSendShareViaDm(peer.handle)}
                        className={`w-full py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                          isSent
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                        }`}
                      >
                        {isSent ? 'Sent ✓' : 'Send'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: REAL-WORLD EXTERNAL WEB SHARING (WHATSAPP, X, TELEGRAM, ETC.) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Share to Social Media & Apps:</span>
              <div className="grid grid-cols-3 gap-2">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `*${sharePayload.title}*\n${sharePayload.subtitle}\nShared from KTU Campus Social:\n${sharePayload.url}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex flex-col items-center justify-center gap-1 text-[#128C7E] transition-all cursor-pointer group"
                >
                  <MessageCircle className="w-5 h-5 text-[#25D366] group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-[#128C7E]">WhatsApp</span>
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Check out "${sharePayload.title}" on KTU Campus Social:`
                  )}&url=${encodeURIComponent(sharePayload.url)}&hashtags=KTU,CampusLife`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-black/5 hover:bg-black/10 border border-black/15 flex flex-col items-center justify-center gap-1 text-slate-900 transition-all cursor-pointer group"
                >
                  <span className="text-base font-extrabold font-sans group-hover:scale-110 transition-transform leading-none">𝕏</span>
                  <span className="text-[11px] font-bold text-slate-900">Twitter / 𝕏</span>
                </a>

                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(sharePayload.url)}&text=${encodeURIComponent(
                    `${sharePayload.title} - ${sharePayload.subtitle}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/30 flex flex-col items-center justify-center gap-1 text-[#229ED9] transition-all cursor-pointer group"
                >
                  <Send className="w-5 h-5 text-[#229ED9] group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-[#229ED9]">Telegram</span>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharePayload.url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 flex flex-col items-center justify-center gap-1 text-[#1877F2] transition-all cursor-pointer group"
                >
                  <Share2 className="w-5 h-5 text-[#1877F2] group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-[#1877F2]">Facebook</span>
                </a>

                {/* Student Email / Mailto */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(`KTU Social: ${sharePayload.title}`)}&body=${encodeURIComponent(
                    `Hey!\n\nCheck out this post on KTU Social:\n"${sharePayload.title}"\n${sharePayload.subtitle}\n\nView here: ${sharePayload.url}`
                  )}`}
                  className="p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex flex-col items-center justify-center gap-1 text-indigo-700 transition-all cursor-pointer group"
                >
                  <Mail className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-indigo-700">Email</span>
                </a>

                {/* SMS / Mobile */}
                <a
                  href={`sms:?body=${encodeURIComponent(`${sharePayload.title}: ${sharePayload.url}`)}`}
                  className="p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex flex-col items-center justify-center gap-1 text-emerald-700 transition-all cursor-pointer group"
                >
                  <Smartphone className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-emerald-700">SMS</span>
                </a>
              </div>
            </div>

            {/* SECTION 3: IN-APP ACTIONS (REPOST, NATIVE SHARE, QR CODE, COPY LINK) */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block">Actions & Utilities:</span>
              <div className="grid grid-cols-2 gap-2">
                {/* Repost to Feed Button */}
                <button
                  type="button"
                  onClick={handleQuickRepost}
                  className="p-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:from-orange-600 hover:to-rose-700 cursor-pointer transition-all"
                >
                  <Repeat className="w-4 h-4" />
                  <span>Repost to Feed (+5)</span>
                </button>

                {/* Device Native Share API */}
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Device Share</span>
                </button>

                {/* QR Code In-Person Scan Toggle */}
                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className={`p-2.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    showQrCode
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>{showQrCode ? 'Hide QR Code' : 'Scan QR Code'}</span>
                </button>

                {/* Copy Direct Link */}
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className={`p-2.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    shareCopied
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  }`}
                >
                  {shareCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{shareCopied ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              {/* QR Code Display Card */}
              {showQrCode && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col items-center justify-center gap-2 text-center animate-in zoom-in-95">
                  <div className="p-3 bg-white rounded-xl shadow-xs border border-purple-200">
                    <svg viewBox="0 0 100 100" className="w-28 h-28 text-slate-900 fill-current">
                      <rect width="28" height="28" x="6" y="6" rx="4" />
                      <rect width="16" height="16" x="12" y="12" fill="#fff" rx="2" />
                      <rect width="8" height="8" x="16" y="16" />
                      
                      <rect width="28" height="28" x="66" y="6" rx="4" />
                      <rect width="16" height="16" x="72" y="12" fill="#fff" rx="2" />
                      <rect width="8" height="8" x="76" y="16" />

                      <rect width="28" height="28" x="6" y="66" rx="4" />
                      <rect width="16" height="16" x="12" y="72" fill="#fff" rx="2" />
                      <rect width="8" height="8" x="16" y="76" />

                      <rect width="8" height="8" x="42" y="10" />
                      <rect width="8" height="8" x="50" y="24" />
                      <rect width="8" height="8" x="40" y="44" />
                      <rect width="8" height="8" x="52" y="52" />
                      <rect width="8" height="8" x="64" y="44" />
                      <rect width="8" height="8" x="76" y="56" />
                      <rect width="8" height="8" x="44" y="72" />
                      <rect width="8" height="8" x="64" y="76" />
                      <rect width="8" height="8" x="80" y="80" />
                    </svg>
                  </div>
                  <p className="text-[11px] font-bold text-purple-900">
                    Show this QR code to a friend nearby to scan & open instantly
                  </p>
                  <p className="text-[10px] text-purple-700 font-mono">
                    {sharePayload.url}
                  </p>
                </div>
              )}

              {/* Formatted Quote Copy */}
              <button
                type="button"
                onClick={handleCopyShareQuote}
                className="w-full py-2 text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Copy formatted quote & citation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: TIKTOK SOUND DRAWER & MUSIC DETAILS                            */}
      {/* ===================================================================== */}
      {showSoundDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setShowSoundDrawer(false)}
        >
          <div
            className="bg-slate-950 text-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[#25F4EE]" />
                <h3 className="text-sm font-bold text-white">Campus Soundtrack Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSoundDrawer(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Vinyl Record Centerpiece */}
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div
                className={`relative w-28 h-28 rounded-full bg-slate-900 border-4 border-slate-800 shadow-2xl flex items-center justify-center ${
                  isPlayingSoundPreview ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '3s' }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FE2C55] to-indigo-600 border-2 border-white/40 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h4 className="font-extrabold text-sm text-white px-2">
                  {activeSoundTrack || 'Original Sound - KTU Campus'}
                </h4>
                <p className="text-[11px] text-[#25F4EE] font-mono">
                  Used in 18 student campus stories
                </p>
              </div>

              {/* Play / Pause Preview Button */}
              <button
                type="button"
                onClick={() => {
                  setIsPlayingSoundPreview(!isPlayingSoundPreview);
                  triggerToast(
                    !isPlayingSoundPreview
                      ? `Playing live preview of ${activeSoundTrack || 'Soundtrack'}`
                      : 'Preview stopped'
                  );
                }}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-colors"
              >
                {isPlayingSoundPreview ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>{isPlayingSoundPreview ? 'Pause Audio Preview' : 'Play Sound Preview'}</span>
              </button>

              {isPlayingSoundPreview && (
                <div className="flex items-end gap-1 h-4">
                  <span className="w-1 h-3 bg-[#FE2C55] rounded-full animate-bounce"></span>
                  <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-2 bg-[#25F4EE] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowSoundDrawer(false);
                  setShowUploadModal(true);
                  triggerToast(`Using sound: "${activeSoundTrack || 'Original Sound'}"! Select your video to upload.`);
                }}
                className="w-full py-2.5 bg-[#FE2C55] hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Use This Sound in My Story</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSoundDrawer(false);
                  openShareModal({
                    type: 'vlog',
                    id: 'soundtrack',
                    title: activeSoundTrack || 'KTU Sound Track',
                    subtitle: 'Trending campus audio track on KTU Social',
                    author: 'KTU 87.7 FM',
                    badge: 'Trending Audio',
                    url: `${window.location.origin}/#sound-${encodeURIComponent(activeSoundTrack || 'sound')}`,
                  });
                }}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Soundtrack</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: POST BRAINROT CAMPUS MEME                                      */}
      {/* ===================================================================== */}
      {showMemeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setShowMemeModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Post Campus Meme / Banter</h3>
                  <p className="text-[11px] text-slate-500">Share campus jokes, lecture humor, and hostel struggles</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMemeModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddMemePost} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meme Caption / Joke:
                </label>
                <textarea
                  required
                  rows={3}
                  value={memeFormCaption}
                  onChange={(e) => setMemeFormCaption(e.target.value)}
                  placeholder="e.g. When the lecturer says 'Just 5 more minutes' and it's already 30 minutes past class time... #ktu #engineering"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faculty / Community Tag:
                </label>
                <select
                  value={memeFormTag}
                  onChange={(e) => setMemeFormTag(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                >
                  <option value="#ktu">#ktu · General Campus</option>
                  <option value="#engineering">#engineering · FOE Workshops</option>
                  <option value="#compsci">#compsci · FAST Labs & Coding</option>
                  <option value="#procurement">#procurement · FBMS Business</option>
                  <option value="#hostellife">#hostellife · Campus Canteens</option>
                  <option value="#exams">#exams · Mid-Sem Grind</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMemeModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Publish Meme (+5 Karma)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: SUBMIT TRACK TO AUX BATTLE (87.7 FM)                           */}
      {/* ===================================================================== */}
      {showAuxModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setShowAuxModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Submit Track to 87.7 FM</h3>
                  <p className="text-[11px] text-slate-500">Battle for the #1 campus airplay spot this week</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuxModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddAuxTrackSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Song Title:
                </label>
                <input
                  type="text"
                  required
                  value={auxFormTitle}
                  onChange={(e) => setAuxFormTitle(e.target.value)}
                  placeholder="e.g. Makoma, Kweku Playman, Kwaku the Traveller"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Artist Name:
                </label>
                <input
                  type="text"
                  required
                  value={auxFormArtist}
                  onChange={(e) => setAuxFormArtist(e.target.value)}
                  placeholder="e.g. King Paluta, Kweku Smoke, Black Sherif"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAuxModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Submit to 87.7 FM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: WRITE COURSE & LECTURER REVIEW                                 */}
      {/* ===================================================================== */}
      {showCourseReviewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setShowCourseReviewModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Star className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Review KTU Course & Lecturer</h3>
                  <p className="text-[11px] text-slate-500">Share genuine exam advice and practical syllabus tips</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCourseReviewModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddCourseReview} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Course:
                </label>
                <select
                  value={reviewCourseCode}
                  onChange={(e) => setReviewCourseCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                >
                  {courseList.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.title} ({c.lecturer})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Rating:
                </label>
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRatingStars(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRatingStars
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-900 ml-2 font-mono">
                    {reviewRatingStars} / 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Review & Exam Tips:
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewCommentText}
                  onChange={(e) => setReviewCommentText(e.target.value)}
                  placeholder="Describe lecturer teaching style, practicals vs theory, and how to pass the mid-sem and end-of-sem exam..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCourseReviewModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span>Submit Review (+5 Karma)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: POST SKILL BARTER & PEER TUTORING                              */}
      {/* ===================================================================== */}
      {showSkillSwapModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setShowSkillSwapModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Post Skill Barter Listing</h3>
                  <p className="text-[11px] text-slate-500">Trade academic tutoring and technical skills for free</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSkillSwapModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSkillSwap} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  What skill or course tutoring can you OFFER?
                </label>
                <input
                  type="text"
                  required
                  value={swapOfferingInput}
                  onChange={(e) => setSwapOfferingInput(e.target.value)}
                  placeholder="e.g. AutoCAD 3D Modeling, Python Programming, Fluid Mechanics"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  What skill or course tutoring are you SEEKING in return?
                </label>
                <input
                  type="text"
                  required
                  value={swapSeekingInput}
                  onChange={(e) => setSwapSeekingInput(e.target.value)}
                  placeholder="e.g. Differential Equations, Electrical Circuits, Financial Accounting"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brief Note / Study Times:
                </label>
                <textarea
                  rows={2}
                  value={swapDescriptionInput}
                  onChange={(e) => setSwapDescriptionInput(e.target.value)}
                  placeholder="e.g. Available weekday evenings in the FAST Lab or Library 2nd floor."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSkillSwapModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Post Listing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super-Admin User Management & Social Moderation Modal */}
      <AdminUserControlModal
        isOpen={isUserControlModalOpen}
        onClose={() => setIsUserControlModalOpen(false)}
        user={selectedUserForAdminControl}
        adminUsername={currentUser.username}
        onUpdateUser={handleUpdateUserFromControlModal}
        onNukeUserContent={handleNukeUserContent}
        onIssueFormalWarning={handleIssueFormalWarning}
        triggerToast={triggerToast}
      />

      {/* Universal Reusable Delete Confirmation Modal */}
      <DeleteConfirmModal
        {...deleteModal}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
