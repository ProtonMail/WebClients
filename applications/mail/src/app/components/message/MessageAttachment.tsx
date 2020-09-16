import humanSize from 'proton-shared/lib/helpers/humanSize';
import React, { useState } from 'react';
import { classnames, FileIcon } from 'react-components';
import { c } from 'ttag';
import { VERIFICATION_STATUS } from '../../constants';
import { isEmbeddedLocal } from '../../helpers/embedded/embeddeds';
import { useDownload } from '../../hooks/useDownload';
import { Attachment } from '../../models/attachment';

import { MessageExtended } from '../../models/message';

// Reference: Angular/src/templates/attachments/attachmentElement.tpl.html

const getSenderVerificationString = (verified: VERIFICATION_STATUS) => {
    if (verified === VERIFICATION_STATUS.SIGNED_AND_INVALID) {
        const str = c('Attachment signature verification').t`Sender verification failed`;
        return ` - ${str}`;
    }
    if (verified === VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const str = c('Attachment signature verification').t`Sender verification passed`;
        return ` - ${str}`;
    }
    return '';
};

interface Props {
    attachment: Attachment;
    message: MessageExtended;
}

const MessageAttachment = ({ attachment, message }: Props) => {
    const [showLoader, setShowLoader] = useState(false);
    const [attachmentVerified, setAttachmentVerified] = useState(VERIFICATION_STATUS.NOT_VERIFIED);
    const download = useDownload();

    const humanAttachmentSize = humanSize(attachment.Size);

    const isEmbedded = isEmbeddedLocal(attachment);

    const classNames = classnames([
        'listAttachments-icon listAttachments-signature-icon mauto file-outer-icon',
        isEmbedded && 'is-embedded' // unsused at this point
    ]);

    const clickHandler = async () => {
        setShowLoader(true);
        try {
            const verified = await download(message, attachment);
            setAttachmentVerified(verified);
        } catch {
            // Notification is handled by the hook
        } finally {
            setShowLoader(false);
        }
    };

    const title = `${attachment.Name} (${humanAttachmentSize})` + getSenderVerificationString(attachmentVerified);

    if (!message.initialized) {
        return null;
    }

    return (
        <li className="mr0-5 mt0-5">
            <button
                className="message-attachment inline-flex flex-nowrap mw100 pm-button listAttachments-item relative no-pointer-events-children"
                title={title}
                type="button"
                onClick={clickHandler}
            >
                <span className="flex flex-item-noshrink message-attachmentIcon relative flex p0-5">
                    <FileIcon
                        mimeType={attachment.MIMEType || ''}
                        size={20}
                        className={classNames}
                        aria-busy={showLoader}
                    />
                </span>
                <span className="flex flex-nowrap flex-items-center message-attachmentInfo">
                    <span className="ellipsis mw100">{attachment.Name}</span>
                    <span className="message-attachmentSize relative flex-item-noshrink mtauto mbauto ml0-5">
                        {humanAttachmentSize}
                    </span>
                </span>
            </button>
        </li>
    );
};

export default MessageAttachment;
