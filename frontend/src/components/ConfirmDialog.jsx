import Modal from './Modal';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info', // 'info', 'danger', 'success'
    loading = false,
    alertOnly = false
}) => {
    const icons = {
        info: <Info className="w-12 h-12 text-indigo-500" />,
        danger: <AlertTriangle className="w-12 h-12 text-rose-500" />,
        success: <CheckCircle2 className="w-12 h-12 text-emerald-500" />
    };

    const footer = (
        <>
            {!alertOnly && (
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-6 py-3 rounded-2xl text-slate-400 font-bold hover:bg-slate-800 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
                >
                    {cancelText}
                </button>
            )}
            <button
                onClick={onConfirm}
                disabled={loading}
                className={cn(
                    "px-8 py-3 rounded-2xl font-black text-white transition-all text-sm uppercase tracking-widest shadow-xl flex items-center gap-2 disabled:opacity-50",
                    type === 'danger' ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" :
                        type === 'success' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" :
                            "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                )}
            >
                {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                {confirmText}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={footer}
            variant={type === 'danger' ? 'danger' : 'default'}
        >
            <div className="flex flex-col items-center text-center py-4">
                <div className={cn(
                    "mb-6 p-6 rounded-[2rem]",
                    type === 'danger' ? "bg-rose-500/10" :
                        type === 'success' ? "bg-emerald-500/10" :
                            "bg-indigo-500/10"
                )}>
                    {icons[type]}
                </div>
                <p className="text-slate-400 font-medium leading-relaxed max-w-xs uppercase tracking-tight text-sm">
                    {message}
                </p>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
