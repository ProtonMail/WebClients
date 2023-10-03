import { MouseEvent } from 'react';

import { Button } from '@proton/atoms/Button';
import { FileIcon, MiddleEllipsis } from '@proton/components/components';
import { AttachmentsMetadata } from '@proton/shared/lib/interfaces/mail/Message';

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

    return (
        <Button
            shape="outline"
            onClick={handleClick}
            className="text-sm flex flex-align-items-center flex-nowrap gap-2 attachment-thumbnail"
            {...rest}
        >
            <FileIcon mimeType={attachmentMetadata?.MIMEType || 'unknown'} className="flex-item-noshrink" />
            <span className="lh100 attachment-thumbnail-name">
                <MiddleEllipsis charsToDisplayEnd={3} text={attachmentMetadata.Name} />
            </span>
        </Button>
    );
};

export default AttachmentThumbnail;
