import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  Play,
  Pause,
  Upload,
  Sparkles,
  Search,
  Check,
  X,
  Volume2,
  TrendingUp,
  Disc,
  Radio
} from 'lucide-react';

export interface SoundItem {
  id: string;
  title: string;
  artist: string;
  category: 'viral' | 'tiktok' | 'afrobeats' | 'meme' | 'custom';
  duration: string;
  plays: string;
  audioUrl?: string; // If provided or generated
  toneFreq?: number; // Tone frequency for Web Audio synthesized melodic preview
  waveformType?: OscillatorType;
}

export const VIRAL_TIKTOK_SOUNDS: SoundItem[] = [
  {
    id: 'sound-1',
    title: 'Emotional Damage! (Original Clip)',
    artist: 'TikTok Viral Meme',
    category: 'meme',
    duration: '0:05',
    plays: '4.2M',
    toneFreq: 440,
    waveformType: 'sawtooth',
  },
  {
    id: 'sound-2',
    title: 'Oh No, Oh No, Oh No No No No',
    artist: 'CapCut Trending Sounds',
    category: 'tiktok',
    duration: '0:12',
    plays: '8.9M',
    toneFreq: 523.25,
    waveformType: 'triangle',
  },
  {
    id: 'sound-3',
    title: 'Kwaku The Traveller (Campus Drill)',
    artist: 'Black Sherif',
    category: 'afrobeats',
    duration: '0:28',
    plays: '2.1M',
    toneFreq: 330,
    waveformType: 'sine',
  },
  {
    id: 'sound-4',
    title: 'Why Are You Running?! 😂',
    artist: 'Ghana Classic Viral',
    category: 'meme',
    duration: '0:06',
    plays: '5.6M',
    toneFreq: 392,
    waveformType: 'square',
  },
  {
    id: 'sound-5',
    title: 'Amapiano Campus Bass Drop 2026',
    artist: 'Koforidua Club Mix',
    category: 'viral',
    duration: '0:30',
    plays: '1.4M',
    toneFreq: 220,
    waveformType: 'triangle',
  },
  {
    id: 'sound-6',
    title: 'KTU Anthem (Trap Drill Remix)',
    artist: 'FAST Studio Boys',
    category: 'viral',
    duration: '0:24',
    plays: '890K',
    toneFreq: 261.63,
    waveformType: 'sawtooth',
  },
  {
    id: 'sound-7',
    title: 'Lonely At The Top (Speed Up Vibe)',
    artist: 'Asake',
    category: 'afrobeats',
    duration: '0:18',
    plays: '3.7M',
    toneFreq: 349.23,
    waveformType: 'sine',
  },
  {
    id: 'sound-8',
    title: 'Chill Lofi Study in Library Hall',
    artist: 'KTU Sound Archive',
    category: 'tiktok',
    duration: '0:30',
    plays: '620K',
    toneFreq: 293.66,
    waveformType: 'sine',
  },
];

interface SoundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSound: (sound: SoundItem) => void;
  selectedSoundId?: string | null;
  triggerToast: (msg: string) => void;
}

