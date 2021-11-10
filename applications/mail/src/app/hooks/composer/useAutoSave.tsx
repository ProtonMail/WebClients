import { useHandler } from '@proton/components';
import { Abortable } from '@proton/components/hooks/useHandler';
import { useRef } from 'react';
import { isDecryptionError, isNetworkError } from '../../helpers/errors';
import { useDeleteDraft, useSaveDraft } from '../message/useSaveDraft';
import { usePromise } from '../usePromise';
import { MessageState, MessageStateWithData } from '../../logic/messages/messagesTypes';

interface AutoSaveArgs {
    onMessageAlreadySent?: () => void;
}

export const useAutoSave = ({ onMessageAlreadySent }: AutoSaveArgs) => {
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
        } catch (error: any) {
            if (isNetworkError(error) || isDecryptionError(error)) {
                console.error(error);
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

    const abort = useHandler(() => {
        debouncedHandler.abort?.();
        pendingAutoSave.resolver();
        pauseDebouncer.current = false;
    });

    pausableHandler.abort = abort;

    const saveNow = (message: MessageState) => {
        abort();
        return actualSave(message);
    };

    const deleteDraft = useHandler(async (message: MessageState) => {
        abort();

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
            restart();
        }
    });

    return {
        autoSave: pausableHandler as ((message: MessageState) => Promise<void>) & Abortable,
        saveNow,
        deleteDraft,
        pendingSave,
        pendingAutoSave,
        pause,
        restart,
    };
};
