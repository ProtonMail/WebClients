import type { HandleEditMessage } from '../hooks/useLumoActions';
import type { Message } from '../types';

interface PendingEdit {
    message: Message;
    handleEditMessage: HandleEditMessage;
    onComplete: () => void;
}

let pendingEdit: PendingEdit | null = null;

export const setPendingNativeEdit = (edit: PendingEdit): void => {
    pendingEdit = edit;
};

export const getPendingNativeEdit = (): PendingEdit | null => pendingEdit;

export const completePendingNativeEdit = (): void => {
    const onComplete = pendingEdit?.onComplete;
    pendingEdit = null;
    onComplete?.();
};

export const clearPendingNativeEdit = (): void => {
    pendingEdit = null;
};

export const onNativeEditCleared = (handler: () => void): (() => void) => {
    window.addEventListener('lumo:nativeEditCleared', handler);
    return () => window.removeEventListener('lumo:nativeEditCleared', handler);
};
