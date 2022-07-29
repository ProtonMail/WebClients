import { useEffect, useState } from 'react';

import { c } from 'ttag';

import {
    CircleLoader,
    CircularProgress,
    FileIcon,
    FileNameDisplay,
    Icon,
    classnames,
    useLoading,
} from '@proton/components';
import useIsMounted from '@proton/hooks/useIsMounted';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { PendingUpload } from '../../hooks/composer/useAttachments';
import { AttachmentAction, AttachmentHandler } from './AttachmentList';

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
    const progressionHappening = progression !== 0 || !!pendingUpload;
    const humanAttachmentSize = progressionHappening ? `` : humanSize(attachment?.Size);

    const primaryTitle = `${name} ${humanAttachmentSize}${getSenderVerificationString(attachmentVerified)}`;
    const primaryActionTitle = getActionTitle(primaryAction, primaryTitle);

    const showSecondaryAction = secondaryAction !== AttachmentAction.None;
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

    const actionIcon = {
        [AttachmentAction.Download]: 'arrow-down-line',
        [AttachmentAction.Preview]: 'arrows-from-center',
        [AttachmentAction.Remove]: 'cross',
    } as const;

    return (
        <div className="message-attachmentList-item-container" data-testid="attachment-item">
            <div
                className={classnames([
                    'message-attachmentList-item flex border flex-nowrap pm_button p0 rounded overflow-hidden',
                    loading && 'message-attachmentList-item--loading',
                ])}
            >
                <span className="relative flex flex-item-fluid message-attachmentPrimaryAction interactive">
                    <button
                        className="pl0-5 pt0-5 pb0-5 flex flex-item-noshrink message-attachmentTypeIcon"
                        type="button"
                        onClick={handleAction(true)}
                        tabIndex={-1}
                        aria-hidden="true"
                    >
                        {progressionHappening ? (
                            <CircularProgress progress={value} size={20} className="mr0-5" />
                        ) : (
                            <FileIcon mimeType={attachment?.MIMEType || 'unknown'} size={20} className="mr0-5" />
                        )}
                    </button>
                    <button
                        className="flex-item-fluid flex flex-nowrap"
                        title={primaryActionTitle}
                        type="button"
                        onClick={handleAction(true)}
                    >
                        <span className="mtauto mbauto flex flex-align-items-baseline flex-nowrap pr0-5">
                            <FileNameDisplay text={name} />
                            <span
                                className="message-attachmentSize sr-only align-baseline inline-block flex-item-noshrink ml0-25"
                                data-testid="attachment-item:size"
                            >
                                {humanAttachmentSize}
                            </span>
                        </span>
                    </button>
                </span>
                {showSecondaryAction && (
                    <button
                        type="button"
                        className="inline-flex p0-5 pl0-25 no-pointer-events-children relative flex-item-noshrink message-attachmentSecondaryAction interactive"
                        onClick={handleAction(false)}
                        title={secondaryActionTitle}
                        disabled={loading}
                        aria-busy={loading}
                    >
                        <span className="message-attachmentSecondaryAction-size color-weak" aria-hidden="true">
                            {humanAttachmentSize}
                        </span>
                        <span className="message-attachmentSecondaryAction-download flex">
                            {loading ? (
                                <CircleLoader className="mauto" size="small" />
                            ) : (
                                <Icon name={actionIcon[secondaryAction]} className="mauto" alt={secondaryActionTitle} />
                            )}
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default AttachmentItem;
