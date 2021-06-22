import { wait } from 'proton-shared/lib/helpers/promise';
import React, { RefObject, useRef, useState } from 'react';
import { useHandler, useIsMounted, useNotifications } from 'react-components';
import { Abortable } from 'react-components/hooks/useHandler';
import { c } from 'ttag';
import SavingDraftNotification, {
    SavingDraftNotificationAction,
} from '../../components/notifications/SavingDraftNotification';
import { MessageExtended } from '../../models/message';
import { useOnCompose } from '../../containers/ComposeProvider';
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';

export interface UseCloseHandlerParameters {
    modelMessage: MessageExtended;
    lock: boolean;
    ensureMessageContent: () => void;
    uploadInProgress: boolean;
    promiseUpload: Promise<void>;
    pendingSave: RefObject<boolean>;
    autoSave: ((message: MessageExtended) => Promise<void>) & Abortable;
    actualSave: (message: MessageExtended) => Promise<void>;
    onClose: () => void;
    onDicard: () => void;
}

export const useCloseHandler = ({
    modelMessage,
    lock,
    ensureMessageContent,
    autoSave,
    actualSave,
    uploadInProgress,
    pendingSave,
    promiseUpload,
    onClose,
    onDicard,
}: UseCloseHandlerParameters) => {
    const { createNotification, hideNotification } = useNotifications();
    const isMounted = useIsMounted();
    const messageCache = useMessageCache();
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
        autoSave.abort?.();
        try {
            await actualSave(modelMessage);
            notficationRef.current?.saved();
            await wait(3000);
        } finally {
            hideNotification(notificationID);
            setSaving(false);
        }
    });

    const handleManualSave = useHandler(async () => {
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
        } catch (error) {
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
        if (pendingSave.current || uploadInProgress) {
            try {
                await handleManualSave();
            } catch {
                createNotification({
                    text: c('Error').t`Draft could not be saved. Try again.`,
                    type: 'error',
                });
                onCompose({ existingDraft: modelMessage, fromUndo: true });
            } finally {
                updateMessageCache(messageCache, modelMessage.localID, { inComposer: false });
            }
        } else {
            updateMessageCache(messageCache, modelMessage.localID, { inComposer: false });
        }
    });

    return { handleClose, handleManualSave, saving };
};
