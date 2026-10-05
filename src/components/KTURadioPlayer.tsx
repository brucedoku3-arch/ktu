import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RadioTower,
  Sparkles,
  PhoneCall,
  MessageCircle,
  Share2,
  Send,
  Users,
  Music2,
  Clock,
  ExternalLink,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import KTULogo from './KTULogo';

export interface KTURadioPlayerProps {
  currentUsername: string;
  triggerToast: (msg: string) => void;
  openShareModal?: (data: any) => void;
  isFloating?: boolean;
}

const OFFICIAL_STREAM_URL = 'https://radio.ktu.edu.gh/stream';
// Secondary reliable Ghanaian stream / campus stream backup
const BACKUP_STREAM_URL = 'https://stream.zeno.fm/4wy1s0z7snhvv';

export const KTURadioPlayer: React.FC<KTURadioPlayerProps> = ({
  currentUsername,
  triggerToast,
  openShareModal,
  isFloating = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [activeStreamUrl, setActiveStreamUrl] = useState(OFFICIAL_STREAM_URL);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shoutoutText, setShoutoutText] = useState('');
  const [shoutoutList, setShoutoutList] = useState([
    {
      id: 1,
      sender: 'selorm_fast',
      department: 'Computer Science',
      message: 'Big up to all Level 300 FAST students in Lab 3! Play us some Black Sherif! 🔥',
      time: '2m ago',
    },
    {
      id: 2,
      sender: 'adwoa_procure',
      department: 'Procurement',
      message: 'Shoutout to FBMS students preparing for mid-sems at the main library! We go make am! 📚',
      time: '6m ago',
    },
    {
      id: 3,
      sender: 'kofi_foe',
      department: 'Electrical Engineering',
      message: 'Greeting the engineering crew at workshop 2. KTU FM 87.7 holding it down all day! ⚡',
      time: '12m ago',
    },
  ]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'none';
      audio.src = activeStreamUrl;

      audio.onplaying = () => {
        setIsPlaying(true);
        setIsLoading(false);
        setStreamError(false);
      };

      audio.onwaiting = () => {
        setIsLoading(true);
      };

      audio.onerror = () => {
        console.warn('KTU stream initial load error, attempting fallback');
        setIsLoading(false);
        if (activeStreamUrl === OFFICIAL_STREAM_URL) {
          // Switch to secondary stream
          setActiveStreamUrl(BACKUP_STREAM_URL);
          audio.src = BACKUP_STREAM_URL;
          audio.load();
        } else {
          setStreamError(true);
          setIsPlaying(false);
        }
      };

      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      triggerToast('KTU Radio paused');
    } else {
      setIsLoading(true);
      setStreamError(false);
      // Ensure source is fresh for live stream
      audioRef.current.src = activeStreamUrl;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          triggerToast('📻 Connected to KTU Radio 87.7 FM live!');
        })
        .catch((err) => {
          console.warn('Audio playback error:', err);
          setIsLoading(false);
          // Try backup
          if (activeStreamUrl === OFFICIAL_STREAM_URL) {
            setActiveStreamUrl(BACKUP_STREAM_URL);
            if (audioRef.current) {
              audioRef.current.src = BACKUP_STREAM_URL;
              audioRef.current.play().then(() => {
                setIsPlaying(true);
                triggerToast('📻 Connected to KTU Radio 87.7 FM (Live Relay)!');
              }).catch(() => {
                setStreamError(true);
              });
            }
          } else {
            setStreamError(true);
          }
        });
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVol;
    }
    if (isMuted && newVol > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    audioRef.current.volume = newMute ? 0 : volume;
  };

  const handleSendShoutout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoutoutText.trim()) return;

    const newShout = {
      id: Date.now(),
      sender: currentUsername,
      department: 'KTU Verified Student',
      message: shoutoutText.trim(),
      time: 'Just now',
    };

    setShoutoutList([newShout, ...shoutoutList]);
    setShoutoutText('');
    triggerToast('🎉 Shoutout broadcast to the KTU 87.7 FM Studio on-air console!');
  };

  // If rendered as floating player dock (bottom-right / bottom-fixed across all tabs)
  if (isFloating) {
    return (
      <div className="fixed bottom-20 md:bottom-4 right-3 sm:right-4 z-40 max-w-sm w-[calc(100vw-1.5rem)] sm:w-80 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-3 animate-in fade-in slide-in-from-bottom-3 transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <KTULogo size={26} />
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-white tracking-tight truncate">KTU 87.7 FM</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-slate-950 uppercase">LIVE</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">The Star of the East · Koforidua</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              title={isCollapsed ? 'Expand player' : 'Minimize player'}
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="space-y-2 pt-1 border-t border-slate-800">
            {/* Audio Visualizer Waves */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 h-5 px-2 bg-slate-950/60 rounded-lg">
                {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                  <span
                    key={bar}
                    className={`w-1 rounded-full bg-amber-400 transition-all ${
                      isPlaying ? 'animate-bounce' : 'h-1.5 opacity-40'
                    }`}
                    style={{
                      height: isPlaying ? `${Math.max(4, (bar * 3) % 18 + 4)}px` : '4px',
                      animationDuration: `${0.4 + (bar % 4) * 0.15}s`,
                      animationDelay: `${bar * 60}ms`,
                    }}
                  />
                ))}
                <span className="text-[10px] font-mono text-amber-300 ml-1.5 font-bold">87.7 MHz</span>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>

            {/* Play Button & Status */}
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-300 min-w-0 truncate">
                {isLoading ? (
                  <span className="text-amber-300 animate-pulse">Connecting to transmitter...</span>
                ) : streamError ? (
                  <span className="text-rose-400">Stream buffering / offline</span>
                ) : isPlaying ? (
                  <span className="text-emerald-400 font-medium">On Air: Campus Drive Time Show</span>
                ) : (
                  <span>Ready to stream live</span>
                )}
              </div>

              <button
                type="button"
                onClick={togglePlay}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
              >
                {isLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Listen Live</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full view rendered inside the Hub / Radio Tab
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Station Masthead Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-7 shadow-xl border border-slate-800">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 flex items-center gap-1.5 shadow-md shadow-amber-500/20 uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Official Campus Radio</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                87.7 MHz FM
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE ON AIR
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="p-1 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 shadow-lg shrink-0">
                <KTULogo size={58} alt="KTU Radio 87.7 FM Institutional Crest" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>KTU Radio 87.7 FM</span>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                  "The Star of the East" · Transmitting 24/7 from Koforidua Technical University campus across Eastern Region and worldwide.
                </p>
              </div>
            </div>

            {/* Current Program Details */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current Program</span>
                <h4 className="text-xs sm:text-sm font-extrabold text-amber-300">The Campus Drive & Aux Showdown</h4>
                <p className="text-[11px] text-slate-400">Hosted by DJ K-Rock & MC Selorm · Student Requests & Campus News</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>348 Online</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Verified Listeners</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Player Deck */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-5 w-full md:w-80 shrink-0 shadow-2xl flex flex-col items-center text-center space-y-4">
            {/* Frequency Display Circle */}
            <div className="relative flex items-center justify-center">
              <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                isPlaying
                  ? 'border-amber-400 shadow-lg shadow-amber-500/25 bg-amber-950/20'
                  : 'border-slate-700 bg-slate-950/60'
              }`}>
                <RadioTower className={`w-7 h-7 mb-1 ${isPlaying ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
                <span className="text-xl font-black font-mono tracking-tight text-white">87.7</span>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">FM STEREO</span>
              </div>

              {/* Dynamic Oscillating Wave Ring when Playing */}
              {isPlaying && (
                <div className="absolute inset-0 -m-1.5 rounded-full border border-amber-400/40 animate-ping pointer-events-none" />
              )}
            </div>

            {/* Visualizer Frequency Bars */}
            <div className="flex items-end justify-center gap-1 h-8 w-full px-4">
              {[4, 8, 12, 16, 20, 24, 18, 14, 10, 6, 12, 20, 26, 18, 10].map((height, idx) => (
                <span
                  key={idx}
                  className={`w-1 rounded-full transition-all ${
                    isPlaying ? 'bg-gradient-to-t from-amber-500 to-amber-300' : 'bg-slate-700'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(4, (height * (idx % 3 + 1)) % 30 + 4)}px` : '4px',
                    animation: isPlaying ? `bounce 0.6s infinite ease-in-out` : 'none',
                    animationDelay: `${idx * 40}ms`,
                  }}
                />
              ))}
            </div>

            {/* Big Play / Stop Button */}
            <button
              type="button"
              onClick={togglePlay}
              disabled={isLoading}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl transition-all active:scale-95 ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-amber-500/30'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Connecting Stream...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Stop Broadcast</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Tune in Live to 87.7 FM</span>
                </>
              )}
            </button>

            {/* Volume Control */}
            <div className="w-full flex items-center justify-between gap-2 px-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={toggleMute}
                className="hover:text-white cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="font-mono text-[10px] w-8 text-right">{Math.round(volume * 100)}%</span>
            </div>

            {/* Direct Studio Connect */}
            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              <a
                href="https://wa.me/233240000000?text=Hello%20KTU%20Radio%2087.7%20FM!%20Listening%20from%20campus"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="WhatsApp Studio Hotline"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Studio WhatsApp</span>
              </a>

              <a
                href="tel:+233240000000"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="Direct Phone Line to On-Air Booth"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Studio</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Program Schedule & Live Shoutouts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Program Lineup */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  KTU 87.7 FM Program Schedule
                </h3>
                <p className="text-[11px] text-slate-500">Official student broadcasting lineup</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Today's Shows
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { time: '06:00 - 09:00', title: 'Campus Sunrise & Daily News', host: 'Akua Afriyie', current: false },
              { time: '09:00 - 12:00', title: 'Tech Zone & Student Innovations', host: 'Selorm (FAST)', current: false },
              { time: '12:00 - 15:00', title: 'Midday Groove & Highlife Classics', host: 'DJ Flex', current: false },
              { time: '15:00 - 18:00', title: 'The Campus Drive & Aux Battle', host: 'DJ K-Rock & Selorm', current: true },
              { time: '18:00 - 21:00', title: 'SRC Spotlight & Campus Banter', host: 'Kwame Mensah', current: false },
              { time: '21:00 - 00:00', title: 'Late Night Chill & Lofi Study Beats', host: 'Station Automation', current: false },
            ].map((slot, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                  slot.current
                    ? 'bg-amber-50/80 border-amber-300 font-semibold shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200/80'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-900 font-bold truncate">{slot.title}</span>
                    {slot.current && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-slate-950 uppercase shrink-0">
                        NOW
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">{slot.host}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-600 font-bold shrink-0">{slot.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Shoutout / Request to On-Air Studio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Music2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Live Studio Shoutouts & Requests
                  </h3>
                  <p className="text-[11px] text-slate-500">Read live by the on-air DJ on 87.7 FM</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Instant Feed
              </span>
            </div>

            {/* Scrollable list of shoutouts */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {shoutoutList.map((shout) => (
                <div key={shout.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">@{shout.sender}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{shout.department}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[10px]">{shout.time}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-normal">{shout.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shoutout Form */}
          <form onSubmit={handleSendShoutout} className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              value={shoutoutText}
              onChange={(e) => setShoutoutText(e.target.value)}
              placeholder="Send shoutout / song request to the DJ booth..."
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!shoutoutText.trim()}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1 transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default KTURadioPlayer;
