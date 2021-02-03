import { Attachment, Message } from 'proton-shared/lib/interfaces/mail/Message';
import { attachmentsSize } from 'proton-shared/lib/mail/messages';
import React, { useEffect, useRef, useState } from 'react';
import { c, msgid } from 'ttag';
import { Icon, classnames } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { diff } from 'proton-shared/lib/helpers/array';

import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import AttachmentItem from './AttachmentItem';
import { EmbeddedMap, MessageExtendedWithData } from '../../models/message';
import { PendingUpload } from '../../hooks/composer/useAttachments';
import { useDownload, useDownloadAll } from '../../hooks/useDownload';
import AttachmentPreview, { AttachmentPreviewControls } from './AttachmentPreview';

export enum AttachmentAction {
    Download,
    Preview,
    Remove,
    None,
}

export type AttachmentHandler =
    | ((attachment: Attachment) => Promise<void>)
    | ((pendingUpload: PendingUpload) => Promise<void>);

interface Props {
    attachments: Attachment[];
    pendingUploads?: PendingUpload[];
    embeddeds?: EmbeddedMap;
    message: MessageExtendedWithData;
    primaryAction: AttachmentAction;
    secondaryAction: AttachmentAction;
    collapsable: boolean;
    showDownloadAll: boolean;
    onRemoveAttachment?: (attachment: Attachment) => Promise<void>;
    onRemoveUpload?: (pendingUpload: PendingUpload) => Promise<void>;
    className?: string;
}

const AttachmentList = ({
    attachments,
    pendingUploads,
    embeddeds,
    message,
    primaryAction,
    secondaryAction,
    collapsable,
    showDownloadAll,
    onRemoveAttachment,
    onRemoveUpload,
    className,
}: Props) => {
    const download = useDownload();
    const downloadAll = useDownloadAll();

    const [showLoader, setShowLoader] = useState(false);
    const [showInstant, setShowInstant] = useState(false);

    const [expanded, setExpanded] = useState(!collapsable);
    const [verifiedAttachments, setVerifiedAttachments] = useState<SimpleMap<VERIFICATION_STATUS>>({});

    const previewRef = useRef<AttachmentPreviewControls>();

    useEffect(() => {
        if (pendingUploads !== undefined) {
            setExpanded(pendingUploads.length > 0);
        }
    }, [pendingUploads]);

    const size = attachmentsSize({ Attachments: attachments } as Message);
    const sizeLabel = humanSize(size);

    const embeddedAttachments = [...(embeddeds?.values() || [])].map(({ attachment }) => attachment);
    const pureAttachments = diff(attachments, embeddedAttachments);

    const pureAttachmentsCount = pureAttachments.length;
    const embeddedAttachmentsCount = embeddedAttachments.length;
    const attachmentsCount = pureAttachmentsCount + embeddedAttachmentsCount;

    const handleToggleExpand = () => {
        if (collapsable) {
            setExpanded(!expanded);
        }
    };

    const handleDownload = async (attachment: Attachment) => {
        const verificationStatus = await download(message, attachment);
        setVerifiedAttachments((verifiedAttachments) => {
            return {
                ...verifiedAttachments,
                [attachment.ID || '']: verificationStatus,
            };
        });
    };

    const handlePreview = async (attachment: Attachment) => previewRef.current?.preview(attachment);

    const handlePreviewDownload = (attachment: Attachment, verificationStatus: VERIFICATION_STATUS) => {
        setVerifiedAttachments((verifiedAttachments) => {
            return {
                ...verifiedAttachments,
                [attachment.ID || '']: verificationStatus,
            };
        });
    };

    const handleDownloadAll = async () => {
        setShowLoader(true);
        try {
            await downloadAll(message);
        } catch (error) {
            // Notification is handled by the hook
            console.log('error', error);
        } finally {
            setShowLoader(false);
            setShowInstant(true);
        }
    };

    const noop = () => Promise.resolve();

    const actions = {
        [AttachmentAction.Download]: handleDownload,
        [AttachmentAction.Preview]: handlePreview,
        [AttachmentAction.Remove]: onRemoveAttachment || noop,
        [AttachmentAction.None]: noop,
    };

    const titleButton = collapsable
        ? expanded
            ? c('Action').t`Hide attachment details`
            : c('Action').t`Show attachment details`
        : undefined;
    const TagButton = collapsable ? 'button' : 'div';

    return (
        <div className={classnames(['flex flex-column relative w100 flex-nowrap', className])}>
            <AttachmentPreview
                ref={previewRef}
                attachments={attachments}
                message={message}
                onDownload={handlePreviewDownload}
            />
            <div className="flex flex-row flex-justify-space-between w100 p0-5">
                <TagButton
                    type="button"
                    title={titleButton}
                    tabIndex={-1}
                    className="flex flex-align-items-center no-outline"
                    onClick={handleToggleExpand}
                >
                    {size !== 0 && <strong className="mr0-5">{sizeLabel}</strong>}
                    {pureAttachmentsCount > 0 && (
                        <span className="mr0-5">
                            <Icon name="attach" className="mr0-25" />
                            <span>{pureAttachmentsCount}</span>&nbsp;
                            <span className="no-mobile">
                                {c('Info').ngettext(msgid`file attached`, `files attached`, pureAttachmentsCount)}
                            </span>
                        </span>
                    )}
                    {embeddedAttachmentsCount > 0 && (
                        <span className="mr0-5 inline-flex flex-align-items-center">
                            <Icon name="file-image" className="mr0-25" />
                            <span>{embeddedAttachmentsCount}</span>&nbsp;
                            <span className="no-mobile">
                                {c('Info').ngettext(msgid`embedded image`, `embedded images`, embeddedAttachmentsCount)}
                            </span>
                        </span>
                    )}
                </TagButton>
                {collapsable && (
                    <button
                        type="button"
                        title={titleButton}
                        aria-label={titleButton}
                        className="color-primary no-outline"
                        onClick={handleToggleExpand}
                    >
                        {expanded ? c('Action').t`Hide` : c('Action').t`Show`}
                    </button>
                )}
                {showDownloadAll && attachmentsCount > 0 && (
                    <div>
                        <button
                            type="button"
                            onClick={handleDownloadAll}
                            className="link text-strong mr0-5"
                            disabled={!message.initialized}
                        >
                            {c('Download attachments').t`Download all`}
                        </button>
                        {(showInstant || showLoader) && (
                            <Icon name={showInstant ? 'download' : ''} aria-busy={showLoader} />
                        )}
                    </div>
                )}
            </div>
            {expanded && ( // composer-attachments-expand pt1 pb0-5
                <div tabIndex={-1} className="flex flex-row flex-wrap message-attachmentList pl0-5 pr0-5 pb0-5">
                    {attachments.map((attachment) => (
                        <AttachmentItem
                            key={attachment.ID}
                            attachment={attachment}
                            attachmentVerified={verifiedAttachments[attachment.ID || '']}
                            primaryAction={primaryAction}
                            secondaryAction={secondaryAction}
                            onPrimary={actions[primaryAction]}
                            onSecondary={actions[secondaryAction]}
                        />
                    ))}
                    {pendingUploads?.map((pendingUpload) => (
                        <AttachmentItem
                            key={pendingUpload.file.name}
                            pendingUpload={pendingUpload}
                            primaryAction={primaryAction}
                            secondaryAction={AttachmentAction.Remove}
                            onPrimary={noop}
                            onSecondary={onRemoveUpload || noop}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AttachmentList;
