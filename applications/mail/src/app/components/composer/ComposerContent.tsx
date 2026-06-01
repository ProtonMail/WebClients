import type { Ref, RefObject } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import Dropzone from '@proton/components/components/dropzone/Dropzone';
import type { EditorProps } from '@proton/components/components/editor/Editor';
import type { EditorMetadata } from '@proton/components/components/editor/interface';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import type { MessageState, MessageStateWithData, OutsideKey } from '@proton/mail/store/messages/messagesTypes';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getAttachments } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import type { PendingUpload } from 'proton-mail/hooks/composer/useAttachements/interface';

import AttachmentList, { AttachmentAction } from '../../components/message/extrasFooter/attachment/AttachmentList';
import type { MessageChange } from './Composer';
import type { ExternalEditorActions } from './editor/EditorWrapper';
import EditorWrapper from './editor/EditorWrapper';

interface Props extends Pick<EditorProps, 'onMouseUp' | 'onKeyUp' | 'onFocus' | 'toolbarCustomRender'> {
    message: MessageState;
    disabled: boolean;
    onEditorReady: (editorActions: ExternalEditorActions) => void;
    onChange: MessageChange;
    onChangeContent: (content: string) => void;
    handleAddAttachments: (files: File[]) => void;
    handleRemoveAttachment: (attachment: Attachment) => Promise<void>;
    handleRemoveUpload?: (pendingUpload: PendingUpload) => Promise<void>;
    pendingUploads?: PendingUpload[];
    isOutside?: boolean;
    outsideKey?: OutsideKey;
    mailSettings?: MailSettings;
    userSettings?: UserSettings;
    editorMetadata: EditorMetadata;
    isInert?: boolean;
    isAssistantExpanded?: boolean;
    toolbarWrapperRef?: RefObject<HTMLDivElement>;
    onExpandBlockquotes?: () => void;
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
        handleAddAttachments,
        handleRemoveAttachment,
        handleRemoveUpload,
        pendingUploads,
        isOutside = false,
        outsideKey,
        mailSettings,
        userSettings,
        editorMetadata,
        isInert,
        toolbarCustomRender,
        isAssistantExpanded,
        toolbarWrapperRef,
        onExpandBlockquotes,
    }: Props,
    ref: Ref<HTMLElement>
) => {
    const attachments = getAttachments(message.data);
    const showAttachments = attachments.length + (pendingUploads?.length || 0) > 0;

    return (
        <section
            className={clsx([
                'flex-auto flex flex-column flex-nowrap relative composer-content',
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
                    handleAddAttachments={handleAddAttachments}
                    handleRemoveAttachment={handleRemoveAttachment}
                    mailSettings={mailSettings}
                    userSettings={userSettings}
                    editorMetadata={editorMetadata}
                    toolbarCustomRender={toolbarCustomRender}
                    hasAttachments={attachments.length > 0}
                    onExpandBlockquotes={onExpandBlockquotes}
                />
            </div>

            {/* Used to display the toolbar below the composer*/}
            {!editorMetadata.isPlainText && (
                <div
                    ref={toolbarWrapperRef}
                    // @ts-ignore
                    inert={isAssistantExpanded ? '' : undefined}
                />
            )}

            {showAttachments && (
                // Add a wrapping div so that Dropzone does not break the UI
                <div>
                    <Dropzone onDrop={handleAddAttachments} shape="invisible">
                        <AttachmentList
                            attachments={attachments}
                            pendingUploads={pendingUploads}
                            message={message as MessageStateWithData}
                            primaryAction={AttachmentAction.Preview}
                            secondaryAction={AttachmentAction.Remove}
                            collapsable
                            handleRemoveAttachment={handleRemoveAttachment}
                            handleRemoveUpload={handleRemoveUpload}
                            className={clsx(['composer-attachments-list', isOutside && 'eo-composer-attachments-list'])}
                            outsideKey={outsideKey}
                            noPaddingTop={!isOutside}
                        />
                    </Dropzone>
                </div>
            )}
        </section>
    );
};

export default forwardRef(ComposerContent);
