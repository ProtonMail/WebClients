import React, { useState } from 'react';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { Icon, classnames, useApi } from 'react-components';
import { MessageExtended } from '../../models/message';
import { Attachment } from '../../models/attachment';
import { download } from '../../helpers/attachment/attachmentDownloader';
import { useAttachmentCache } from '../../containers/AttachmentProvider';
import { isEmbeddedLocal } from '../../helpers/embedded/embeddeds';

// Reference: Angular/src/templates/attachments/attachmentElement.tpl.html

const OUTER_MAP_CLASSNAME: { [key: string]: string } = {
    zip: 'file-rar-zip',
    mp3: 'file-video',
    javascript: 'file-unknown',
    vcard: 'file-unknown',
    xls: 'file-xls',
    mov: 'file-video',
    pdf: 'file-pdf',
    power: 'file-ppt',
    word: 'file-doc'
};

const INNER_MAP_CLASSNAME: { [key: string]: string } = {
    'pgp-keys': 'fa-key'
};

const getFileIconType = ({ MIMEType = '' }: Attachment) => {
    const key = Object.keys(OUTER_MAP_CLASSNAME).find((key) => MIMEType.includes(key));
    return OUTER_MAP_CLASSNAME[key || ''] || '';
};

const getInnerFileIconType = ({ MIMEType = '' }: Attachment) => {
    const key = Object.keys(INNER_MAP_CLASSNAME).find((key) => MIMEType.includes(key));
    return INNER_MAP_CLASSNAME[key || ''] || '';
};

interface Props {
    attachment: Attachment;
    message: MessageExtended;
}

const MessageAttachment = ({ attachment, message }: Props) => {
    const cache = useAttachmentCache();
    const api = useApi();
    const [showLoader, setShowLoader] = useState(false);
    const [showInstant, setShowInstant] = useState(false);

    const humanAttachmentSize = humanSize(attachment.Size);

    const outerIcon = getFileIconType(attachment) || 'file-image';
    const single = !getInnerFileIconType(attachment);
    const isEmbedded = isEmbeddedLocal(attachment);

    const classNames = classnames([
        'listAttachments-icon listAttachments-signature-icon mauto file-outer-icon',
        single && 'single',
        isEmbedded && 'is-embedded'
    ]);

    const clickHandler = async () => {
        setShowLoader(true);
        await download(attachment, message, cache, api);
        setShowLoader(false);
        setShowInstant(true);
    };

    const icon = showLoader ? '' : showInstant ? 'download' : outerIcon;
    const showInner = !single && !showLoader && !showInstant;

    return (
        <li className="mr0-5 mt0-5">
            <a
                className="message-attachment inline-flex flex-nowrap mw100 pm-button listAttachments-item relative no-pointer-events-children"
                title={`${attachment.Name} ${humanAttachmentSize}`}
                onClick={clickHandler}
            >
                <span className="flex flex-item-noshrink message-attachmentIcon relative flex p0-5">
                    <Icon name={icon} size={20} className={classNames} aria-busy={showLoader} />
                    {showInner && <Icon name="key" className="file-inner-icon mauto" />}
                </span>
                <span className="flex flex-items-center message-attachmentInfo">
                    <span className="ellipsis mw100">{attachment.Name}</span>
                    <span className="message-attachmentSize mtauto mbauto ml0-5">{humanAttachmentSize}</span>
                </span>
            </a>
        </li>
    );
};

export default MessageAttachment;
