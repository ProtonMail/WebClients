import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import { Icon } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { attachmentsSize, getAttachments } from '../../helpers/message';
import MessageAttachment from './MessageAttachment';
import { useAttachments } from '../../hooks/useAttachments';

const MessageFooter = ({ message }) => {
    const { downloadAll } = useAttachments();
    const [showLoader, setShowLoader] = useState(false);
    const [showInstant, setShowInstant] = useState(false);

    const humanAttachmentsSize = humanSize(attachmentsSize(message.data));
    const attachments = getAttachments(message.data);
    const numAttachments = attachments.length;
    const numEmbedded = message.numEmbedded;
    const numPureAttachments = numAttachments - numEmbedded;

    const handleDownloadAll = async () => {
        setShowLoader(true);
        await downloadAll(message);
        setShowLoader(false);
        setShowInstant(true);
    };

    return (
        <div className="message-attachments">
            <div className="flex flex-spacebetween mb1">
                <span className="title">
                    <strong className="listAttachments-title-size mr0-5">{humanAttachmentsSize}</strong>
                    {numPureAttachments > 0 && (
                        <span className="listAttachments-title-files mr0-5">
                            <Icon name="attach" className="mr0-5" />
                            {c('Info').ngettext(
                                msgid`${numPureAttachments} file attached`,
                                `${numPureAttachments} files attached`,
                                numPureAttachments
                            )}
                        </span>
                    )}
                    {numEmbedded > 0 && (
                        <span className="listAttachments-title-embedded mr0-5">
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
                {numAttachments > 0 && (
                    <div>
                        <button onClick={handleDownloadAll} className="link strong mr0-5">
                            {c('Download attachments').t`Download all`}
                        </button>
                        {(showInstant || showLoader) && (
                            <Icon name={showInstant ? 'download' : ''} aria-busy={showLoader} />
                        )}
                    </div>
                )}
            </div>

            <ul className="listAttachments-list unstyled flex mb0">
                {attachments.map((attachment) => (
                    <MessageAttachment key={attachment.ID} attachment={attachment} message={message} />
                ))}
            </ul>
        </div>
    );
};

MessageFooter.propTypes = {
    message: PropTypes.object.isRequired
};

export default MessageFooter;
