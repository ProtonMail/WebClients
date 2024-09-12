import { useRef, useState } from 'react';

import { FilePreview, NavigationControl, Tooltip } from '@proton/components';
import Portal from '@proton/components/components/portal/Portal';
import type { AttachmentsMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import clsx from '@proton/utils/clsx';

import AttachmentThumbnail from 'proton-mail/components/list/AttachmentThumbnail';
import { MAX_COLUMN_ATTACHMENT_THUMBNAILS } from 'proton-mail/constants';
import { getOtherAttachmentsTitle } from 'proton-mail/helpers/attachment/attachmentThumbnails';
import { useAttachmentThumbnailDownload } from 'proton-mail/hooks/attachments/useAttachmentThumbnailDownload';

interface Preview {
    attachment: AttachmentsMetadata;
    contents?: Uint8Array[];
}

interface Props {
    attachmentsMetadata?: AttachmentsMetadata[];
    maxAttachment?: number;
    className?: string;
}

/**
 * This component is close to AttachmentPreview.tsx for the preview and download part.
 * Some parts are duplicated on purpose because the download logic is quite different with the one we have in the attachment list.
 * It will need a refactor to merge some logic, but it needs a refactor on the old download logic first.
 */
const ItemAttachmentThumbnails = ({
    attachmentsMetadata = [],
    maxAttachment = MAX_COLUMN_ATTACHMENT_THUMBNAILS,
    className,
}: Props) => {
    const [previewing, setPreviewing] = useState<Preview>();
    const otherAttachmentNumber = attachmentsMetadata?.length - maxAttachment;
    const { handleThumbnailPreview, handleThumbnailDownload, confirmDownloadModal } = useAttachmentThumbnailDownload();

    const rootRef = useRef<HTMLDivElement>(null);

    const handlePreview = async (attachmentsMetadata: AttachmentsMetadata) => {
        setPreviewing({ attachment: attachmentsMetadata });

        const download = await handleThumbnailPreview(attachmentsMetadata);

        setPreviewing((previewing) => {
            // Preview can be closed or changed during download;
            // In attachment list, we do have the full attachment, so we can make sure the preview is the attachment (previewing.attachment !== attachment)
            // Here we do not have it, so we can check that name and size are equals
            if (
                previewing === undefined ||
                !(
                    previewing.attachment.Name === attachmentsMetadata.Name &&
                    previewing.attachment.Size === attachmentsMetadata.Size
                )
            ) {
                return previewing;
            }

            // Don't preview unverified attachment
            if (download.verified === VERIFICATION_STATUS.SIGNED_AND_INVALID) {
                return {
                    // Overriding mime type to prevent opening any visualizer with empty data, especially needed for pdfs
                    attachment: { ...attachmentsMetadata, MIMEType: '' },
                    contents: [],
                };
            }

            return {
                attachment: {
                    ...previewing.attachment,
                    // Reuse download MIMEType because we update it in some cases (e.g. errors during decryption)
                    // If undefined, default to attachmentMetadata mimeType, otherwise use the download value (which can be an empty string)
                    MIMEType:
                        download.attachment.MIMEType === undefined
                            ? previewing.attachment.MIMEType
                            : download.attachment.MIMEType,
                },
                contents: [download.data],
            };
        });
    };

    const otherAttachmentsTitle = getOtherAttachmentsTitle(attachmentsMetadata, maxAttachment);

    const current = attachmentsMetadata.findIndex(
        (attachmentMetadata) => attachmentMetadata.ID === previewing?.attachment.ID
    );
    const total = attachmentsMetadata.length;

    const handleNext = () => handlePreview(attachmentsMetadata[current + 1]);
    const handlePrevious = () => handlePreview(attachmentsMetadata[current - 1]);
    const handleClose = () => setPreviewing(undefined);
    const handleDownload = async () => {
        if (previewing && previewing.attachment) {
            const { attachment } = previewing;
            await handleThumbnailDownload(attachment);
        }
    };

    return (
        <>
            <div
                data-testid="attachment-thumbnails"
                className={clsx('flex flex-nowrap gap-2 attachment-thumbnail-grid', className)}
            >
                {attachmentsMetadata?.slice(0, maxAttachment).map((attachmentMetadata) => {
                    return (
                        <AttachmentThumbnail
                            attachmentMetadata={attachmentMetadata}
                            onClick={handlePreview}
                            key={attachmentMetadata.ID}
                            data-testid="attachment-thumbnail"
                        />
                    );
                })}

                {otherAttachmentNumber > 0 && (
                    <span
                        className="rounded text-sm flex shrink-0 items-center flex-nowrap attachment-thumbnail attachment-thumbnail--number"
                        data-testid="attachment-thumbnail:other-attachment-number"
                    >
                        <Tooltip title={otherAttachmentsTitle} originalPlacement="bottom">
                            <span className="lh100">+{otherAttachmentNumber}</span>
                        </Tooltip>
                    </span>
                )}
            </div>

            {previewing && (
                // Need an additional div to:
                <div
                    // 1. prevent the event propagation (a click inside the portal would open the message)
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    // 2. prevent the context menu to be opened on the message in Safari
                    onContextMenu={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <Portal>
                        <FilePreview
                            isLoading={!previewing.contents}
                            contents={previewing.contents}
                            fileName={previewing.attachment?.Name}
                            mimeType={previewing.attachment?.MIMEType}
                            fileSize={previewing.attachment?.Size}
                            onClose={handleClose}
                            ref={rootRef}
                            onDownload={handleDownload}
                            navigationControls={
                                <NavigationControl
                                    current={current + 1}
                                    total={total}
                                    rootRef={rootRef}
                                    onNext={handleNext}
                                    onPrev={handlePrevious}
                                />
                            }
                        />
                    </Portal>

                    {confirmDownloadModal}
                </div>
            )}
        </>
    );
};

export default ItemAttachmentThumbnails;
