import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { attachmentsSize, getAttachments } from 'proton-shared/lib/mail/messages';
import React, { useEffect } from 'react';
import { c, msgid } from 'ttag';
import { Icon, useToggle } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { diff } from 'proton-shared/lib/helpers/array';

import { MessageExtendedWithData } from '../../../models/message';
import { PendingUpload } from '../../../hooks/useAttachments';
import { AttachmentItemNormal, AttachmentItemPending } from './AttachmentItem';

interface Props {
    message: MessageExtendedWithData;
    pendingUploads?: PendingUpload[];
    onRemoveAttachment: (attachment: Attachment) => () => void;
    onRemoveUpload: (pendingUpload: PendingUpload) => () => void;
}

// Needed to keep a stable ref to an empty array for the useEffect ref check
const emptyUploads = [] as PendingUpload[];

const AttachmentsList = ({ message, pendingUploads = emptyUploads, onRemoveAttachment, onRemoveUpload }: Props) => {
    const { state: expanded, toggle: toggleExpanded, set: setExpanded } = useToggle(false);

    useEffect(() => {
        setExpanded(pendingUploads.length > 0);
    }, [pendingUploads]);

    const attachments = getAttachments(message.data);
    const size = attachmentsSize(message.data);
    const sizeLabel = humanSize(size);

    const embeddedAttachments = [...(message.embeddeds?.values() || [])].map(({ attachment }) => attachment);
    const pureAttachments = diff(attachments, embeddedAttachments);

    const pureAttachmentsCount = pureAttachments.length;
    const embeddedAttachmentsCount = embeddedAttachments.length;

    return (
        <div className="composer-attachments-list bg-global-highlight flex flex-column relative w100 flex-nowrap">
            <button type="button" className="flex flex-row flex-spacebetween w100 p0-5" onClick={toggleExpanded}>
                <div className="flex flex-items-center">
                    {size !== 0 && <strong className="mr0-5">{sizeLabel}</strong>}
                    {pureAttachmentsCount > 0 && (
                        <span className="mr0-5">
                            <Icon name="attach" className="mr0-25" />
                            {c('Info').ngettext(
                                msgid`${pureAttachmentsCount} file attached`,
                                `${pureAttachmentsCount} files attached`,
                                pureAttachmentsCount
                            )}
                        </span>
                    )}
                    {embeddedAttachmentsCount > 0 && (
                        <span className="mr0-5 inline-flex flex-items-center">
                            <Icon name="file-image" className="mr0-25" />
                            {c('Info').ngettext(
                                msgid`${embeddedAttachmentsCount} embedded image`,
                                `${embeddedAttachmentsCount} embedded images`,
                                embeddedAttachmentsCount
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
                            message={message}
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
