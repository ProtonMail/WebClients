import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { Icon, classnames } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { PendingUpload } from '../../../hooks/useAttachments';

interface Props {
    name: string;
    size?: number;
    progression?: number;
    onRemove: () => void;
}

const AttachmentItem = ({ name, size = 0, progression = 0, onRemove }: Props) => {
    const [removed, setRemoved] = useState(false);

    const blue = '#657ee4';
    const value = Math.round(progression * 100);
    const progressionHappening = progression !== 0;
    const backgroundImage =
        progression === 0 ? 'none' : `linear-gradient(to right, ${blue} 0%,  ${blue} ${value}%, transparent ${value}%)`;
    const humanAttachmentSize = progressionHappening === false ? `(${humanSize(size)})` : ``;
    const title = `${name} ${humanAttachmentSize}`;

    const handleRemove = () => {
        setRemoved(true);
        onRemove();
    };

    return (
        <div className="composer-attachments-item">
            <div
                style={{ backgroundImage }}
                className={classnames([
                    'bg-white-dm flex bordered-container flex-nowrap flex-items-center pm_button p0',
                    progressionHappening && 'composer-attachments-item--uploadInProgress'
                ])}
            >
                <span className="p0-5 border-right flex flex-item-noshrink composer-attachments-item-typeIcon">
                    <Icon name="attach" size={12} className="mauto" />
                </span>
                <span
                    className="flex-item-fluid mtauto mbauto flex flex-items-center flex-nowrap pl0-5 pr0-5"
                    title={title}
                >
                    <span className="ellipsis pr0-25">{name}</span>
                    <span className="message-attachmentSize flex-item-noshrink">{humanAttachmentSize}</span>
                </span>
                <button
                    type="button"
                    className="inline-flex p0-5 no-pointer-events-children h100 flex-item-noshrink border-left composer-attachments-item-deleteButton"
                    onClick={handleRemove}
                    title={c('Action').t`Remove`}
                    disabled={removed}
                >
                    <Icon name="off" size={12} />
                    <span className="sr-only">
                        {c('Action').t`Remove`} {name}
                    </span>
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
    <AttachmentItem name={attachment.Name || ''} size={attachment.Size} onRemove={onRemove} />
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
