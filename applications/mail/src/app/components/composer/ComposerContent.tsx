import React, { MutableRefObject, DragEvent, useState, DragEventHandler } from 'react';
import { c } from 'ttag';
import { classnames } from 'react-components';

import { MessageExtended } from '../../models/message';
import { getAttachments } from '../../helpers/message/messages';
import AttachmentsList from './attachments/AttachmentsList';
import { Attachment } from '../../models/attachment';
import Editor, { InsertRef } from './editor/Editor';
import { ATTACHMENT_ACTION } from '../../helpers/attachment/attachmentUploader';
import EditorEmbeddedModal from './editor/EditorEmbeddedModal';
import { isDragFile } from '../../helpers/dom';

import 'react-quill/dist/quill.snow.css';
import { PendingUpload } from './Composer';

interface Props {
    message: MessageExtended;
    disabled: boolean;
    onEditorReady: () => void;
    onChange: (message: Partial<MessageExtended>) => void;
    onChangeContent: (content: string) => void;
    onChangeFlag: (changes: Map<number, boolean>) => void;
    onFocus: () => void;
    onAddAttachments: (files: File[]) => void;
    onAddEmbeddedImages: (files: File[]) => void;
    onRemoveAttachment: (attachment: Attachment) => () => void;
    onRemoveUpload: (pendingUpload: PendingUpload) => () => void;
    pendingFiles?: File[];
    pendingUploads?: PendingUpload[];
    onCancelEmbedded: () => void;
    onSelectEmbedded: (action: ATTACHMENT_ACTION) => void;
    contentFocusRef: MutableRefObject<() => void>;
    contentInsertRef: InsertRef;
}

const ComposerContent = ({
    message,
    disabled,
    onEditorReady,
    onChange,
    onChangeContent,
    onChangeFlag,
    onFocus,
    onAddAttachments,
    onAddEmbeddedImages,
    onRemoveAttachment,
    onRemoveUpload,
    pendingFiles,
    pendingUploads,
    onCancelEmbedded,
    onSelectEmbedded,
    contentFocusRef,
    contentInsertRef
}: Props) => {
    const [fileHover, setFileHover] = useState(false);

    const attachments = getAttachments(message.data);
    const showAttachements = attachments.length + (pendingUploads?.length || 0) > 0;

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
            className="flex-item-fluid w100 mb0-5 flex flex-column flex-nowrap relative pr0-5"
            onDrop={handleDrop}
            onDragEnter={handleHover(true)}
            onDragOver={(event) => event.preventDefault()}
        >
            <div className={classnames(['flex-item-fluid w100 flex flex-column flex-nowrap relative'])}>
                <Editor
                    message={message}
                    document={message.document}
                    disabled={disabled}
                    onReady={onEditorReady}
                    onChange={onChange}
                    onChangeContent={onChangeContent}
                    onChangeFlag={onChangeFlag}
                    onFocus={onFocus}
                    onAddAttachments={onAddAttachments}
                    onAddEmbeddedImages={onAddEmbeddedImages}
                    contentFocusRef={contentFocusRef}
                    contentInsertRef={contentInsertRef}
                />
                {pendingFiles && (
                    <EditorEmbeddedModal files={pendingFiles} onClose={onCancelEmbedded} onSelect={onSelectEmbedded} />
                )}
            </div>
            {showAttachements && (
                <AttachmentsList
                    message={message}
                    pendingUploads={pendingUploads}
                    onRemoveAttachment={onRemoveAttachment}
                    onRemoveUpload={onRemoveUpload}
                />
            )}
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
