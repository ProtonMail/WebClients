import React, { MutableRefObject, DragEvent, useState, DragEventHandler } from 'react';
import { c } from 'ttag';
import { classnames } from 'react-components';

import { MessageExtended } from '../../models/message';
import { getAttachments } from '../../helpers/message/messages';
import AttachmentsList from './attachments/AttachmentsList';
import { Attachment } from '../../models/attachment';
import Editor, { EditorActionsRef } from './editor/Editor';
import { ATTACHMENT_ACTION } from '../../helpers/attachment/attachmentUploader';
import EditorEmbeddedModal from './editor/EditorEmbeddedModal';
import { isDragFile } from '../../helpers/dom';
import { PendingUpload } from '../../hooks/useAttachments';
import { MessageChange } from './Composer';
import { Breakpoints } from '../../models/utils';

import 'design-system/_sass/react-styles/quill/_snow.scss';

interface Props {
    message: MessageExtended;
    disabled: boolean;
    breakpoints: Breakpoints;
    onEditorReady: () => void;
    onChange: MessageChange;
    onChangeContent: (content: string) => void;
    onChangeFlag: (changes: Map<number, boolean>) => void;
    onFocus: () => void;
    onAddAttachments: (files: File[]) => void;
    onAddEmbeddedImages: (files: File[]) => void;
    onCancelAddAttachment: () => void;
    onRemoveAttachment: (attachment: Attachment) => () => void;
    onRemoveUpload: (pendingUpload: PendingUpload) => () => void;
    pendingFiles?: File[];
    pendingUploads?: PendingUpload[];
    onSelectEmbedded: (action: ATTACHMENT_ACTION) => void;
    contentFocusRef: MutableRefObject<() => void>;
    editorActionsRef: EditorActionsRef;
}

const ComposerContent = ({
    message,
    disabled,
    breakpoints,
    onEditorReady,
    onChange,
    onChangeContent,
    onChangeFlag,
    onFocus,
    onAddAttachments,
    onAddEmbeddedImages,
    onCancelAddAttachment,
    onRemoveAttachment,
    onRemoveUpload,
    pendingFiles,
    pendingUploads,
    onSelectEmbedded,
    contentFocusRef,
    editorActionsRef
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
            className={classnames([
                'flex-item-fluid w100 mb0-5 flex flex-column flex-nowrap relative mb0-5 pl0-5 pr0-5',
                attachments?.length > 0 && 'composer-content--has-attachments'
            ])}
            onDrop={handleDrop}
            onDragEnter={handleHover(true)}
            onDragOver={(event) => event.preventDefault()}
        >
            <div className="flex-item-fluid w100 flex flex-column flex-nowrap relative">
                <Editor
                    message={message}
                    document={message.document}
                    disabled={disabled}
                    breakpoints={breakpoints}
                    onReady={onEditorReady}
                    onChange={onChange}
                    onChangeContent={onChangeContent}
                    onChangeFlag={onChangeFlag}
                    onFocus={onFocus}
                    onAddAttachments={onAddAttachments}
                    onAddEmbeddedImages={onAddEmbeddedImages}
                    onRemoveAttachment={onRemoveAttachment}
                    contentFocusRef={contentFocusRef}
                    editorActionsRef={editorActionsRef}
                />
                {pendingFiles && (
                    <EditorEmbeddedModal
                        files={pendingFiles}
                        onClose={onCancelAddAttachment}
                        onSelect={onSelectEmbedded}
                    />
                )}
                {fileHover && (
                    <div
                        onDragLeave={handleHover(false)}
                        className="composer-editor-dropzone covered-absolute flex flex-justify-center flex-items-center"
                    >
                        <span className="composer-editor-dropzone-text no-pointer-events">
                            {c('Info').t`Drop a file here to upload`}
                        </span>
                    </div>
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
        </section>
    );
};

export default ComposerContent;
