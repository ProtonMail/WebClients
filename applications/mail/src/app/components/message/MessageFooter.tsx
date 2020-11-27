import { attachmentsSize, getAttachments } from 'proton-shared/lib/mail/messages';
import React, { useState } from 'react';
import { c, msgid } from 'ttag';
import { Icon, classnames } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { getNumAttachmentByType } from '../../helpers/message/messages';
import MessageAttachment from './MessageAttachment';
import { MessageExtended, MessageExtendedWithData } from '../../models/message';
import { useDownloadAll } from '../../hooks/useDownload';

interface Props {
    message: MessageExtended;

    /**
     * Needed for print message
     * true: (default) show download all button, clickable attachment
     * false: no buttons, only static content
     */
    showActions?: boolean;
}

const MessageFooter = ({ message, showActions = true }: Props) => {
    const [showLoader, setShowLoader] = useState(false);
    const [showInstant, setShowInstant] = useState(false);
    const downloadAll = useDownloadAll();

    const humanAttachmentsSize = humanSize(attachmentsSize(message.data));

    const attachments = getAttachments(message.data);
    const [numPureAttachments, numEmbedded] = getNumAttachmentByType(message);
    const numAttachments = numPureAttachments + numEmbedded;

    const handleDownloadAll = async () => {
        setShowLoader(true);
        try {
            await downloadAll(message as MessageExtendedWithData);
        } catch (error) {
            // Notification is handled by the hook
            console.log('error', error);
        } finally {
            setShowLoader(false);
            setShowInstant(true);
        }
    };

    return (
        <div
            className={classnames([
                'message-attachments border-top m0-5 pt0-5 pl0-5 pr0-5',
                !showActions && 'no-pointer-events',
            ])}
        >
            <div className="flex flex-spacebetween mb0">
                <span className="title inline-flex flex-items-center">
                    <strong className="listAttachments-title-size inline-flex flex-items-center mr0-5">
                        {humanAttachmentsSize}
                    </strong>
                    {numPureAttachments > 0 && (
                        <span className="listAttachments-title-files inline-flex flex-items-center mr0-5">
                            <Icon name="attach" className="mr0-5" />
                            {c('Info').ngettext(
                                msgid`${numPureAttachments} file attached`,
                                `${numPureAttachments} files attached`,
                                numPureAttachments
                            )}
                        </span>
                    )}
                    {numEmbedded > 0 && (
                        <span className="listAttachments-title-embedded inline-flex flex-items-center mr0-5">
                            {/* TODO: color="pm-blue" */}
                            <Icon name="file-image" className="mr0-5" />
                            {c('Info').ngettext(
                                msgid`${numEmbedded} embedded image`,
                                `${numEmbedded} embedded images`,
                                numEmbedded
                            )}
                        </span>
                    )}
                </span>
                {showActions && numAttachments > 0 && (
                    <div>
                        <button
                            type="button"
                            onClick={handleDownloadAll}
                            className="link strong mr0-5"
                            disabled={!message.initialized}
                        >
                            {c('Download attachments').t`Download all`}
                        </button>
                        {(showInstant || showLoader) && (
                            <Icon name={showInstant ? 'download' : ''} aria-busy={showLoader} />
                        )}
                    </div>
                )}
            </div>

            <ul className="listAttachments-list unstyled flex mt0 mb0">
                {attachments.map((attachment) => (
                    <MessageAttachment
                        key={attachment.ID}
                        attachment={attachment}
                        message={message as MessageExtendedWithData}
                    />
                ))}
            </ul>
        </div>
    );
};

export default MessageFooter;
