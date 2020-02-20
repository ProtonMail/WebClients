import React, { MutableRefObject, DragEvent, useState, DragEventHandler } from 'react';
import { c } from 'ttag';
import { classnames } from 'react-components';

import { MessageExtended } from '../../models/message';
import { getAttachments } from '../../helpers/message/messages';
import AttachmentsList from './attachments/AttachmensList';
import { Attachment } from '../../models/attachment';
import Editor, { InsertRef } from './editor/Editor';
import { ATTACHMENT_ACTION } from '../../helpers/attachment/attachmentUploader';
import EditorEmbeddedModal from './editor/EditorEmbeddedModal';
import { isDragFile } from '../../helpers/dom';

import 'react-quill/dist/quill.snow.css';

interface Props {
    message: MessageExtended;
    onChange: (content: string) => void;
    onFocus: () => void;
    onAddAttachments: (files: File[]) => void;
    onRemoveAttachment: (attachment: Attachment) => () => void;
    pendingFiles?: File[];
    onCancelEmbedded: () => void;
    onSelectEmbedded: (action: ATTACHMENT_ACTION) => void;
    contentFocusRef: MutableRefObject<() => void>;
    contentInsertRef: InsertRef;
}

const ComposerContent = ({
    message,
    onChange,
    onFocus,
    onAddAttachments,
    onRemoveAttachment,
    pendingFiles,
    onCancelEmbedded,
    onSelectEmbedded,
    contentFocusRef,
    contentInsertRef
}: Props) => {
    const [fileHover, setFileHover] = useState(false);

    const attachments = getAttachments(message.data);

    const onlyFiles = (eventHandler: DragEventHandler) => (event: DragEvent) => {
        if (isDragFile(event)) {
            return eventHandler(event);
        }
    };

    const handleDrop = onlyFiles((event: DragEvent) => {
        event.preventDefault();
        setFileHover(false);
        onAddAttachments([...event.dataTransfer.files]);
    });

    /**
     * Listening for entering on the whole section
     * But for leaving only on the overlay to prevent any interception by the editor
     */
    const handleHover = (hover: boolean) =>
        onlyFiles((event) => {
            setFileHover(hover);
            event.stopPropagation();
        });

    return (
        <section
            className="flex-item-fluid w100 mb0-5 flex flex-column flex-nowrap relative"
            onDrop={handleDrop}
            onDragEnter={handleHover(true)}
            onDragOver={(event) => event.preventDefault()}
        >
            <div className={classnames(['flex-item-fluid w100 flex flex-column flex-nowrap relative'])}>
                <Editor
                    document={message.document}
                    onChange={onChange}
                    onFocus={onFocus}
                    onAddAttachments={onAddAttachments}
                    contentFocusRef={contentFocusRef}
                    contentInsertRef={contentInsertRef}
                />
                {pendingFiles && (
                    <EditorEmbeddedModal files={pendingFiles} onClose={onCancelEmbedded} onSelect={onSelectEmbedded} />
                )}
            </div>
            {attachments.length > 0 && <AttachmentsList message={message.data} onRemove={onRemoveAttachment} />}
            {fileHover && (
                <div
                    onDragLeave={handleHover(false)}
                    className="composer-editor-dropzone absolute w100 h100 flex flex-justify-center flex-items-center"
                >
                    <span className="no-pointer-events">{c('Info').t`Drop a file here to upload`}</span>
                </div>
            )}
        </section>
    );
};

export default ComposerContent;
