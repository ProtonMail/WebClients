import React, { useState } from 'react';
import PropTypes from 'prop-types';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { Icon, classnames } from 'react-components';
import { useAttachments } from '../../hooks/useAttachments';

// Reference: Angular/src/templates/attachments/attachmentElement.tpl.html

const OUTER_MAP_CLASSNAME = {
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

const INNER_MAP_CLASSNAME = {
    'pgp-keys': 'fa-key'
};

const getFileIconType = ({ MIMEType }) => {
    const key = Object.keys(OUTER_MAP_CLASSNAME).find((key) => MIMEType.includes(key));
    return OUTER_MAP_CLASSNAME[key];
};

const getInnerFileIconType = ({ MIMEType }) => {
    const key = Object.keys(INNER_MAP_CLASSNAME).find((key) => MIMEType.includes(key));
    return INNER_MAP_CLASSNAME[key];
};

/*
 * embedded.isEmbedded doesn't work :/
 * As we have the header, it should be fine
 */
const isEmbeddedLocal = ({ Headers: { 'content-disposition': disposition, embedded } = {} } = {}) => {
    return disposition === 'inline' || embedded === 1;
};

const MessageAttachment = ({ attachment, message }) => {
    const { download } = useAttachments();
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
        await download(attachment, message);
        setShowLoader(false);
        setShowInstant(true);
    };

    const icon = showLoader ? '' : showInstant ? 'download' : outerIcon;
    const showInner = !single && !showLoader && !showInstant;

    return (
        <li className="mr1 mb1">
            <a
                className="message-attachment inline-flex flex-nowrap mw100 pm-button listAttachments-item relative no-pointer-events-children"
                title={`${attachment.Name} ${humanAttachmentSize}`}
                onClick={clickHandler}
            >
                <span className="flex flex-item-noshrink message-attachmentIcon relative flex">
                    <Icon name={icon} size={20} className={classNames} aria-busy={showLoader} />
                    {showInner && <Icon name="key" className="file-inner-icon mauto" />}
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
