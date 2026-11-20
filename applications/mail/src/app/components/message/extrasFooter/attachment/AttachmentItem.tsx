import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import FileNameDisplay from '@proton/components/components/fileNameDisplay/FileNameDisplay';
import CircularProgress from '@proton/components/components/progress/CircularProgress';
import { getFileIcon } from '@proton/file-icons/getFileIcon';
import useIsMounted from '@proton/hooks/useIsMounted';
import type { WithLoading } from '@proton/hooks/useLoading';
import useLoading from '@proton/hooks/useLoading';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcArrowsFromCenter } from '@proton/icons/icons/IcArrowsFromCenter';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { IcCross } from '@proton/icons/icons/IcCross';
import type { AttachmentHandler } from '@proton/mail-composer/attachments/attachmentListTypes';
import { AttachmentAction } from '@proton/mail-composer/attachments/attachmentListTypes';
import type { PendingUpload } from '@proton/mail-composer/attachments/uploadTypes';
import { isAttachmentUpload } from '@proton/mail-composer/hooks/composer/useAttachments/helpers';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { wait } from '@proton/shared/lib/helpers/promise';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import clsx from '@proton/utils/clsx';

const getActionTitle = (action: AttachmentAction, attachmentName: string) => {
    switch (action) {
        case AttachmentAction.Download:
            return c('Action').t`Download ${attachmentName}`;
        case AttachmentAction.Preview:
            return c('Action').t`Preview ${attachmentName}`;
        case AttachmentAction.Remove:
            return c('Action').t`Remove ${attachmentName}`;
        default:
            return attachmentName;
    }
};

const actionIcons = {
    [AttachmentAction.Download]: IcArrowDownLine,
    [AttachmentAction.Preview]: IcArrowsFromCenter,
    [AttachmentAction.Remove]: IcCross,
};

/** Keeps the download and save loaders visible long enough to be noticed, even when the file is already in memory. */
const MIN_LOADER_DURATION = 400;

const getSenderVerificationString = (verificationStatus?: MAIL_VERIFICATION_STATUS) => {
    if (verificationStatus === MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID) {
        const str = c('Attachment signature verification').t`Sender verification failed`;
        return ` - ${str}`;
    }
    if (verificationStatus === MAIL_VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const str = c('Attachment signature verification').t`Sender verification passed`;
        return ` - ${str}`;
    }
    return '';
};

interface Props {
    attachment?: Attachment;
    pendingUpload?: PendingUpload;
    attachmentVerified?: MAIL_VERIFICATION_STATUS;
    primaryAction: AttachmentAction;
    secondaryAction: AttachmentAction;

    onPrimary: AttachmentHandler;
    onSecondary: AttachmentHandler;
    /** Shows a Save to Drive button next to the secondary action on a received attachment. */
    onSaveToDrive?: (attachment: Attachment) => Promise<void>;
}

