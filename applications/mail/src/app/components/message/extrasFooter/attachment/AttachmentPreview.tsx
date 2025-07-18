import type { MutableRefObject, Ref } from 'react';
import { forwardRef, useEffect, useRef, useState } from 'react';

import { FilePreview, NavigationControl } from '@proton/components';
import Portal from '@proton/components/components/portal/Portal';
import type { MessageStateWithData, OutsideKey } from '@proton/mail/store/messages/messagesTypes';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { useDownload, usePreview } from '../../../../hooks/attachments/useDownload';

export interface AttachmentPreviewControls {
    preview: (attachment: Attachment) => void;
}

interface Preview {
    attachment: Attachment;
    contents?: Uint8Array[];
}

interface Props {
    attachments: Attachment[];
    message: MessageStateWithData;
    onDownload: (attachment: Attachment, verificationStatus: MAIL_VERIFICATION_STATUS) => void;
    outsideKey?: OutsideKey;
}

const AttachmentPreview = (
    { attachments, message, onDownload, outsideKey }: Props,
    ref: Ref<AttachmentPreviewControls | undefined>
) => {
    const { handlePreview: preview, confirmDownloadModal: confirmPreviewModal } = usePreview();
    const { handleDownload: download, confirmDownloadModal } = useDownload();

    const [previewing, setPreviewing] = useState<Preview>();

    const rootRef = useRef<HTMLDivElement>(null);

    const handlePreview = async (attachment: Attachment) => {
        setPreviewing({
            attachment,
        });
        const download = await preview(message, attachment, outsideKey);
        setPreviewing((previewing) => {
            // Preview can be closed or changed during download;
            if (previewing === undefined || previewing.attachment !== attachment) {
                return previewing;
            }

            // Don't preview unverified attachment
            if (download.verificationStatus === MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID) {
                return {
                    // Overriding mime type to prevent opening any visualizer with empty data, especially needed for pdfs
                    attachment: { ...attachment, MIMEType: '' },
                    contents: [],
                };
            }

            return { ...previewing, contents: [download.data] };
        });

        onDownload(attachment, download.verificationStatus);
    };

    useEffect(() => {
        (ref as MutableRefObject<AttachmentPreviewControls>).current = {
            preview: handlePreview,
        };
    });

    if (!previewing) {
        return null;
    }

    const current = attachments.findIndex((attachment) => attachment.ID === previewing.attachment.ID) + 1;
    const total = attachments.length;

    const handleNext = () => handlePreview(attachments[current]);
    const handlePrevious = () => handlePreview(attachments[current - 2]);
    const handleClose = () => setPreviewing(undefined);
    const handleDownload = async () => {
        const { attachment } = previewing;
        const verificationStatus = await download(message, attachment, outsideKey);
        onDownload(attachment, verificationStatus);
    };

    return (
        <Portal>
            <FilePreview
                isLoading={!previewing.contents}
                contents={previewing.contents}
                fileName={previewing.attachment?.Name}
                mimeType={previewing.attachment?.MIMEType}
                fileSize={previewing.attachment?.Size}
                onClose={handleClose}
                onDownload={handleDownload}
                ref={rootRef}
                navigationControls={
                    <NavigationControl
                        current={current}
                        total={total}
                        rootRef={rootRef}
                        onNext={handleNext}
                        onPrev={handlePrevious}
                    />
                }
            />
            {confirmPreviewModal}
            {confirmDownloadModal}
        </Portal>
    );
};

export default forwardRef(AttachmentPreview);
