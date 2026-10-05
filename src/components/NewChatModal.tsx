import React, { useState } from 'react';
import {
  Search,
  MessageSquare,
  UserPlus,
  X,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import KTULogo from './KTULogo';

export interface CampusPeer {
  username: string;
  name: string;
  studentId: string;
  faculty: string;
  department: string;
  avatar: string;
  isOnline: boolean;
  statusText: string;
}

export const CAMPUS_STUDENTS: CampusPeer[] = [
  {
    username: 'adwoa_procure',
    name: 'Adwoa Mensah',
    studentId: 'KTU/FBMS/PSC/22/114',
    faculty: 'FBMS',
    department: 'Procurement & Supply',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    isOnline: true,
    statusText: 'At CCB Library studying for mid-sems 📚',
  },
  {
    username: 'kofi_cs',
    name: 'Kofi Owusu',
    studentId: 'KTU/FAST/CS/23/089',
    faculty: 'FAST',
    department: 'Computer Science',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    isOnline: true,
    statusText: 'In Lab 3 debugging algorithms 💻',
  },
  {
    username: 'selorm_fast',
    name: 'Selorm Agbavor',
    studentId: 'KTU/FAST/CS/22/045',
    faculty: 'FAST',
    department: 'Software Engineering',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    isOnline: true,
    statusText: 'KTU 87.7 FM Radio tech rep 🎙️',
  },
  {
    username: 'abena_design',
    name: 'Abena Frimpong',
    studentId: 'KTU/FAD/GD/24/012',
    faculty: 'FAD',
    department: 'Graphic & Media Design',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    isOnline: false,
    statusText: 'Design studio printing exhibition posters 🎨',
  },
  {
    username: 'kofi_foe',
    name: 'Kofi Annan',
    studentId: 'KTU/FOE/EE/23/041',
    faculty: 'FOE',
    department: 'Electrical Engineering',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    isOnline: true,
    statusText: 'Workshop practicals ongoing ⚡',
  },
  {
    username: 'serwaa_stats',
    name: 'Serwaa Boateng',
    studentId: 'KTU/FAST/ST/23/044',
    faculty: 'FAST',
    department: 'Applied Statistics',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    isOnline: true,
    statusText: 'Looking for peer study buddy for stats 📊',
  },
  {
    username: 'yaw_telecom',
    name: 'Yaw Darko',
    studentId: 'KTU/FOE/TEL/24/008',
    faculty: 'FOE',
    department: 'Telecommunication Engineering',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
    isOnline: false,
    statusText: 'Antenna lab sessions',
  },
  {
    username: 'src_president',
    name: 'KTU SRC Secretariat',
    studentId: 'KTU/EXEC/SRC/2026',
    faculty: 'SRC',
    department: 'Students Representative Council',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    isOnline: true,
    statusText: 'Official Student Welfare & Enquiries 🏛️',
  },
];

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (peer: CampusPeer) => void;
  currentUsername: string;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onStartChat,
  currentUsername,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customUsername, setCustomUsername] = useState('');

  if (!isOpen) return null;

  const filteredStudents = CAMPUS_STUDENTS.filter((student) => {
    if (student.username === currentUsername) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      student.name.toLowerCase().includes(q) ||
      student.username.toLowerCase().includes(q) ||
      student.studentId.toLowerCase().includes(q) ||
      student.faculty.toLowerCase().includes(q) ||
      student.department.toLowerCase().includes(q)
    );
  });

  const handleStartCustomChat = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customUsername.replace(/^@/, '').trim();
    if (!clean) return;

    const existing = CAMPUS_STUDENTS.find((s) => s.username.toLowerCase() === clean.toLowerCase());
    if (existing) {
      onStartChat(existing);
      onClose();
      return;
    }

    const newPeer: CampusPeer = {
      username: clean,
      name: `@${clean}`,
      studentId: `KTU/VERIFIED/${clean.toUpperCase().slice(0, 4)}`,
      faculty: 'Campus Peer',
      department: 'Verified Student',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      isOnline: true,
      statusText: 'Verified KTU Peer',
    };

    onStartChat(newPeer);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <KTULogo size={40} />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">New Peer Conversation</h3>
              <p className="text-[11px] text-slate-500">Connect directly with verified KTU students</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3.5 border-b border-slate-100 space-y-2 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, @username, ID, or faculty..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Students List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-slate-50/50">
          <div className="px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Verified KTU Peers</span>
            <span>{filteredStudents.length} Found</span>
          </div>

          {filteredStudents.map((student) => (
            <div
              key={student.username}
              onClick={() => {
                onStartChat(student);
                onClose();
              }}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  {student.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {student.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">@{student.username}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                    <span className="font-semibold text-slate-700">{student.faculty}</span>
                    <span>·</span>
                    <span className="truncate">{student.department}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate italic mt-0.5">{student.statusText}</p>
                </div>
              </div>

              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
              >
                <span>Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Quick Username Input if peer is not listed */}
          <form
            onSubmit={handleStartCustomChat}
            className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2 mt-3"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Can't find your classmate?</span>
            </div>
            <p className="text-[11px] text-slate-600">Enter their KTU username or ID to initiate a chat session:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                placeholder="e.g. kofi_eng or 04/2023/..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!customUsername.trim()}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Start
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Verified student peers only
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
