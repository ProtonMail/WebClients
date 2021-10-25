import { wait } from '@proton/shared/lib/helpers/promise';
import { useRef, useState } from 'react';
import { useHandler, useIsMounted, useNotifications } from '@proton/components';
import { Abortable } from '@proton/components/hooks/useHandler';
import { c } from 'ttag';
import SavingDraftNotification, {
    SavingDraftNotificationAction,
} from '../../components/notifications/SavingDraftNotification';
import { MessageExtended, MessageExtendedWithData } from '../../models/message';
import { useOnCompose } from '../../containers/ComposeProvider';
import { useMessageCache } from '../../containers/MessageProvider';
import { PromiseHandlers } from '../usePromise';

export interface UseCloseHandlerParameters {
    modelMessage: MessageExtended;
    lock: boolean;
    ensureMessageContent: () => void;
    uploadInProgress: boolean;
    promiseUpload: Promise<void>;
    pendingAutoSave: PromiseHandlers<void>;
    autoSave: ((message: MessageExtended) => Promise<void>) & Abortable;
    saveNow: (message: MessageExtended) => Promise<void>;
    onClose: () => void;
    onDicard: () => void;
    onMessageAlreadySent: () => void;
}

export const useCloseHandler = ({
    modelMessage,
    lock,
    ensureMessageContent,
    saveNow,
    uploadInProgress,
    pendingAutoSave,
    promiseUpload,
    onClose,
    onDicard,
    onMessageAlreadySent,
}: UseCloseHandlerParameters) => {
    const { createNotification, hideNotification } = useNotifications();
    const messageCache = useMessageCache();
    const isMounted = useIsMounted();
    const onCompose = useOnCompose();

    // Indicates that the composer is saving a draft
    const [saving, setSavingUnsafe] = useState(false);

    // Manual save mostly used when closing, save state is not relevant then
    const setSaving = (value: boolean) => {
        if (isMounted()) {
            setSavingUnsafe(value);
        }
    };

    const notficationRef = useRef<SavingDraftNotificationAction>();

    const handleManualSaveAfterUploads = useHandler(async (notificationID: number) => {
        try {
            await saveNow(modelMessage);
            notficationRef.current?.saved();
            await wait(3000);
        } finally {
            hideNotification(notificationID);
            setSaving(false);
        }
    });

    const handleManualSave = useHandler(async () => {
        const messageFromCache = messageCache.get(modelMessage.localID) as MessageExtendedWithData;

        // Message already sent
        if (messageFromCache.isSentDraft) {
            onMessageAlreadySent();
            return;
        }

        const notificationID = createNotification({
            text: (
                <SavingDraftNotification
                    ref={notficationRef}
                    onDiscard={() => {
                        if (notificationID) {
                            hideNotification(notificationID);
                        }
                        void onDicard();
                    }}
                />
            ),
            expiration: -1,
            disableAutoClose: true,
        });

        setSaving(true);
        ensureMessageContent();

        try {
            await promiseUpload;
        } catch (error: any) {
            hideNotification(notificationID);
            setSaving(false);
            throw error;
        }

        // Split handlers to have the updated version of the message
        await handleManualSaveAfterUploads(notificationID);
    });

    const handleClose = useHandler(async () => {
        // Closing the composer instantly, all the save process will be in background
        onClose();

        const messageFromCache = messageCache.get(modelMessage.localID) as MessageExtendedWithData;

        if (messageFromCache.isSentDraft) {
            createNotification({
                text: c('Error').t`This message has already been sent`,
                type: 'error',
            });
            return;
        }

        if (lock) {
            // If the composer was locked, either it could have
            // - failed at loading
            // - still being created
            // - still being loaded
            // In all of those situation we don't need to save something, we can safely skip all the rest
            return;
        }

        ensureMessageContent();

        // Message requires to be saved in background
        if (pendingAutoSave.isPending || uploadInProgress) {
            try {
                await handleManualSave();
            } catch {
                createNotification({
                    text: c('Error').t`Draft could not be saved. Try again.`,
                    type: 'error',
                });
                onCompose({ existingDraft: modelMessage, fromUndo: true });
            }
        }
    });

    return { handleClose, handleManualSave, saving };
};
