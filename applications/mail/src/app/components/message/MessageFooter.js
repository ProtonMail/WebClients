import React from 'react';
import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import { Icon } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { attachmentsSize, getAttachments } from '../../helpers/message';
import MessageAttachment from './MessageAttachment';

const MessageFooter = ({ message }) => {
    const humanAttachmentsSize = humanSize(attachmentsSize(message.data));
    const attachments = getAttachments(message.data);
    const numAttachments = attachments.length;
    const numEmbedded = message.numEmbedded;
    const numPureAttachments = numAttachments - numEmbedded;

    return (
        <div className="message-attachments">
            <header className="listAttachments-header">
                <span className="title">
                    <strong className="listAttachments-title-size">{humanAttachmentsSize}</strong>
                    {numPureAttachments > 0 && (
                        <span className="listAttachments-title-files">
                            <Icon name="attach" />
                            {c('Info').ngettext(
                                msgid`${numPureAttachments} file attached`,
                                `${numPureAttachments} files attached`,
                                numPureAttachments
                            )}
                        </span>
                    )}
                    {numEmbedded > 0 && (
                        <span className="listAttachments-title-embedded">
                            {/* TODO: color="pm-blue" */}
                            <Icon name="file-image" />
                            {c('Info').ngettext(
                                msgid`${numEmbedded} embedded image`,
                                `${numEmbedded} embedded images`,
                                numEmbedded
                            )}
                        </span>
                    )}
                    {numAttachments > 0 && (
                        <span className="listAttachments-title-download">
                            <btn-download-attachments
                                data-model="model"
                                class="listAttachments-btn-downloadAll"
                            ></btn-download-attachments>
                        </span>
                    )}
                </span>
            </header>

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
