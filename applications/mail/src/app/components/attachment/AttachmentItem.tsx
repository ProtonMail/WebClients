import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { CircularProgress, FileIcon, FileNameDisplay, Icon } from '@proton/components';
import { useLoading } from '@proton/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import clsx from '@proton/utils/clsx';

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
                className={clsx([
                    'message-attachmentList-item flex border flex-nowrap pm_button p-0 rounded overflow-hidden',
                    loading && 'message-attachmentList-item--loading',
                ])}
            >
                <span className="relative flex flex-item-fluid message-attachmentPrimaryAction interactive">
                    <button
                        className="pl-2 py-2 flex flex-item-noshrink message-attachmentTypeIcon"
                        type="button"
                        onClick={handleAction(true)}
                        tabIndex={-1}
                        aria-hidden="true"
                    >
                        {progressionHappening ? (
                            <CircularProgress progress={value} size={20} className="mr-2" />
                        ) : (
                            <FileIcon mimeType={attachment?.MIMEType || 'unknown'} size={20} className="mr-2" />
                        )}
                    </button>
                    <button
                        className="flex-item-fluid flex flex-nowrap"
                        title={primaryActionTitle}
                        type="button"
                        onClick={handleAction(true)}
                        data-testid={`attachment-item:${name}--primary-action`}
                    >
                        <span className="my-auto flex flex-align-items-baseline flex-nowrap pr-2">
                            <FileNameDisplay text={name} />
                            <span
                                className="message-attachmentSize sr-only align-baseline inline-block flex-item-noshrink ml-1"
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
                        className="inline-flex p-2 pl-1 no-pointer-events-children relative flex-item-noshrink message-attachmentSecondaryAction interactive"
                        onClick={handleAction(false)}
                        title={secondaryActionTitle}
                        disabled={loading}
                        aria-busy={loading}
                        data-testid={`attachment-item:${name}--secondary-action`}
                    >
                        <span className="message-attachmentSecondaryAction-size color-weak" aria-hidden="true">
                            {humanAttachmentSize}
                        </span>
                        <span className="message-attachmentSecondaryAction-download flex">
                            {loading ? (
                                <CircleLoader className="m-auto" size="small" />
                            ) : (
                                <Icon
                                    name={actionIcon[secondaryAction]}
                                    className="m-auto"
                                    alt={secondaryActionTitle}
                                />
                            )}
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default AttachmentItem;
