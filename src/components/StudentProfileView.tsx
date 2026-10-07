import React, { useState } from 'react';
import {
  GraduationCap,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Video,
  Heart,
  MessageSquare,
  Share2,
  Lock,
  Eye,
  Disc,
  Play,
  Pause,
  ThumbsUp,
  UserCheck,
  UserPlus,
  ArrowLeft,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sparkles,
  Settings
} from 'lucide-react';
import KTULogo from './KTULogo';

export interface UserProfileData {
  username: string;
  name: string;
  student_id: string;
  email: string;
  phone?: string;
  faculty: string;
  department: string;
  level?: string;
  hostel?: string;
  avatar_url?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  likes_total: number;
  is_verified?: boolean;
}

export interface PostItem {
  id: number;
  author: string;
  studentId?: string;
  badge: string;
  caption: string;
  imageUrl?: string;
  imagePlaceholderBg?: string;
  upvotes: number;
  downvotes?: number;
  userVote?: number;
  comments: number;
  time: string;
  tags?: string[];
  soundTitle?: string;
  soundArtist?: string;
  type?: 'meme' | 'feed';
}

export interface VlogItem {
  id: number;
  author: string;
  caption: string;
  thumbnail?: string;
  videoPlaceholderBg?: string;
  views: number;
  upvotes: number;
  duration: number;
  created_at?: string;
}

