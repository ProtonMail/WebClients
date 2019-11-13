import React from 'react';
import PropTypes from 'prop-types';
import humanSize from 'proton-shared/lib/helpers/humanSize';

// Reference: Angular/src/templates/attachments/attachmentElement.tpl.html

const MessageAttachment = ({ attachment }) => {
    const humanAttachmentSize = humanSize(attachment.Size);

    return (
        <li className="mr1 mb1">
            <a
                className="message-attachment inline-flex flex-nowrap mw100 pm-button listAttachments-item relative no-pointer-events-children"
                title={`${attachment.Name} ${humanAttachmentSize}`}
            >
                <span className="flex flex-item-noshrink message-attachmentIcon relative flex">
                    {/* TODO: <icon-attachment class="flex mauto"></icon-attachment> */}
                </span>
                <span className="inbl ellipsis flex flex-column message-attachmentInfo">
                    <span className="bl ellipsis mw100">{attachment.Name}</span>
                    <span className="bl message-attachmentSize">{humanAttachmentSize}</span>
                </span>
            </a>
        </li>
    );
};

MessageAttachment.propTypes = {
    attachment: PropTypes.object.isRequired,
    message: PropTypes.object.isRequired
};

export default MessageAttachment;
