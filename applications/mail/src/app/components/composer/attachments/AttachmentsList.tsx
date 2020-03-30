import React, { useEffect } from 'react';
import { c, msgid } from 'ttag';
import { Icon, useToggle } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { MessageExtended } from '../../../models/message';
import { attachmentsSize, getAttachments } from '../../../helpers/message/messages';
import { Attachment } from '../../../models/attachment';
import { diff } from 'proton-shared/lib/helpers/array';
import { PendingUpload } from '../Composer';
import { AttachmentItemNormal, AttachmentItemPending } from './AttachmentItem';

interface Props {
    message: MessageExtended;
    pendingUploads?: PendingUpload[];
    onRemoveAttachment: (attachment: Attachment) => () => void;
    onRemoveUpload: (pendingUpload: PendingUpload) => () => void;
}

const AttachmentsList = ({ message, pendingUploads = [], onRemoveAttachment, onRemoveUpload }: Props) => {
    const { state: expanded, toggle: toggleExpanded, set: setExpanded } = useToggle(false);

    useEffect(() => {
        setExpanded(pendingUploads.length > 0);
    }, [pendingUploads]);

    const attachments = getAttachments(message.data);
    const size = humanSize(attachmentsSize(message.data));

    const embeddedAttachments = [...(message.embeddeds?.values() || [])].map(({ attachment }) => attachment);
    const pureAttachments = diff(attachments, embeddedAttachments);

    return (
        <div className="composer-attachments-list bg-global-highlight flex flex-column relative w100 flex-nowrap">
            <button type="button" className="flex flex-row flex-spacebetween w100 p0-5" onClick={toggleExpanded}>
                <div>
                    <strong className="mr0-5">{size}</strong>
                    {pureAttachments.length > 0 && (
                        <span className="mr0-5">
                            <Icon name="attach" className="mr0-5" />
                            {c('Info').ngettext(
                                msgid`${pureAttachments.length} file attached`,
                                `${pureAttachments.length} files attached`,
                                pureAttachments.length
                            )}
                        </span>
                    )}
                    {embeddedAttachments.length > 0 && (
                        <span className="mr0-5">
                            <Icon name="file-image" className="mr0-5" />
                            {c('Info').ngettext(
                                msgid`${embeddedAttachments.length} embedded image`,
                                `${embeddedAttachments.length} embedded images`,
                                embeddedAttachments.length
                            )}
                        </span>
                    )}
                </div>
                <div className="color-pm-blue">{expanded ? c('Action').t`Hide` : c('Action').t`Show`}</div>
            </button>
            {expanded && (
                <div className="composer-attachments-expand flex flex-row flex-wrap pt1 pb0-5 pl0-5 pr0-5">
                    {attachments.map((attachment) => (
                        <AttachmentItemNormal
                            key={attachment.ID}
                            attachment={attachment}
                            onRemove={onRemoveAttachment(attachment)}
                        />
                    ))}
                    {pendingUploads.map((pendingUpload) => (
                        <AttachmentItemPending
                            key={pendingUpload.file.name}
                            pendingUpload={pendingUpload}
                            onRemove={onRemoveUpload(pendingUpload)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AttachmentsList;