interface StudentProfileViewProps {
  profileUser: UserProfileData;
  currentUser: {
    username: string;
    is_admin: boolean;
    role?: string;
  };
  userPosts: PostItem[];
  userVlogs: VlogItem[];
  onBack?: () => void;
  onStartChatWithUser?: (username: string) => void;
  onEditProfileClick?: () => void;
  onOpenSettings?: () => void;
  onDeletePost?: (postId: number, caption: string) => void;
  triggerToast: (msg: string) => void;
  openShareModal?: (data: any) => void;
  onAdminAction?: (action: 'warn' | 'mute' | 'ban' | 'open_control_modal', username: string) => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  profileUser,
  currentUser,
  userPosts,
  userVlogs,
  onBack,
  onStartChatWithUser,
  onEditProfileClick,
  onOpenSettings,
  onDeletePost,
  triggerToast,
  openShareModal,
  onAdminAction,
}) => {
  const isOwnProfile = currentUser.username.toLowerCase() === profileUser.username.toLowerCase();
  const isAdmin = !!currentUser.is_admin;
  const canSeePersonalDetails = isOwnProfile || isAdmin;

  const [activeProfileTab, setActiveProfileTab] = useState<'memes' | 'vlogs' | 'liked'>('memes');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(profileUser.followers_count || 142);
  const [playingSoundPostId, setPlayingSoundPostId] = useState<number | null>(null);

  const toggleFollow = () => {
    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount((prev) => Math.max(0, prev - 1));
      triggerToast(`Unfollowed @${profileUser.username}`);
    } else {
      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
      triggerToast(`Following @${profileUser.username}!`);
    }
  };

  const memesAndFeeds = userPosts.filter(
    (p) => p.author.toLowerCase() === profileUser.username.toLowerCase()
  );

  const userStories = userVlogs.filter(
    (v) => v.author.toLowerCase() === profileUser.username.toLowerCase()
  );

  const totalLikesReceived = memesAndFeeds.reduce((acc, p) => acc + (p.upvotes || 0), 0) +
    userStories.reduce((acc, v) => acc + (v.upvotes || 0), 0) +
    (profileUser.likes_total || 280);

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10 animate-in fade-in duration-300">
      {/* Back button bar */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </button>
      )}

      {/* ===================================================================== */}
      {/* TIKTOK STYLE PROFILE HEADER                                           */}
      {/* ===================================================================== */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          {/* Avatar with gradient ring */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-pink-500 to-indigo-600 shadow-md">
              <img
                src={
                  profileUser.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80'
                }
                alt={profileUser.username}
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            {profileUser.is_verified !== false && (
              <span
                className="absolute bottom-1 right-1 p-1 rounded-full bg-indigo-600 text-white shadow-md border-2 border-white"
                title="Verified KTU Student"
              >
                <CheckCircle2 className="w-4 h-4 fill-white text-indigo-600" />
              </span>
            )}
          </div>

          {/* User Details & Counts */}
          <div className="space-y-3 flex-1 min-w-0">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {profileUser.name || `@${profileUser.username}`}
                </h2>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  @{profileUser.username}
                </span>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  {profileUser.faculty}
                </span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                <KTULogo size={18} />
                <p className="text-xs text-slate-600 font-semibold">
                  {profileUser.department} · Koforidua Technical University
                </p>
              </div>
            </div>

            {/* TikTok Stats Row (Following, Followers, Likes) */}
            <div className="flex items-center justify-center sm:justify-start gap-6 pt-1 text-slate-900">
              <div className="text-center sm:text-left">
                <span className="block text-base sm:text-lg font-black">{profileUser.following_count || 56}</span>
                <span className="text-[11px] text-slate-500 font-medium">Following</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block text-base sm:text-lg font-black">{followerCount}</span>
                <span className="text-[11px] text-slate-500 font-medium">Followers</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="block text-base sm:text-lg font-black text-rose-600">
                  {totalLikesReceived >= 1000
                    ? `${(totalLikesReceived / 1000).toFixed(1)}K`
                    : totalLikesReceived}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Likes</span>
              </div>
            </div>

            {/* Bio text */}
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-lg">
              {profileUser.bio ||
                `Official KTU student profile. Studying ${profileUser.department} at KTU Eastern Region campus. Creating memes and campus stories! 🇬🇭✨`}
            </p>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={onEditProfileClick}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    Edit Profile
                  </button>
                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                      title="Account & Privacy Settings"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-600" />
                      <span>⚙️ Settings</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (openShareModal) {
                        openShareModal({
                          type: 'profile',
                          id: 1,
                          title: `@${profileUser.username} on KTU Social`,
                          subtitle: profileUser.department,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard?.writeText(window.location.href);
                        triggerToast('Profile link copied to clipboard!');
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Profile</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={toggleFollow}
                    className={`px-5 py-2 rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 ${
                      isFollowing
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs shadow-rose-600/25'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  {onStartChatWithUser && (
                    <button
                      type="button"
                      onClick={() => onStartChatWithUser(profileUser.username)}
                      className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      triggerToast('Profile link copied!');
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="Share profile"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* PRIVACY SHIELD & SENSITIVE DETAILS CONTROL                          */}
        {/* =================================================================== */}
        {canSeePersonalDetails ? (
          /* Visible ONLY to Profile Owner OR System Admin */
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <KTULogo size={18} />
                <span>
                  {isAdmin && !isOwnProfile ? 'Academic Record (Admin Access)' : 'My Verified Student Record'}
                </span>
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Private & Encrypted</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90">
                <span className="text-[10px] font-semibold text-slate-400 block">Student Index / ID</span>
                <span className="font-mono font-bold text-slate-900">{profileUser.student_id}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90">
                <span className="text-[10px] font-semibold text-slate-400 block">Official Institutional Email</span>
                <span className="text-slate-800 font-medium truncate block">{profileUser.email}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90">
                <span className="text-[10px] font-semibold text-slate-400 block">Academic Level</span>
                <span className="text-slate-800 font-bold">{profileUser.level || 'Level 300 (Degree)'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90">
                <span className="text-[10px] font-semibold text-slate-400 block">Hostel / Campus Hall</span>
                <span className="text-slate-800 font-medium">{profileUser.hostel || 'Universal Hall (Campus)'}</span>
              </div>
              {profileUser.phone && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90">
                  <span className="text-[10px] font-semibold text-slate-400 block">Phone Number</span>
                  <span className="font-mono text-slate-800">{profileUser.phone}</span>
                </div>
              )}
            </div>

            {/* Admin Moderation Panel (if admin viewing another user) */}
            {isAdmin && !isOwnProfile && onAdminAction && (
              <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-900">Admin Actions for @{profileUser.username}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onAdminAction && onAdminAction('open_control_modal', profileUser.username)}
                    className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Open Admin Control Suite &rarr;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdminAction && onAdminAction('warn', profileUser.username)}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Issue Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdminAction && onAdminAction('mute', profileUser.username)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Mute 24h
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdminAction && onAdminAction('ban', profileUser.username)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Ban Account
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Privacy notice displayed to other students: personal details are hidden */
          <div className="border-t border-slate-100 pt-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center gap-2.5 text-xs text-slate-600">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-[11px] leading-relaxed">
                <strong className="text-slate-800 font-semibold">Student Privacy Shield Active:</strong> Personal details (Student ID, email, phone & hostel address) are private and visible only to @{profileUser.username} and KTU campus administrators.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* TIKTOK STYLE CONTENT TABS: MEMES, VLOGS, LIKED                        */}
      {/* ===================================================================== */}
      <div className="space-y-3">
        {/* Tab Headers */}
        <div className="flex items-center justify-center border-b border-slate-200 bg-white rounded-2xl p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveProfileTab('memes')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeProfileTab === 'memes'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Memes & Feeds ({memesAndFeeds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveProfileTab('vlogs')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeProfileTab === 'vlogs'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Video className="w-4 h-4 text-indigo-500" />
            <span>Stories & Vlogs ({userStories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveProfileTab('liked')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeProfileTab === 'liked'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Liked Content</span>
          </button>
        </div>

        {/* TAB 1: MEMES & FEEDS GRID */}
        {activeProfileTab === 'memes' && (
          <div className="space-y-3">
            {memesAndFeeds.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-2">
                <Flame className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                <h4 className="text-sm font-bold text-slate-800">No memes or feeds posted yet</h4>
                <p className="text-xs text-slate-400">
                  {isOwnProfile
                    ? 'Post your first campus joke, lecture struggle, or outfit check!'
                    : `@${profileUser.username} hasn't posted any memes yet.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {memesAndFeeds.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Badge & Time */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          {post.badge}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">{post.time}</span>
                          {(isOwnProfile || isAdmin) && onDeletePost && (
                            <button
                              type="button"
                              onClick={() => onDeletePost(post.id, post.caption)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                              title="Delete post"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Post Image (only if uploaded/captured) */}
                      {post.imageUrl && (
                        <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 group">
                          <img
                            src={post.imageUrl}
                            alt="Campus meme"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {post.soundTitle && (
                            <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Disc className="w-3 h-3 text-pink-400 animate-spin" />
                              <span className="truncate max-w-[120px]">{post.soundTitle}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Sound chip if no image */}
                      {!post.imageUrl && post.soundTitle && (
                        <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                          <Disc className="w-3 h-3 text-pink-500 animate-spin" />
                          <span className="truncate max-w-[150px]">{post.soundTitle}</span>
                        </div>
                      )}

                      {/* Caption text */}
                      <p className="text-xs text-slate-800 leading-relaxed font-normal">{post.caption}</p>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {post.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded"
                            >
                              {t.startsWith('#') ? t : `#${t}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Stats & Sound */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <ThumbsUp className="w-3.5 h-3.5 text-amber-500" />
                          <span>{post.upvotes}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span>{post.comments}</span>
                        </span>
                      </div>

                      {post.soundTitle && (
                        <button
                          type="button"
                          onClick={() => {
                            setPlayingSoundPostId(playingSoundPostId === post.id ? null : post.id);
                            triggerToast(`Playing "${post.soundTitle}" 🎵`);
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-pink-600 hover:text-pink-700 cursor-pointer bg-pink-50 px-2 py-0.5 rounded-full"
                        >
                          {playingSoundPostId === post.id ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current" />
                          )}
                          <span className="truncate max-w-[100px]">{post.soundTitle}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VLOGS / STORIES */}
        {activeProfileTab === 'vlogs' && (
          <div>
            {userStories.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-2">
                <Video className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                <h4 className="text-sm font-bold text-slate-800">No campus vlogs yet</h4>
                <p className="text-xs text-slate-400">
                  {isOwnProfile
                    ? 'Upload a 30-second story to appear on the KTU stories tray!'
                    : `@${profileUser.username} hasn't uploaded any stories yet.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userStories.map((vlog) => (
                  <div
                    key={vlog.id}
                    className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 group shadow-md cursor-pointer"
                  >
                    {vlog.thumbnail ? (
                      <img
                        src={vlog.thumbnail}
                        alt={vlog.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${vlog.videoPlaceholderBg || 'from-indigo-900 to-slate-900'} flex items-center justify-center p-3 text-center`}>
                        <Video className="w-8 h-8 text-white/50 mb-2" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 p-2.5 flex flex-col justify-between text-white">
                      <div className="flex justify-end">
                        <span className="text-[10px] font-mono bg-black/60 px-1.5 py-0.2 rounded">
                          0:{vlog.duration < 10 ? `0${vlog.duration}` : vlog.duration}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-medium leading-tight line-clamp-2 text-white/90">
                          {vlog.caption}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-white/70">
                          <span className="flex items-center gap-0.5">
                            <Eye className="w-3 h-3" />
                            <span>{vlog.views}</span>
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                            <span>{vlog.upvotes}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIKED CONTENT */}
        {activeProfileTab === 'liked' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-2">
            <Heart className="w-10 h-10 mx-auto text-rose-300 stroke-1" />
            <h4 className="text-sm font-bold text-slate-800">
              {isOwnProfile ? 'Your Liked Posts & Memes' : `@${profileUser.username}'s Liked Content`}
            </h4>
            <p className="text-xs text-slate-400">
              {isOwnProfile
                ? 'All posts and campus stories you tap the heart on will be collected here.'
                : 'Liked videos and memes are private to this student.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfileView;
