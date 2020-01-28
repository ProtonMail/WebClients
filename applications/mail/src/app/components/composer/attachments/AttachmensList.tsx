import React from 'react';
import { c, msgid } from 'ttag';
import { Icon, useToggle } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { Message } from '../../../models/message';
import { attachmentsSize, getAttachments } from '../../../helpers/message/messages';
import { Attachment } from '../../../models/attachment';

interface Props {
    message?: Message;
    onRemove: (attachment: Attachment) => () => void;
}

const AttachmentsList = ({ message, onRemove }: Props) => {
    const { state: expanded, toggle: toggleExpanded } = useToggle(false);

    const attachments = getAttachments(message);
    const size = humanSize(attachmentsSize(message));

    return (
        <div className="flex flex-column relative w100 flex-nowrap">
            <button className="flex flex-row flex-spacebetween w100 p0-5" onClick={toggleExpanded}>
                <div>
                    <strong className="mr0-5">{size}</strong>
                    <Icon name="attach" className="mr0-5" />
                    {c('Info').ngettext(
                        msgid`${attachments.length} file attached`,
                        `${attachments.length} files attached`,
                        attachments.length
                    )}
                </div>
                <div className="color-pm-blue">{expanded ? c('Action').t`Hide` : c('Action').t`Show`}</div>
            </button>
            {expanded && (
                <div className="composer-attachments-expand flex flex-row flex-wrap pt1 pb0-5 pl0-5 pr0-5">
                    {attachments.map((attachment) => (
                        <div key={attachment.ID} className="composer-attachments-item">
                            <div className="flex flex-spacebetween bordered-container p0-25 flex-nowrap flex-items-center pm_button bg-white-dm p0">
                                <Icon name="attach" />
                                <span className="flex-item-fluid ellipsis pl0-5 pr0-5">{attachment.Name}</span>
                                <button
                                    className="inline-flex pl0-5 pr0-5 no-pointer-events-children h100"
                                    onClick={onRemove(attachment)}
                                >
                                    <Icon name="off" size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AttachmentsList;
