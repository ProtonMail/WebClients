import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import React, { forwardRef, MutableRefObject, Ref, useEffect, useState } from 'react';
import { FilePreview, NavigationControl } from 'react-components';
import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import { MessageExtendedWithData } from '../../models/message';
import { useDownload, usePreview } from '../../hooks/useDownload';

export interface AttachmentPreviewControls {
    preview: (attachment: Attachment) => void;
}

interface Preview {
    attachment: Attachment;
    contents?: Uint8Array[];
}

interface Props {
    attachments: Attachment[];
    message: MessageExtendedWithData;
    onDownload: (attachment: Attachment, verificationStatus: VERIFICATION_STATUS) => void;
}

const AttachmentPreview = (
    { attachments, message, onDownload }: Props,
    ref: Ref<AttachmentPreviewControls | undefined>
) => {
    const preview = usePreview();
    const download = useDownload();

    const [previewing, setPreviewing] = useState<Preview>();

    const handlePreview = async (attachment: Attachment) => {
        setPreviewing({
            attachment,
        });
        const download = await preview(message, attachment);
        setPreviewing((previewing) => {
            // Preview can be closed or changed during download;
            if (previewing === undefined || previewing.attachment !== attachment) {
                return previewing;
            }

            // Don't preview unverified attachment
            if (download.verified === VERIFICATION_STATUS.SIGNED_AND_INVALID) {
                return {
                    // Overriding mime type to prevent opening any visualizer with empty data, especially needed for pdfs
                    attachment: { ...attachment, MIMEType: '' },
                    contents: [],
                };
            }

            return { ...previewing, contents: [download.data] };
        });
        onDownload(attachment, download.verified);
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
        const verificationStatus = await download(message, attachment);
        onDownload(attachment, verificationStatus);
    };

    return (
        <FilePreview
            loading={!previewing.contents}
            contents={previewing.contents}
            fileName={previewing.attachment?.Name}
            mimeType={previewing.attachment?.MIMEType}
            onClose={handleClose}
            onSave={handleDownload}
            navigationControls={
                <NavigationControl current={current} total={total} onNext={handleNext} onPrev={handlePrevious} />
            }
        />
    );
};

export default forwardRef(AttachmentPreview);
