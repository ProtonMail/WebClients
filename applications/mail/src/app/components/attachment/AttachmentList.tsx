import { useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { FeatureCode, Icon, Tooltip, useFeature } from '@proton/components';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import type { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import clsx from '@proton/utils/clsx';

import { useHasScroll } from 'proton-mail/hooks/useHasScroll';

import { getAttachmentCounts } from '../../helpers/message/messages';
import { useDownload, useDownloadAll } from '../../hooks/attachments/useDownload';
import type { PendingUpload } from '../../hooks/composer/useAttachments';
import type { MessageStateWithData, OutsideKey } from '../../store/messages/messagesTypes';
import AttachmentItem from './AttachmentItem';
import type { AttachmentPreviewControls } from './AttachmentPreview';
import AttachmentPreview from './AttachmentPreview';

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
    onRemoveAttachment?: (attachment: Attachment) => Promise<void>;
    onRemoveUpload?: (pendingUpload: PendingUpload) => Promise<void>;
    className?: string;
    outsideKey?: OutsideKey;
    noPaddingTop?: boolean;
}

const AttachmentList = ({
    attachments,
    pendingUploads = [],
    message,
    primaryAction,
    secondaryAction,
    collapsable,
    onRemoveAttachment,
    onRemoveUpload,
    className,
    outsideKey,
    noPaddingTop = false,
    ...rest
}: Props) => {
    const { handleDownload: download, confirmDownloadModal } = useDownload();
    const { handleDownloadAll: downloadAll, confirmDownloadModal: confirmDownloadAllModal } = useDownloadAll();

    const [showLoader, setShowLoader] = useState(false);

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
            // Download single attachment without a zip file
            if (attachments.length === 1) {
                await handleDownload(attachments[0]);
            } else {
                await downloadAll(message, outsideKey);
            }
        } catch (error: any) {
            // Notification is handled by the hook
            console.log('error', error);
        } finally {
            setShowLoader(false);
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

    const canShowDownloadAll = isNumAttachmentsWithoutEmbedded ? pureAttachmentsCount > 0 : attachmentsCount > 0;

    const attachmentsToShow = isNumAttachmentsWithoutEmbedded ? pureAttachments : attachments;

    const noPadding = noPaddingTop && !expanded;

    const refAttachments = useRef<HTMLDivElement>(null);
    const [hasVerticalScroll] = useHasScroll(refAttachments, [expanded]);

    return (
        <div className={clsx(['flex flex-column relative w-full flex-nowrap mb-2', className])} {...rest}>
            <AttachmentPreview
                ref={previewRef}
                attachments={attachmentsToShow}
                message={message}
                onDownload={handlePreviewDownload}
                outsideKey={outsideKey}
            />
            <div
                className={clsx([
                    'flex flex-row w-full justify-space-between composer-attachment-list-wrapper',
                    !noPadding && 'pb-1',
                    !expanded && 'mb-2',
                ])}
                data-testid="attachment-list:header"
            >
                <TagButton
                    type="button"
                    title={titleButton}
                    tabIndex={-1}
                    className="flex items-center outline-none"
                    onClick={handleToggleExpand}
                >
                    {size !== 0 && (
                        <strong className="mr-2" data-testid="attachment-list:size">
                            {sizeLabel}
                        </strong>
                    )}
                    {pureAttachmentsCount > 0 && (
                        <span className="mr-2 color-weak">
                            <span data-testid="attachment-list:pure-attachment-number">{pureAttachmentsCount}</span>
                            &nbsp;
                            <span>
                                {c('Info').ngettext(msgid`file attached`, `files attached`, pureAttachmentsCount)}
                                {embeddedAttachmentsCount > 0 && ','}
                            </span>
                        </span>
                    )}
                    {embeddedAttachmentsCount > 0 && (
                        <span className="mr-2 color-weak">
                            <span data-testid="attachment-list:embedded-number">{embeddedAttachmentsCount}</span>&nbsp;
                            <span>
                                {c('Info').ngettext(msgid`embedded image`, `embedded images`, embeddedAttachmentsCount)}
                            </span>
                        </span>
                    )}
                    {showCollapseButton && (
                        <span className="link align-baseline text-left mr-2" data-testid="attachment-list:toggle">
                            {expanded ? c('Action').t`Hide` : c('Action').t`Show`}
                        </span>
                    )}
                </TagButton>
                {canShowDownloadAll && (
                    <div className="shrink-0">
                        <Tooltip title={c('Download attachments').t`Download all`} originalPlacement="top">
                            <Button
                                icon
                                color="weak"
                                shape="ghost"
                                onClick={handleDownloadAll}
                                disabled={!message.messageDocument?.initialized}
                                className="ml-2"
                                loading={showLoader}
                                size="small"
                                data-testid="attachment-list:download-all"
                            >
                                <Icon name="arrow-down-line" alt={c('Download attachments').t`Download all`} />
                            </Button>
                        </Tooltip>
                    </div>
                )}
            </div>
            {expanded && ( // composer-attachments-expand pt-4 pb-2
                <div
                    tabIndex={-1}
                    ref={refAttachments}
                    className={clsx([
                        'message-attachmentList scrollbar-gutter-stable py-2',
                        hasVerticalScroll && 'border-top border-bottom border-weak',
                    ])}
                >
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
            {confirmDownloadModal}
            {confirmDownloadAllModal}
        </div>
    );
};

export default AttachmentList;
