import { X } from 'lucide-react';
import { cn } from '../utils/cn';

const Modal = ({ isOpen, onClose, title, children, footer, variant = 'default' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div
                className={cn(
                    "bg-[#0a0a0a] border border-slate-800 w-full max-w-lg rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300",
                    variant === 'danger' && "border-rose-500/20"
                )}
            >
                {/* Header */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <h2 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 flex items-center justify-center transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-8 py-4">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-8 pt-4 flex items-center justify-end gap-4 bg-slate-900/40">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
