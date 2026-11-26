import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import type { ProtonDriveClient } from '@proton/drive/sdk';
import type { MessageStateWithData } from '@proton/mail-message/store/messages/messagesTypes';
import { getApiError, getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import ConfirmSaveToDrive from '../../components/message/extrasFooter/attachment/ConfirmSaveToDrive';
import { useMailDrive } from '../../drive/MailDriveProvider';
import type { DriveFile } from '../../helpers/attachment/saveToDrive';
import { useDownload } from './useDownload';
import { useDriveRoomCheck } from './useDriveRoomCheck';

type FailureStage = 'save' | 'upload';

/**
 * Reports a failure to Sentry without any error message or cause, which can carry user data such as the
 * attachment's name: only the stage, the reason, the error's class name and a numeric code when there is one.
 */
const reportFailure = (stage: FailureStage, reason: string, cause: unknown) => {
    const errorName = cause instanceof Error ? cause.name : typeof cause;
    const code = (cause as { code?: unknown } | null | undefined)?.code;
    const errorCode = typeof code === 'number' ? code : undefined;

    traceInitiativeError(
        SentryMailInitiatives.SAVE_TO_DRIVE,
        new Error(`Save to Drive failed (${stage}: ${reason}, ${errorName})`),
        {
            tags: { stage, reason },
            extra: { errorName, ...(errorCode !== undefined && { errorCode }) },
        }
    );
};

/**
 * Saves a received attachment to the root of My files and tells the person how it went. The handler is undefined
 * while Drive isn't available, and it never rejects: every outcome ends in a notification, or none after Cancel.
 */
export const useSaveAttachmentToDrive = (message: MessageStateWithData) => {
    const { drive } = useMailDrive();
    const { checkDriveRoom, showDriveFullError } = useDriveRoomCheck();
    const { prepareForDrive } = useDownload();
    const { createNotification } = useNotifications();
    const [confirmSaveModal, showConfirmSave] = useModalTwo(ConfirmSaveToDrive);

    const showError = (driveMessage?: string) => {
        createNotification({
            text: driveMessage || c('Error').t`Couldn't save the attachment to ${DRIVE_APP_NAME}. Try again.`,
            type: 'error',
        });
    };

    const getConfirmation = async () => {
        try {
            await showConfirmSave({});
            return true;
        } catch {
            // Unlike download, Cancel isn't passed on: the attachment's button doesn't catch it
            return false;
        }
    };

    const upload = async (client: ProtonDriveClient, file: DriveFile) => {
        // Drive's code stays out of Mail's main bundle until someone saves
        const { saveToDrive, SaveToDriveError } = await import(
            /* webpackChunkName: "mail-save-to-drive" */ '../../helpers/attachment/saveToDrive'
        );
        try {
            const { name } = await saveToDrive(client, file);
            createNotification({ text: c('Success').t`"${name}" saved to ${DRIVE_APP_NAME}`, type: 'success' });
        } catch (error) {
            if (!(error instanceof SaveToDriveError)) {
                throw error;
            }
            if (error.reason === 'storageFull') {
                showDriveFullError();
                return;
            }
            reportFailure('upload', error.reason, error.cause);
            showError(error.driveMessage);
        }
    };

    const save = async (client: ProtonDriveClient, attachment: Attachment) => {
        // Checked before fetching, so an attachment that won't fit is never downloaded or decrypted
        if (!checkDriveRoom(attachment.Size ?? 0)) {
            return;
        }
        try {
            const prepared = await prepareForDrive(message, attachment);
            if (prepared.status === 'cannotSave') {
                showError();
                return;
            }
            if (prepared.status === 'senderNotVerified' && !(await getConfirmation())) {
                return;
            }
            await upload(client, prepared.file);
        } catch (error) {
            // Mail's request for the attachment failed: Mail already shows its usual message for that
            if (getApiError(error).status || getIsConnectionIssue(error)) {
                return;
            }
            reportFailure('save', 'unexpected', error);
            showError();
        }
    };

    const onSaveToDrive = drive
        ? (attachment: Attachment) => {
              return save(drive, attachment);
          }
        : undefined;

    return { onSaveToDrive, confirmSaveModal };
};
