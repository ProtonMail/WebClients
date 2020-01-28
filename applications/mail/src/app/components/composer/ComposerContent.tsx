import React, { MutableRefObject, useRef, useEffect, RefObject } from 'react';
import ReactQuill from 'react-quill';
import Quill from 'quill';
import { noop } from 'proton-shared/lib/helpers/function';
import { MessageExtended } from '../../models/message';
import { getAttachments } from '../../helpers/message/messages';
import AttachmentsList from './attachments/AttachmensList';
import { Attachment } from '../../models/attachment';

import 'react-quill/dist/quill.snow.css';

const Block = Quill.import('blots/block');
Block.tagName = 'div';
Quill.register(Block);

interface Props {
    message: MessageExtended;
    onChange: (message: MessageExtended) => void;
    onFocus: () => void;
    onRemoveAttachment: (attachment: Attachment) => () => void;
    contentFocusRef: MutableRefObject<() => void>;
}

const ComposerContent = ({ message, onChange, onFocus, onRemoveAttachment, contentFocusRef }: Props) => {
    const inputRef: RefObject<ReactQuill> = useRef(null);

    useEffect(() => {
        contentFocusRef.current = inputRef.current?.focus || noop;
    }, []);

    const handleChange = (content: string, delta: any, source: string) => {
        if (source === 'user') {
            onChange({ content });
        }
    };

    const attachments = getAttachments(message.data);

    return (
        <section className="composer-content flex-item-fluid w100 mb0-5 flex flex-column flex-nowrap">
            <ReactQuill
                className="composer-quill w100 flex-item-fluid"
                value={message.content || ''}
                readOnly={!message.content}
                onChange={handleChange}
                onFocus={onFocus}
                ref={inputRef}
            />
            {attachments.length > 0 && <AttachmentsList message={message.data} onRemove={onRemoveAttachment} />}
        </section>
    );
};

export default ComposerContent;