const AttachmentItem = ({
    attachment,
    pendingUpload,
    attachmentVerified,
    primaryAction,
    secondaryAction,
    onPrimary,
    onSecondary,
    onSaveToDrive,
}: Props) => {
    const [loading, withLoading] = useLoading();
    const [saving, withSaving] = useLoading();
    const busy = loading || saving;
    // Synchronous lock: every control on the chip (icon, name, secondary and Save to Drive buttons) can trigger an action,
    // and on files that cannot be previewed both primary and secondary actions download.
    const actionInProgressRef = useRef(false);
    const [progression, setProgression] = useState<number>(0);
    const isMounted = useIsMounted();

    useEffect(() => {
        if (pendingUpload && isAttachmentUpload(pendingUpload)) {
            pendingUpload.upload.addProgressListener((event) => {
                if (isMounted()) {
                    setProgression(event.loaded / event.total);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-0DC85B
    }, []);

    const nameRaw = `${attachment ? attachment.Name || '' : pendingUpload?.file.name || ''}`;
    const name = rtlSanitize(nameRaw);
    const value = Math.round(progression * 100);
    const progressionHappening = progression !== 0 || !!pendingUpload;
    const humanAttachmentSize = progressionHappening ? `` : humanSize({ bytes: attachment?.Size });

    const primaryTitle = `${name} ${humanAttachmentSize}${getSenderVerificationString(attachmentVerified)}`;
    const primaryActionTitle = getActionTitle(primaryAction, primaryTitle);

    const SecondaryActionIcon = actionIcons[secondaryAction];
    const secondaryActionTitle = getActionTitle(secondaryAction, name);

    const runActionWithLock = (
        startAction: () => Promise<void>,
        withActionLoading: WithLoading,
        keepLoaderVisible: boolean
    ) => {
        if (actionInProgressRef.current) {
            return;
        }

        let action = startAction();

        if (keepLoaderVisible) {
            action = Promise.all([action, wait(MIN_LOADER_DURATION)]).then(() => undefined);
        }

        actionInProgressRef.current = true;
        void withActionLoading(
            action.finally(() => {
                actionInProgressRef.current = false;
            })
        );
    };

    const handleAction = (primary: boolean) => () => {
        const actionHandler = primary ? onPrimary : onSecondary;
        const isDownload = (primary ? primaryAction : secondaryAction) === AttachmentAction.Download;

        const startAction = () => {
            if (pendingUpload) {
                const uploadHandler = actionHandler as (pendingUpload: PendingUpload) => Promise<void>;
                return uploadHandler(pendingUpload);
            }
            if (attachment) {
                const attachmentHandler = actionHandler as (attachment: Attachment) => Promise<void>;
                return attachmentHandler(attachment);
            }
            return Promise.resolve();
        };

        runActionWithLock(startAction, withLoading, isDownload);
    };

    const handleSaveToDrive = () => {
        if (!attachment || !onSaveToDrive) {
            return;
        }

        runActionWithLock(() => onSaveToDrive(attachment), withSaving, true);
    };

    const AttachmentIcon = getFileIcon(attachment?.MIMEType || 'unknown');

    const canSaveToDrive = !!attachment && !!onSaveToDrive;

    const secondaryActionSize = (
        <span
            className="message-attachmentSecondaryAction-size color-weak text-ellipsis text-sm my-2"
            aria-hidden="true"
        >
            {humanAttachmentSize}
        </span>
    );

    const secondaryActionIcon = (
        <span className="message-attachmentSecondaryAction-download flex shrink-0">
            {loading ? (
                <CircleLoader className="m-auto" size="small" />
            ) : (
                <SecondaryActionIcon className="m-auto" alt={secondaryActionTitle} />
            )}
        </span>
    );

    return (
        <div className="message-attachmentList-item-container" data-testid="attachment-item">
            <div
                className={clsx([
                    'message-attachmentList-item flex border flex-nowrap pm_button p-0 rounded',
                    busy && 'message-attachmentList-item--loading',
                    progressionHappening && 'message-attachmentList-item--uploading',
                ])}
            >
                <span className="relative flex flex-1 rounded message-attachmentPrimaryAction interactive-pseudo">
                    <button
                        className="pl-2 py-2 flex shrink-0 message-attachmentTypeIcon"
                        type="button"
                        onClick={handleAction(true)}
                        tabIndex={-1}
                        aria-hidden="true"
                        disabled={busy}
                    >
                        {progressionHappening ? (
                            <CircularProgress progress={value} size={20} className="mr-2" />
                        ) : (
                            <AttachmentIcon size={5} className="shrink-0 mr-2" />
                        )}
                    </button>
                    <Tooltip title={primaryActionTitle}>
                        <button
                            aria-label={primaryActionTitle}
                            className="flex-1 flex flex-nowrap outline-none--at-all"
                            title={primaryActionTitle}
                            type="button"
                            onClick={handleAction(true)}
                            aria-disabled={busy}
                            aria-busy={busy}
                            data-testid={`attachment-item:${name}--primary-action`}
                        >
                            <span className="my-auto flex items-baseline flex-nowrap pr-2">
                                <FileNameDisplay text={name} displayTooltip={false} />
                                <span
                                    className="message-attachmentSize sr-only align-baseline inline-block shrink-0 ml-1"
                                    data-testid="attachment-item:size"
                                >
                                    {humanAttachmentSize}
                                </span>
                            </span>
                        </button>
                    </Tooltip>
                </span>
                {canSaveToDrive ? (
                    <div
                        className="inline-flex pr-2 pl-1 rounded relative message-attachmentSecondaryAction message-attachmentSecondaryAction--with-save"
                        aria-busy={busy}
                    >
                        {secondaryActionSize}
                        <span className="message-attachmentSecondaryAction-buttons flex flex-nowrap">
                            <Tooltip title={c('Action').t`Save to ${DRIVE_APP_NAME}`}>
                                <button
                                    type="button"
                                    className="*:pointer-events-none rounded relative interactive-pseudo interactive--no-background message-attachmentSecondaryAction-button"
                                    onClick={handleSaveToDrive}
                                    aria-label={c('Action').t`Save ${name} to ${DRIVE_APP_NAME}`}
                                    disabled={busy}
                                    aria-busy={saving}
                                    data-testid={`attachment-item:${name}--save-to-drive`}
                                >
                                    <span className="message-attachmentSecondaryAction-download flex shrink-0">
                                        {saving ? (
                                            <CircleLoader className="m-auto" size="small" />
                                        ) : (
                                            <IcBrandProtonDrive className="m-auto" />
                                        )}
                                    </span>
                                </button>
                            </Tooltip>
                            <button
                                type="button"
                                className="*:pointer-events-none rounded relative interactive-pseudo interactive--no-background message-attachmentSecondaryAction-button"
                                onClick={handleAction(false)}
                                title={secondaryActionTitle}
                                disabled={busy}
                                aria-busy={loading}
                                data-testid={`attachment-item:${name}--secondary-action`}
                            >
                                {secondaryActionIcon}
                            </button>
                        </span>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="inline-flex pr-2 pl-1 *:pointer-events-none rounded relative interactive-pseudo interactive--no-background message-attachmentSecondaryAction"
                        onClick={handleAction(false)}
                        title={secondaryActionTitle}
                        disabled={loading}
                        aria-busy={loading}
                        data-testid={`attachment-item:${name}--secondary-action`}
                    >
                        {secondaryActionSize}
                        {secondaryActionIcon}
                    </button>
                )}
            </div>
        </div>
    );
};

export default AttachmentItem;