export const SoundPickerModal: React.FC<SoundPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSound,
  selectedSoundId,
  triggerToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [customSounds, setCustomSounds] = useState<SoundItem[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorRef = useRef<OscillatorNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop web audio on unmount or sound change
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (activeOscillatorRef.current) {
      try {
        activeOscillatorRef.current.stop();
        activeOscillatorRef.current.disconnect();
      } catch (e) {}
      activeOscillatorRef.current = null;
    }
    setPlayingSoundId(null);
  };

  const playSoundPreview = (sound: SoundItem) => {
    if (playingSoundId === sound.id) {
      stopAudio();
      return;
    }

    stopAudio();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Generate a pleasant melodic rhythmic preview pattern for the sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = sound.toneFreq || 440;
      osc.type = sound.waveformType || 'sine';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      // Create a groovy pitch sequence matching TikTok beat
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.setValueAtTime(baseFreq * 1.25, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime + 0.45);
      osc.frequency.setValueAtTime(baseFreq * 0.75, ctx.currentTime + 0.6);
      osc.frequency.setValueAtTime(baseFreq * 1.33, ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.25);

      activeOscillatorRef.current = osc;
      setPlayingSoundId(sound.id);

      osc.onended = () => {
        setPlayingSoundId(null);
      };
    } catch (err) {
      console.warn('Audio preview error', err);
      setPlayingSoundId(sound.id);
      setTimeout(() => setPlayingSoundId(null), 1500);
    }
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const soundUrl = URL.createObjectURL(file);
    const newSound: SoundItem = {
      id: `custom-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'My Audio Upload',
      category: 'custom',
      duration: '0:15',
      plays: 'Just now',
      audioUrl: soundUrl,
      toneFreq: 440,
      waveformType: 'triangle',
    };

    setCustomSounds((prev) => [newSound, ...prev]);
    onSelectSound(newSound);
    triggerToast(`Attached "${newSound.title}" to post!`);
    onClose();
  };

  if (!isOpen) return null;

  const allSounds = [...customSounds, ...VIRAL_TIKTOK_SOUNDS];
  const filteredSounds = allSounds.filter((s) => {
    const matchesCat = activeCategory === 'all' || s.category === activeCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesCat && matchesQuery;
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
      onClick={() => {
        stopAudio();
        onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Disc className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  TikTok & Viral Sounds
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-pink-100 text-pink-700 uppercase">
                  Trending
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Attach trending campus audio, Afrobeats & TikTok memes to your post
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopAudio();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-3.5 space-y-2.5 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sounds, memes, Afrobeats..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-pink-500 focus:bg-white"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {[
              { id: 'all', label: '🔥 All Sounds' },
              { id: 'tiktok', label: '🎵 TikTok Viral' },
              { id: 'meme', label: '😂 Campus Memes' },
              { id: 'afrobeats', label: '🇬🇭 Afrobeats' },
              { id: 'custom', label: '📁 My Audio' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                  activeCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sound List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2 min-h-0 bg-slate-50/50">
          {/* Upload Custom Audio Button */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-pink-500 bg-white hover:bg-pink-50/30 transition-all flex items-center justify-between gap-3 cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleCustomAudioUpload}
            />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Upload Your Own Sound File</p>
                <p className="text-[10px] text-slate-500">MP3, WAV, M4A from your device or voice note</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-pink-600 group-hover:underline">Choose file</span>
          </div>

          {filteredSounds.map((sound) => {
            const isPlaying = playingSoundId === sound.id;
            const isSelected = selectedSoundId === sound.id;

            return (
              <div
                key={sound.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 bg-white ${
                  isSelected
                    ? 'border-pink-500 ring-2 ring-pink-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Play / Pause Preview Button */}
                  <button
                    type="button"
                    onClick={() => playSoundPreview(sound)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                      isPlaying
                        ? 'bg-pink-600 text-white shadow-md animate-pulse'
                        : 'bg-slate-100 hover:bg-pink-100 text-slate-700 hover:text-pink-600'
                    }`}
                    title={isPlaying ? 'Pause preview' : 'Play preview'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{sound.title}</h4>
                      {isPlaying && (
                        <span className="flex items-end gap-0.5 h-3 px-1 py-0.5 rounded bg-pink-100 shrink-0">
                          <span className="w-1 h-2 bg-pink-600 rounded-full animate-bounce"></span>
                          <span className="w-1 h-3 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1 h-1.5 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                      <span>{sound.artist}</span>
                      <span>·</span>
                      <span>{sound.duration}</span>
                      <span>·</span>
                      <span className="text-pink-600 font-bold">{sound.plays} uses</span>
                    </div>
                  </div>
                </div>

                {/* Attach Sound CTA Button */}
                <button
                  type="button"
                  onClick={() => {
                    stopAudio();
                    onSelectSound(sound);
                    triggerToast(`Sound "${sound.title}" selected!`);
                    onClose();
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 ${
                    isSelected
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-pink-600 hover:text-white text-slate-700'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Attached</span>
                    </>
                  ) : (
                    <span>Use Sound</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px]">Attach sound to create audio-synced campus memes</span>
          <button
            type="button"
            onClick={() => {
              stopAudio();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SoundPickerModal;
