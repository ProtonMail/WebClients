import { useRef, useState } from 'react';

import type { Cancellable } from '@proton/components';
import { useHandler } from '@proton/components';

import { isDecryptionError, isNetworkError } from '../../helpers/errors';
import type { MessageState, MessageStateWithData } from '../../store/messages/messagesTypes';
import { useDeleteDraft, useSaveDraft } from '../message/useSaveDraft';
import { usePromise } from '../usePromise';

interface AutoSaveArgs {
    onMessageAlreadySent?: () => void;
}

export const useAutoSave = ({ onMessageAlreadySent }: AutoSaveArgs) => {
    const [hasNetworkError, setHasNetworkError] = useState(false);

    const pendingAutoSave = usePromise<void>();
    const pendingSave = usePromise<void>();
    const pauseDebouncer = useRef<boolean>(false);
    const lastCall = useRef<MessageState>();

    const saveDraft = useSaveDraft({ onMessageAlreadySent });
    const deleteDraftSource = useDeleteDraft();

    let pause: () => void;
    let restart: () => void;

    const actualSave = useHandler(async (message: MessageState) => {
        pause();

        try {
            await pendingSave.promise;
        } catch {
            // Nothing
        }

        try {
            lastCall.current = undefined;
            pendingSave.renew();
            await saveDraft(message as MessageStateWithData);
            setHasNetworkError(false);
        } catch (error: any) {
            if (isNetworkError(error) || isDecryptionError(error)) {
                console.error(error);
                setHasNetworkError(true);
            } else {
                throw error;
            }
        } finally {
            pendingSave.resolver();
            restart();
        }
    });

    const debouncedHandler = useHandler(
        (message: MessageState) => {
            pendingAutoSave.resolver();
            return actualSave(message);
        },
        { debounce: 2000 }
    );

    pause = useHandler(() => {
        pauseDebouncer.current = true;
    });

    restart = useHandler(() => {
        pauseDebouncer.current = false;
        if (lastCall.current !== undefined) {
            void debouncedHandler(lastCall.current as MessageState);
        }
    });

    const pausableHandler = useHandler((message: MessageState) => {
        if (!pendingAutoSave.isPending) {
            pendingAutoSave.renew();
        }
        lastCall.current = message;
        if (!pauseDebouncer.current) {
            return debouncedHandler(message);
        }
    });

    const cancel = useHandler(() => {
        debouncedHandler.cancel?.();
        pendingAutoSave.resolver();
        pauseDebouncer.current = false;
    });

    pausableHandler.cancel = cancel;

    const saveNow = (message: MessageState) => {
        cancel();
        return actualSave(message);
    };

    const deleteDraft = useHandler(async (message: MessageState) => {
        cancel();
        const hasMessageID = message.data?.ID;

        try {
            await pendingSave.promise;
        } catch {
            // Nothing
        }

        try {
            pendingSave.renew();
            await deleteDraftSource(message);
        } finally {
            pendingSave.resolver();
            // Restart function can trigger an autoSave
            // If message has not been saved yet (no messageID),
            // we don't want to trigger an autoSave
            if (hasMessageID) {
                restart();
            }
        }
    });

    return {
        autoSave: pausableHandler as ((message: MessageState) => Promise<void>) & Cancellable,
        saveNow,
        deleteDraft,
        pendingSave,
        pendingAutoSave,
        pause,
        restart,
        hasNetworkError,
    };
};
