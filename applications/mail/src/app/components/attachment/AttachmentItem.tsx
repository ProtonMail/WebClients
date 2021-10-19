import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    Icon,
    classnames,
    useLoading,
    FileIcon,
    useIsMounted,
    useRightToLeft,
    CircleLoader,
    FileNameDisplay,
} from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';
import { PendingUpload } from '../../hooks/composer/useAttachments';
import { AttachmentAction, AttachmentHandler } from './AttachmentList';

const getActionIcon = (action: AttachmentAction) => {
    switch (action) {
        case AttachmentAction.Download:
            return 'arrow-down-to-rectangle';
        case AttachmentAction.Preview:
            return 'arrow-up-right-and-arrow-down-left-from-center';
        case AttachmentAction.Remove:
            return 'xmark';
        default:
            return '';
    }
};

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

// Reference: Angular/src/templates/attachments/attachmentElement.tpl.html

const getSenderVerificationString = (verified?: VERIFICATION_STATUS) => {
    if (verified === VERIFICATION_STATUS.SIGNED_AND_INVALID) {
        const str = c('Attachment signature verification').t`Sender verification failed`;
        return ` - ${str}`;
    }
    if (verified === VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const str = c('Attachment signature verification').t`Sender verification passed`;
        return ` - ${str}`;
    }
    return '';
};

interface Props {
    attachment?: Attachment;
    pendingUpload?: PendingUpload;
    attachmentVerified?: VERIFICATION_STATUS;
    primaryAction: AttachmentAction;
    secondaryAction: AttachmentAction;

    onPrimary: AttachmentHandler;
    onSecondary: AttachmentHandler;
}

const AttachmentItem = ({
    attachment,
    pendingUpload,
    attachmentVerified,
    primaryAction,
    secondaryAction,
    onPrimary,
    onSecondary,
}: Props) => {
    const [loading, withLoading] = useLoading();
    const [progression, setProgression] = useState<number>(0);
    const isMounted = useIsMounted();
    const [isRTL] = useRightToLeft();

    useEffect(() => {
        if (pendingUpload) {
            pendingUpload.upload.addProgressListener((event) => {
                if (isMounted()) {
                    setProgression(event.loaded / event.total);
                }
            });
        }
    }, []);

    const nameRaw = `${attachment ? attachment.Name || '' : pendingUpload?.file.name || ''}`;
    const name = rtlSanitize(nameRaw);
    const value = Math.round(progression * 100);
    const progressionHappening = progression !== 0;
    const directionLoadingProgress = isRTL ? 'left' : 'right';
    const backgroundImage =
        progression === 0
            ? 'none'
            : `linear-gradient(to ${directionLoadingProgress}, var(--signal-info) 0%, var(--signal-info) ${value}%, transparent ${value}%)`;
    const humanAttachmentSize = progressionHappening === false ? `(${humanSize(attachment?.Size)})` : ``;

    const primaryTitle = `${name} ${humanAttachmentSize}${getSenderVerificationString(attachmentVerified)}`;
    const primaryActionTitle = getActionTitle(primaryAction, primaryTitle);

    const showSecondaryAction = secondaryAction !== AttachmentAction.None;
    const secondaryActionIcon = getActionIcon(secondaryAction);
    const secondaryActionTitle = getActionTitle(secondaryAction, name);

    const handleAction = (primary: boolean) => () => {
        const actionHandler = primary ? onPrimary : onSecondary;
        let action = Promise.resolve();

        if (attachment) {
            const attachmentHandler = actionHandler as (attachment: Attachment) => Promise<void>;
            action = attachmentHandler(attachment);
        }
        if (pendingUpload) {
            const uploadHandler = actionHandler as (pendingUpload: PendingUpload) => Promise<void>;
            action = uploadHandler(pendingUpload);
        }

        void withLoading(action);
    };

    return (
        <div className="message-attachmentList-item-container" data-testid="attachment-item">
            <div
                style={{ backgroundImage }}
                className={classnames([
                    'message-attachmentList-item flex bordered flex-nowrap pm_button p0',
                    progressionHappening && 'message-attachmentList-item--uploadInProgress',
                    loading && 'message-attachmentList-item--loading',
                ])}
            >
                <span className="relative flex flex-item-fluid message-attachmentPrimaryAction interactive">
                    <button
                        className="pl0-5 pt0-5 pb0-5 flex flex-item-noshrink message-attachmentTypeIcon"
                        type="button"
                        onClick={handleAction(true)}
                        tabIndex={-1}
                    >
                        <FileIcon mimeType={attachment?.MIMEType || pendingUpload?.file?.type || 'unknown'} size={20} />
                    </button>
                    <button
                        className="flex-item-fluid flex flex-nowrap pr0-5"
                        title={primaryActionTitle}
                        type="button"
                        onClick={handleAction(true)}
                    >
                        <span className="mtauto mbauto flex flex-align-items-center flex-nowrap">
                            <span className="text-ellipsis pr0-25 align-baseline inline-block">
                                <FileNameDisplay text={name} />
                            </span>
                            <span className="message-attachmentSize align-baseline inline-block flex-item-noshrink">
                                {humanAttachmentSize}
                            </span>
                        </span>
                    </button>
                </span>
                {showSecondaryAction && (
                    <button
                        type="button"
                        className="inline-flex p0-5 no-pointer-events-children flex-item-noshrink border-left message-attachmentSecondaryAction interactive"
                        onClick={handleAction(false)}
                        title={secondaryActionTitle}
                        disabled={loading}
                        aria-busy={loading}
                    >
                        {loading ? (
                            <CircleLoader className="icon-16p mauto" />
                        ) : (
                            <>
                                <Icon name={secondaryActionIcon} className="mauto" />
                                <span className="sr-only">{secondaryActionTitle}</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default AttachmentItem;
