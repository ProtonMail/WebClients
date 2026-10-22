import type { MouseEvent } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import MiddleEllipsis from '@proton/components/components/ellipsis/MiddleEllipsis';
import { getFileIcon } from '@proton/file-icons/getFileIcon';
import type { AttachmentsMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import './AttachmentThumbnail.scss';

interface Props {
    attachmentMetadata: AttachmentsMetadata;
    onClick: (attachmentsMetadata: AttachmentsMetadata) => void;
}

const AttachmentThumbnail = ({ attachmentMetadata, onClick, ...rest }: Props) => {
    const handleClick = (e: MouseEvent) => {
        e.stopPropagation();
        onClick(attachmentMetadata);
    };

    const AttachmentIcon = getFileIcon(attachmentMetadata?.MIMEType || 'unknown');

    return (
        <Button
            shape="outline"
            onClick={handleClick}
            className="text-sm flex items-center flex-nowrap gap-2 attachment-thumbnail"
            {...rest}
        >
            <AttachmentIcon className="shrink-0" />
            <span className="lh100 attachment-thumbnail-name">
                <MiddleEllipsis charsToDisplayEnd={3} text={attachmentMetadata.Name} />
            </span>
        </Button>
    );
};

export default AttachmentThumbnail;
