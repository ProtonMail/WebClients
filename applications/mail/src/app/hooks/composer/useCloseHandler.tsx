import { useRef, useState } from 'react';

import { c } from 'ttag';

import { useHandler, useNotifications } from '@proton/components';
import { Abortable } from '@proton/components/hooks/useHandler';
import useIsMounted from '@proton/hooks/useIsMounted';
import { wait } from '@proton/shared/lib/helpers/promise';

import SavingDraftNotification, {
    SavingDraftNotificationAction,
} from '../../components/notifications/SavingDraftNotification';
import { useOnCompose } from '../../containers/ComposeProvider';
import { MessageState } from '../../logic/messages/messagesTypes';
import { PromiseHandlers } from '../usePromise';

export interface UseCloseHandlerParameters {
    modelMessage: MessageState;
    syncedMessage: MessageState;
    lock: boolean;
    ensureMessageContent: () => void;
    uploadInProgress: boolean;
    promiseUpload: Promise<void>;
    pendingAutoSave: PromiseHandlers<void>;
    autoSave: ((message: MessageState) => Promise<void>) & Abortable;
    saveNow: (message: MessageState) => Promise<void>;
    onClose: () => void;
    onDiscard: () => void;
    onMessageAlreadySent: () => void;
}

export const useCloseHandler = ({
    modelMessage,
    syncedMessage,
    lock,
    ensureMessageContent,
    saveNow,
    uploadInProgress,
    pendingAutoSave,
    promiseUpload,
    onClose,
    onDiscard,
    onMessageAlreadySent,
}: UseCloseHandlerParameters) => {
    const { createNotification, hideNotification } = useNotifications();
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
        // Message already sent
        if (syncedMessage.draftFlags?.isSentDraft) {
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
                        void onDiscard();
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
        if (!lock) {
            // Has to be done before the onClose call
            // It needs to refer to composer components which will be disposed otherwise
            ensureMessageContent();
        }

        // Closing the composer instantly, all the save process will be in background
        onClose();

        if (syncedMessage.draftFlags?.isSentDraft) {
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
