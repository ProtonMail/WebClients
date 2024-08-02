import type { Ref } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import type { EditorMetadata } from '@proton/components';
import { Dropzone, EllipsisLoader } from '@proton/components';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getAttachments } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import type { PendingUpload } from '../../hooks/composer/useAttachments';
import type { MessageState, MessageStateWithData, OutsideKey } from '../../store/messages/messagesTypes';
import AttachmentList, { AttachmentAction } from '../attachment/AttachmentList';
import type { MessageChange } from './Composer';
import type { ExternalEditorActions } from './editor/EditorWrapper';
import EditorWrapper from './editor/EditorWrapper';

interface Props {
    message: MessageState;
    disabled: boolean;
    onEditorReady: (editorActions: ExternalEditorActions) => void;
    onChange: MessageChange;
    onMouseUp?: () => void;
    onKeyUp?: () => void;
    onChangeContent: (content: string) => void;
    onFocus?: () => void;
    onAddAttachments: (files: File[]) => void;
    onRemoveAttachment: (attachment: Attachment) => Promise<void>;
    onRemoveUpload?: (pendingUpload: PendingUpload) => Promise<void>;
    pendingUploads?: PendingUpload[];
    isOutside?: boolean;
    outsideKey?: OutsideKey;
    mailSettings?: MailSettings;
    userSettings?: UserSettings;
    editorMetadata: EditorMetadata;
    isInert?: boolean;
}

const ComposerContent = (
    {
        message,
        disabled,
        onEditorReady,
        onChange,
        onMouseUp,
        onKeyUp,
        onChangeContent,
        onFocus,
        onAddAttachments,
        onRemoveAttachment,
        onRemoveUpload,
        pendingUploads,
        isOutside = false,
        outsideKey,
        mailSettings,
        userSettings,
        editorMetadata,
        isInert,
    }: Props,
    ref: Ref<HTMLElement>
) => {
    const attachments = getAttachments(message.data);
    const showAttachments = attachments.length + (pendingUploads?.length || 0) > 0;

    return (
        <section
            className={clsx([
                'flex-auto mb-2 flex flex-column flex-nowrap relative composer-content pt-2',
                attachments?.length > 0 && 'composer-content--has-attachments',
            ])}
            ref={ref}
            // @ts-ignore
            inert={isInert ? '' : undefined}
        >
            {disabled && (
                <>
                    <div className="absolute inset-0 placeholder opacity-50" />
                    <div className="absolute inset-0 color-weak flex justify-center items-center">
                        {c('Info').t`Loading message`}
                        <EllipsisLoader />
                    </div>
                </>
            )}
            <div
                className={clsx([
                    'flex-1 flex flex-column flex-nowrap relative',
                    isOutside && 'mx-0 sm:mx-2',
                    !isOutside && 'w-full mb-2',
                ])}
                data-testid="composer-content"
            >
                <EditorWrapper
                    message={message}
                    disabled={disabled}
                    onReady={onEditorReady}
                    onChange={onChange}
                    onMouseUp={onMouseUp}
                    onKeyUp={onKeyUp}
                    onChangeContent={onChangeContent}
                    onFocus={onFocus}
                    onAddAttachments={onAddAttachments}
                    onRemoveAttachment={onRemoveAttachment}
                    mailSettings={mailSettings}
                    userSettings={userSettings}
                    editorMetadata={editorMetadata}
                />
            </div>
            {showAttachments && (
                // Add a wrapping div so that Dropzone does not break the UI
                <div>
                    <Dropzone onDrop={onAddAttachments} shape="invisible">
                        <AttachmentList
                            attachments={attachments}
                            pendingUploads={pendingUploads}
                            message={message as MessageStateWithData}
                            primaryAction={AttachmentAction.Preview}
                            secondaryAction={AttachmentAction.Remove}
                            collapsable
                            onRemoveAttachment={onRemoveAttachment}
                            onRemoveUpload={onRemoveUpload}
                            className={clsx(['composer-attachments-list', isOutside && 'eo-composer-attachments-list'])}
                            outsideKey={outsideKey}
                        />
                    </Dropzone>
                </div>
            )}
        </section>
    );
};

export default forwardRef(ComposerContent);
