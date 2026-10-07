import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Video,
  X,
  RotateCcw,
  Check,
  Disc,
  StopCircle,
  AlertCircle,
  Image as ImageIcon,
  SwitchCamera,
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'photo' | 'video' | 'both';
  onCapturePhoto?: (dataUrl: string) => void;
  onCaptureVideo?: (file: File, url: string) => void;
  title?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  mode = 'photo',
  onCapturePhoto,
  onCaptureVideo,
  title = 'Camera Access',
}) => {
  const [activeTab, setActiveTab] = useState<'photo' | 'video'>(
    mode === 'video' ? 'video' : 'photo'
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Preview captured states
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedVideoUrl, setCapturedVideoUrl] = useState<string | null>(null);
  const [capturedVideoFile, setCapturedVideoFile] = useState<File | null>(null);

  // Video recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCapturedVideoUrl(null);
      setCapturedVideoFile(null);
      setIsRecording(false);
      setRecordSeconds(0);
      setActiveTab(mode === 'video' ? 'video' : 'photo');
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (facing: 'user' | 'environment') => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported on this browser or device.');
      return;
    }

    try {
      // Best optimization for Android & iPhones:
      // Try facingMode with ideal dimensions, fallback gracefully
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: activeTab === 'video' ? true : false,
      };

      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        // Fallback without audio or exact facingMode
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        'Unable to access device camera. Please check camera permissions or select a file from your device.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleToggleFacingMode = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
  };

  // -------------------------------------------------------------
  // Photo Capture
  // -------------------------------------------------------------
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  // -------------------------------------------------------------
  // Video Recording
  // -------------------------------------------------------------
  const startRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];

    // Detect supported MIME type on iOS & Android
    const mimeTypes = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    let selectedMime = '';
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    try {
      const options = selectedMime ? { mimeType: selectedMime } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const type = selectedMime || 'video/mp4';
        const blob = new Blob(recordedChunksRef.current, { type });
        const videoUrl = URL.createObjectURL(blob);
        const file = new File(
          [blob],
          `vlog_recording_${Date.now()}.${type.includes('mp4') ? 'mp4' : 'webm'}`,
          { type }
        );
        setCapturedVideoUrl(videoUrl);
        setCapturedVideoFile(file);
        stopCamera();
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e: any) {
      console.error('MediaRecorder error:', e);
      setCameraError('Recording failed on this device. You can choose a video file instead.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCapturedVideoUrl(null);
    setCapturedVideoFile(null);
    setRecordSeconds(0);
    startCamera(facingMode);
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto && onCapturePhoto) {
      onCapturePhoto(capturedPhoto);
      onClose();
    }
  };

  const handleConfirmVideo = () => {
    if (capturedVideoFile && capturedVideoUrl && onCaptureVideo) {
      onCaptureVideo(capturedVideoFile, capturedVideoUrl);
      onClose();
    }
  };

  // Device file fallback
  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCapturedPhoto(result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setCapturedVideoUrl(url);
      setCapturedVideoFile(file);
      stopCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-950 text-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">{title}</h3>
              <p className="text-[10px] text-slate-400">Optimized for Android & iOS</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher (if both supported) */}
        {mode === 'both' && !capturedPhoto && !capturedVideoUrl && (
          <div className="px-4 pt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('photo');
                if (isRecording) stopRecording();
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'photo'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Take Picture</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('video');
                startCamera(facingMode);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'video'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Record Video</span>
            </button>
          </div>
        )}

        {/* Viewfinder / Preview Body */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[300px]">
          {/* 1. Captured Photo Preview */}
          {capturedPhoto && (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="w-full rounded-2xl overflow-hidden aspect-4/3 bg-black border border-slate-800 shadow-inner relative">
                <img
                  src={capturedPhoto}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-full flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPhoto}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Use Picture</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Captured Video Preview */}
          {capturedVideoUrl && (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="w-full rounded-2xl overflow-hidden aspect-4/3 bg-black border border-slate-800 shadow-inner relative">
                <video
                  src={capturedVideoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-full flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVideo}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Use Video</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Live Viewfinder Camera */}
          {!capturedPhoto && !capturedVideoUrl && (
            <div className="w-full flex flex-col items-center gap-3">
              {cameraError ? (
                <div className="w-full p-5 rounded-2xl bg-rose-950/40 border border-rose-800 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-xs text-rose-200">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => fallbackFileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Select File from Device Instead
                  </button>
                </div>
              ) : (
                <div className="relative w-full rounded-2xl overflow-hidden aspect-4/3 bg-black border border-slate-800 shadow-2xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className={`w-full h-full object-cover ${
                      facingMode === 'user' ? 'scale-x-[-1]' : ''
                    }`}
                  />

                  {/* Flip camera control */}
                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer border border-white/20"
                    title="Switch Front/Back Camera"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>

                  {/* Recording indicator badge */}
                  {isRecording && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      <span>REC {String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:{String(recordSeconds % 60).padStart(2, '0')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Trigger Buttons */}
              {!cameraError && (
                <div className="w-full flex items-center justify-center gap-4 pt-2">
                  {/* Photo Snap Button */}
                  {activeTab === 'photo' && (
                    <button
                      type="button"
                      onClick={takeSnapshot}
                      className="w-16 h-16 rounded-full border-4 border-white bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
                      title="Take Snapshot"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                  )}

                  {/* Video Record / Stop Button */}
                  {activeTab === 'video' && (
                    <div>
                      {isRecording ? (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="w-16 h-16 rounded-full border-4 border-white bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer animate-pulse"
                          title="Stop Recording"
                        >
                          <StopCircle className="w-7 h-7" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="w-16 h-16 rounded-full border-4 border-white bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
                          title="Start Video Recording"
                        >
                          <Disc className="w-7 h-7" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Hidden device camera/gallery file input fallback */}
          <input
            ref={fallbackFileInputRef}
            type="file"
            accept={activeTab === 'photo' ? 'image/*' : 'video/*,image/*'}
            onChange={handleFallbackFile}
            className="hidden"
          />
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>In-app camera active</span>
          <button
            type="button"
            onClick={() => fallbackFileInputRef.current?.click()}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <ImageIcon className="w-3 h-3" />
            <span>Choose from device files</span>
          </button>
        </div>
      </div>
    </div>
  );
};
