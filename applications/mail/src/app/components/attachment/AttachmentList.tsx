import { useEffect, useRef, useState } from 'react';
import { c, msgid } from 'ttag';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { Icon, classnames, CircleLoader, useFeature, FeatureCode } from '@proton/components';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import AttachmentItem from './AttachmentItem';
import { PendingUpload } from '../../hooks/composer/useAttachments';
import { useDownload, useDownloadAll } from '../../hooks/useDownload';
import AttachmentPreview, { AttachmentPreviewControls } from './AttachmentPreview';
import { getAttachmentCounts } from '../../helpers/message/messages';
import { MessageStateWithData, OutsideKey } from '../../logic/messages/messagesTypes';

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
    message: MessageStateWithData;
    primaryAction: AttachmentAction;
    secondaryAction: AttachmentAction;
    collapsable: boolean;
    showDownloadAll: boolean;
    onRemoveAttachment?: (attachment: Attachment) => Promise<void>;
    onRemoveUpload?: (pendingUpload: PendingUpload) => Promise<void>;
    className?: string;
    outsideKey?: OutsideKey;
}

const AttachmentList = ({
    attachments,
    pendingUploads = [],
    message,
    primaryAction,
    secondaryAction,
    collapsable,
    showDownloadAll,
    onRemoveAttachment,
    onRemoveUpload,
    className,
    outsideKey,
}: Props) => {
    const download = useDownload();
    const downloadAll = useDownloadAll();

    const [showLoader, setShowLoader] = useState(false);
    const [showInstant, setShowInstant] = useState(false);

    const [expanded, setExpanded] = useState(!collapsable);
    const [manuallyExpanded, setManuallyExpanded] = useState(false);
    const [verifiedAttachments, setVerifiedAttachments] = useState<SimpleMap<VERIFICATION_STATUS>>({});

    const previewRef = useRef<AttachmentPreviewControls>();

    const isNumAttachmentsWithoutEmbedded = useFeature(FeatureCode.NumAttachmentsWithoutEmbedded).feature?.Value;

    const { size, sizeLabel, pureAttachments, pureAttachmentsCount, embeddedAttachmentsCount, attachmentsCount } =
        getAttachmentCounts(attachments, message.messageImages);

    useEffect(() => {
        const dontCloseAfterUploadsWhenExpandedManually = manuallyExpanded && pendingUploads.length === 0;

        if (isNumAttachmentsWithoutEmbedded) {
            /*
                Dont close the attachment list when manually expanded AND there are pure attachment left.
                Otherwise, if we still have attachment, but which are not pureAttachment (embedded images), the list will remain open.
                But in reality, the attachment list to display is empty because we do not display embedded images in the list anymore.
            */
            if ((dontCloseAfterUploadsWhenExpandedManually || collapsable === false) && pureAttachmentsCount > 0) {
                return;
            }

            if (pureAttachmentsCount <= 0 && !(pendingUploads.length > 0)) {
                // If attachment length is changing, and we don't have pure attachments anymore, close the attachment list
                setExpanded(false);
                return;
            }
        } else if (dontCloseAfterUploadsWhenExpandedManually || collapsable === false) {
            return;
        }

        setExpanded(pendingUploads.length > 0);
    }, [pendingUploads, attachments]);

    // We want to show the collapse button while uploading files. When all files are uploaded, we don't want to see it if attachments are embedded images only
    const showCollapseButton = isNumAttachmentsWithoutEmbedded
        ? collapsable && (pureAttachmentsCount > 0 || (pendingUploads?.length ? pendingUploads.length : 0) > 0)
        : collapsable;

    const handleToggleExpand = () => {
        const canToggleExpand = isNumAttachmentsWithoutEmbedded ? collapsable && pureAttachmentsCount > 0 : collapsable;
        if (canToggleExpand) {
            setExpanded(!expanded);
            setManuallyExpanded(!expanded);
        }
    };

    const handleDownload = async (attachment: Attachment) => {
        const verificationStatus = await download(message, attachment, outsideKey);
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
            await downloadAll(message, outsideKey);
        } catch (error: any) {
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

    const canShowDownloadAll = isNumAttachmentsWithoutEmbedded
        ? showDownloadAll && pureAttachmentsCount > 0
        : showDownloadAll && attachmentsCount > 0;

    const attachmentsToShow = isNumAttachmentsWithoutEmbedded ? pureAttachments : attachments;

    return (
        <div
            className={classnames(['flex flex-column relative w100 flex-nowrap', className, expanded && 'border-top'])}
        >
            <AttachmentPreview
                ref={previewRef}
                attachments={attachmentsToShow}
                message={message}
                onDownload={handlePreviewDownload}
                outsideKey={outsideKey}
            />
            <div
                className="flex flex-row w100 p0-5 flex-justify-space-between composer-attachment-list-wrapper"
                data-testid="attachments-header"
            >
                <TagButton
                    type="button"
                    title={titleButton}
                    tabIndex={-1}
                    className="flex flex-align-items-center outline-none"
                    onClick={handleToggleExpand}
                >
                    {size !== 0 && <strong className="mr0-5">{sizeLabel}</strong>}
                    {pureAttachmentsCount > 0 && (
                        <span className="mr0-5">
                            <Icon name="paperclip" className="mr0-25" />
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
                    {showCollapseButton && (
                        <span className="link align-baseline text-left mr0-5">
                            {expanded ? c('Action').t`Hide` : c('Action').t`Show`}
                        </span>
                    )}
                </TagButton>
                {canShowDownloadAll && (
                    <div>
                        <button
                            type="button"
                            onClick={handleDownloadAll}
                            className="link text-strong"
                            disabled={!message.messageDocument?.initialized}
                        >
                            {c('Download attachments').t`Download all`}
                        </button>
                        {showInstant && <Icon className="ml0-5" name="arrow-down-to-rectangle" />}
                        {showLoader && <CircleLoader className="icon-16p ml0-5" />}
                    </div>
                )}
            </div>
            {expanded && ( // composer-attachments-expand pt1 pb0-5
                <div tabIndex={-1} className="flex flex-row flex-wrap message-attachmentList pl0-5 pr0-5 pb0-5">
                    {attachmentsToShow.map((attachment) => (
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
