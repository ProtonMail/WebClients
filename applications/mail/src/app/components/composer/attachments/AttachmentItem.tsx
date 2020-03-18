import React, { useState, useEffect } from 'react';
import { Icon } from 'react-components';

import { Attachment } from '../../../models/attachment';
import { PendingUpload } from '../Composer';

interface Props {
    name: string;
    progression?: number;
    onRemove: () => void;
}

const AttachmentItem = ({ name, progression = 0, onRemove }: Props) => {
    const blue = '#657ee4';
    const value = Math.round(progression * 100);
    const background =
        progression === undefined
            ? 'none'
            : `linear-gradient(to right, ${blue} 0%,  ${blue} ${value}%, transparent ${value}%)`;

    return (
        <div className="composer-attachments-item">
            <div
                style={{ background }}
                className="flex flex-spacebetween bordered-container p0-25 flex-nowrap flex-items-center pm_button bg-white-dm p0"
            >
                <Icon name="attach" />
                <span className="flex-item-fluid ellipsis pl0-5 pr0-5">{name}</span>
                <button
                    type="button"
                    className="inline-flex pl0-5 pr0-5 no-pointer-events-children h100"
                    onClick={onRemove}
                >
                    <Icon name="off" size={12} />
                </button>
            </div>
        </div>
    );
};

interface PropsNormal {
    attachment: Attachment;
    onRemove: () => void;
}

export const AttachmentItemNormal = ({ attachment, onRemove }: PropsNormal) => (
    <AttachmentItem name={attachment.Name || ''} onRemove={onRemove} />
);

interface PropsPending {
    pendingUpload: PendingUpload;
    onRemove: () => void;
}

export const AttachmentItemPending = ({ pendingUpload, onRemove }: PropsPending) => {
    const [progression, setProgression] = useState<number>(0);

    useEffect(() => {
        pendingUpload.upload.addProgressListener((event) => {
            setProgression(event.loaded / event.total);
        });
    }, []);

    return <AttachmentItem name={pendingUpload.file.name} progression={progression} onRemove={onRemove} />;
};
