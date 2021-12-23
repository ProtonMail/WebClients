import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { isPlainText, getAttachments } from '@proton/shared/lib/mail/messages';
import { DragEvent, useState, DragEventHandler } from 'react';
import { c } from 'ttag';
import { classnames, EllipsisLoader } from '@proton/components';
import { Address, MailSettings } from '@proton/shared/lib/interfaces';
import dragAndDrop from '@proton/styles/assets/img/placeholders/drag-and-drop-img.svg';
import { isDragFile } from '../../helpers/dom';
import { PendingUpload } from '../../hooks/composer/useAttachments';
import { MessageChange } from './Composer';
import { MessageState, MessageStateWithData, OutsideKey } from '../../logic/messages/messagesTypes';
import AttachmentList, { AttachmentAction } from '../attachment/AttachmentList';
import EditorWrapper, { ExternalEditorActions } from './editor/EditorWrapper';

interface Props {
    message: MessageState;
    disabled: boolean;
    onEditorReady: (editorActions: ExternalEditorActions) => void;
    onChange: MessageChange;
    onChangeContent: (content: string) => void;
    onFocus?: () => void;
    onAddAttachments: (files: File[]) => void;
    onRemoveAttachment: (attachment: Attachment) => Promise<void>;
    onRemoveUpload?: (pendingUpload: PendingUpload) => Promise<void>;
    pendingUploads?: PendingUpload[];
    isOutside?: boolean;
    outsideKey?: OutsideKey;
    mailSettings?: MailSettings;
    addresses: Address[];
}

const ComposerContent = ({
    message,
    disabled,
    onEditorReady,
    onChange,
    onChangeContent,
    onFocus,
    onAddAttachments,
    onRemoveAttachment,
    onRemoveUpload,
    pendingUploads,
    isOutside = false,
    outsideKey,
    mailSettings,
    addresses,
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
        event.stopPropagation();
        setFileHover(false);
        onAddAttachments([...event.dataTransfer.files]);
    });

    /**
     * Listening for entering on the whole section
     * But for leaving only on the overlay to prevent any interception by the editor
     */
    const handleDragLeave = onlyFiles((event) => {
        event.stopPropagation();
        setFileHover(false);
    });

    const handleDragOver = onlyFiles((event) => {
        // In order to allow drop we need to preventDefault
        event.preventDefault();
        event.stopPropagation();
        setFileHover(true);
    });

    return (
        <section
            className={classnames([
                'flex-item-fluid-auto mb0-5 flex flex-column flex-nowrap relative composer-content pt0-5',
                attachments?.length > 0 && 'composer-content--has-attachments',
                isPlainText(message.data) ? '' : 'composer-content--rich-edition',
            ])}
            onDragOver={handleDragOver}
        >
            {disabled && (
                <>
                    <div className="absolute covered-absolute placeholder opacity-50" />
                    <div className="absolute covered-absolute color-weak flex flex-justify-center flex-align-items-center">
                        {c('Info').t`Loading message`}
                        <EllipsisLoader />
                    </div>
                </>
            )}
            <div
                className={classnames([
                    'flex-item-fluid flex flex-column flex-nowrap relative',
                    isOutside ? 'mx0-5' : 'w100 pl1-75 pr1-75 mb0-5',
                ])}
                data-testid="composer-content"
            >
                <EditorWrapper
                    message={message}
                    disabled={disabled}
                    onReady={onEditorReady}
                    onChange={onChange}
                    onChangeContent={onChangeContent}
                    onFocus={onFocus}
                    onAddAttachments={onAddAttachments}
                    onRemoveAttachment={onRemoveAttachment}
                    isOutside={isOutside}
                    mailSettings={mailSettings}
                    addresses={addresses}
                />
                {fileHover && (
                    <div
                        onDragLeave={handleDragLeave}
                        onDropCapture={handleDrop}
                        className={classnames([
                            'composer-editor-dropzone covered-absolute flex flex-justify-center flex-align-items-center rounded-xl',
                            !isOutside && 'mr1-75 ml1-75',
                        ])}
                    >
                        <span className="composer-editor-dropzone-text no-pointer-events text-center color-weak">
                            <img src={dragAndDrop} alt="" className="mb1" />
                            <br />
                            {c('Info').t`Drop a file here to upload`}
                        </span>
                    </div>
                )}
            </div>
            {showAttachements && (
                <div
                    onDragOver={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                    }}
                    onDrop={handleDrop}
                >
                    <AttachmentList
                        attachments={attachments}
                        pendingUploads={pendingUploads}
                        message={message as MessageStateWithData}
                        primaryAction={AttachmentAction.Preview}
                        secondaryAction={AttachmentAction.Remove}
                        collapsable
                        showDownloadAll={false}
                        onRemoveAttachment={onRemoveAttachment}
                        onRemoveUpload={onRemoveUpload}
                        className={classnames([
                            'composer-attachments-list',
                            isOutside && 'eo-composer-attachments-list',
                        ])}
                        outsideKey={outsideKey}
                    />
                </div>
            )}
        </section>
    );
};

export default ComposerContent;
