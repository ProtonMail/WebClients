import { useEffect, useRef } from 'react';

import type { HandleEditMessage } from '../../../../../hooks/useLumoActions';
import { clearNativeEditMode, setNativeEditMode } from '../../../../../remote/nativeComposerBridgeHelpers';
import {
    clearPendingNativeEdit,
    getPendingNativeEdit,
    onNativeEditCleared,
    setPendingNativeEdit,
} from '../../../../../remote/nativeEditStore';
import type { Message } from '../../../../../types';

interface UseNativeMessageEditOptions {
    message: Message;
    messageContent: string | undefined;
    handleEditMessage: HandleEditMessage;
}

const useNativeMessageEdit = ({ message, messageContent, handleEditMessage }: UseNativeMessageEditOptions) => {
    const isNativeEditingRef = useRef(false);

    useEffect(() => {
        return onNativeEditCleared(() => {
            if (getPendingNativeEdit()?.message.id !== message.id) return;
            clearPendingNativeEdit();
            isNativeEditingRef.current = false;
        });
    }, []);

    useEffect(() => {
        return () => {
            if (isNativeEditingRef.current) {
                clearPendingNativeEdit();
                clearNativeEditMode();
            }
        };
    }, []);

    const startNativeEdit = () => {
        if (!messageContent?.trim()) return;
        setPendingNativeEdit({
            message,
            handleEditMessage,
            onComplete: () => {
                isNativeEditingRef.current = false;
            },
        });
        setNativeEditMode(messageContent);
        isNativeEditingRef.current = true;
    };

    return { startNativeEdit };
};

export default useNativeMessageEdit;
