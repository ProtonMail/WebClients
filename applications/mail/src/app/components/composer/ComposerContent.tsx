import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { getAttachments } from 'proton-shared/lib/mail/messages';
import React, { MutableRefObject, DragEvent, useState, DragEventHandler } from 'react';
import { c } from 'ttag';
import { classnames, EllipsisLoader } from 'react-components';

import { MessageExtended, MessageExtendedWithData } from '../../models/message';
import AttachmentList, { AttachmentAction } from '../attachment/AttachmentList';
import SquireEditorWrapper, { EditorActionsRef } from './editor/SquireEditorWrapper';
import { ATTACHMENT_ACTION } from '../../helpers/attachment/attachmentUploader';
import EditorEmbeddedModal from './editor/EditorEmbeddedModal';
import { isDragFile } from '../../helpers/dom';
import { PendingUpload } from '../../hooks/composer/useAttachments';
import { MessageChange } from './Composer';
import { Breakpoints } from '../../models/utils';

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
    onCancelAddAttachment: () => void;
    onRemoveAttachment: (attachment: Attachment) => Promise<void>;
    onRemoveUpload: (pendingUpload: PendingUpload) => Promise<void>;
    pendingFiles?: File[];
    pendingUploads?: PendingUpload[];
    onSelectEmbedded: (action: ATTACHMENT_ACTION) => void;
    contentFocusRef: MutableRefObject<() => void>;
    editorActionsRef: EditorActionsRef;
    squireKeydownHandler: (e: KeyboardEvent) => void;
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
    onCancelAddAttachment,
    onRemoveAttachment,
    onRemoveUpload,
    pendingFiles,
    pendingUploads,
    onSelectEmbedded,
    contentFocusRef,
    editorActionsRef,
    squireKeydownHandler,
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
                'flex-item-fluid mb0-5 ml1 mr1 flex flex-column flex-nowrap relative composer-content',
                attachments?.length > 0 && 'composer-content--has-attachments',
            ])}
            onDrop={handleDrop}
            onDragEnter={handleHover(true)}
            onDragOver={(event) => event.preventDefault()}
        >
            {disabled && (
                <>
                    <div className="absolute covered-absolute placeholder opacity-50 bg-norm" />
                    <div className="absolute covered-absolute color-weak flex flex-justify-center flex-align-items-center">
                        {c('Info').t`Loading message`}
                        <EllipsisLoader />
                    </div>
                </>
            )}
            <div className="flex-item-fluid w100 flex flex-column flex-nowrap relative" data-testid="composer-content">
                <SquireEditorWrapper
                    message={message}
                    disabled={disabled}
                    breakpoints={breakpoints}
                    onReady={onEditorReady}
                    onChange={onChange}
                    onChangeContent={onChangeContent}
                    onChangeFlag={onChangeFlag}
                    onFocus={onFocus}
                    onAddAttachments={onAddAttachments}
                    onRemoveAttachment={onRemoveAttachment}
                    contentFocusRef={contentFocusRef}
                    editorActionsRef={editorActionsRef}
                    keydownHandler={squireKeydownHandler}
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
                        className="composer-editor-dropzone covered-absolute flex flex-justify-center flex-align-items-center"
                    >
                        <span className="composer-editor-dropzone-text no-pointer-events">
                            {c('Info').t`Drop a file here to upload`}
                        </span>
                    </div>
                )}
            </div>
            {showAttachements && (
                <AttachmentList
                    attachments={attachments}
                    pendingUploads={pendingUploads}
                    embeddeds={message.embeddeds}
                    message={message as MessageExtendedWithData}
                    primaryAction={AttachmentAction.Preview}
                    secondaryAction={AttachmentAction.Remove}
                    collapsable
                    showDownloadAll={false}
                    onRemoveAttachment={onRemoveAttachment}
                    onRemoveUpload={onRemoveUpload}
                    className="composer-attachments-list bg-weak"
                />
            )}
        </section>
    );
};

export default ComposerContent;
