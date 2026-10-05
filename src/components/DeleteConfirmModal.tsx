import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemPreview?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  iconType?: 'trash' | 'alert' | 'shield';
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemPreview,
  confirmText = 'Delete Permanently',
  cancelText = 'Cancel',
  isDangerous = true,
  iconType = 'trash',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/90 text-slate-900 space-y-4 animate-in zoom-in-95 duration-200"
      >
        {/* Close Icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close confirmation dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Badge & Header */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isDangerous
                ? 'bg-rose-100 text-rose-600 border border-rose-200'
                : 'bg-amber-100 text-amber-600 border border-amber-200'
            }`}
          >
            {iconType === 'trash' && <Trash2 className="w-6 h-6 stroke-[2.2]" />}
            {iconType === 'alert' && <AlertTriangle className="w-6 h-6 stroke-[2.2]" />}
            {iconType === 'shield' && <ShieldAlert className="w-6 h-6 stroke-[2.2]" />}
          </div>

          <div className="space-y-1 pr-6">
            <h3 id="delete-modal-title" className="text-base font-extrabold text-slate-900 leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Optional preview snippet */}
        {itemPreview && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 font-medium italic line-clamp-3 leading-relaxed">
            "{itemPreview}"
          </div>
        )}

        {/* Destructive Warning Pill */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-[11px] text-rose-800 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
          <span>This action is immediate and cannot be undone.</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
