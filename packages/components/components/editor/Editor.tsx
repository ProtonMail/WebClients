import { RefObject, useCallback } from 'react';

import { Dropzone } from '@proton/components/components';
import { ToolbarConfig } from '@proton/components/components/editor/helpers/getToolbarConfig';
import { MailSettings } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { DropzoneContentProps } from '../dropzone/DropzoneContent';
import { EDITOR_DEFAULT_METADATA } from './constants';
import { EditorActions, EditorMetadata, SetEditorToolbarConfig } from './interface';
import DefaultFontModal from './modals/DefaultFontModal';
import InsertImageModal from './modals/InsertImageModal';
import InsertLinkModal from './modals/InsertLinkModal/InsertLinkModal';
import PlainTextEditor from './plainTextEditor/PlainTextEditor';
import RoosterEditor from './rooster/RoosterEditor';
import EditorToolbar from './toolbar/Toolbar';

interface Props {
    className?: string;
    editorToolbarClassname?: string;
    editorClassname?: string;
    placeholder?: string;
    metadata?: Partial<EditorMetadata>;
    onChange: (value: string) => void;
    showBlockquoteToggle?: boolean;
    onBlockquoteToggleClick?: () => void;
    disabled?: boolean;
    onReady: (editorActions: EditorActions) => void;
    simple?: boolean;
    onFocus?: () => void;
    onAddAttachments?: (files: File[]) => void;
    /**
     * Are used for editor default font value
     * It's optionnal but if passed it should be passed
     * at same time component is first rendered
     */
    mailSettings?: MailSettings;
    isPlainText?: boolean;
    openEmojiPickerRef: RefObject<() => void>;
    toolbarConfig?: ToolbarConfig;
    setToolbarConfig: SetEditorToolbarConfig;
    modalLink: any;
    modalImage: any;
    modalDefaultFont: any;
    hasToolbar?: boolean;
    hasDropzone?: boolean;
}

const DROPZONE_COMPOSER_SETTINGS: DropzoneContentProps = {
    shape: 'white',
    border: true,
    rounded: true,
};

const Editor = ({
    className,
    editorClassname,
    editorToolbarClassname,
    placeholder,
    metadata: metadataProp,
    onChange = noop,
    simple,
    onFocus = noop,
    disabled = false,
    onReady = noop,
    showBlockquoteToggle,
    onBlockquoteToggleClick = noop,
    onAddAttachments,
    mailSettings,
    isPlainText,
    openEmojiPickerRef,
    toolbarConfig,
    setToolbarConfig,
    modalLink,
    modalImage,
    modalDefaultFont,
    hasToolbar = true,
    hasDropzone = true,
}: Props) => {
    /**
     * Set to true when editor setContent is called by parent components
     * in order to prevent onChange callback
     */
    const metadata: EditorMetadata = { ...EDITOR_DEFAULT_METADATA, ...metadataProp };

    const onPasteImage = useCallback(
        (imageFile: File) => {
            if (metadata.supportImages) {
                onAddAttachments?.([imageFile]);
            }
        },
        [onAddAttachments, metadata.supportImages]
    );

    const plaintextEditor = (
        <PlainTextEditor onChange={onChange} placeholder={placeholder} onReady={onReady} onFocus={onFocus} />
    );

    return (
        <>
            <div
                className={clsx([
                    className,
                    simple && 'simple-editor',
                    'editor w100 h100 rounded flex flex-column-reverse flex-item-fluid',
                ])}
            >
                <div
                    className={clsx([
                        'h100 flex-item-fluid flex flex-column relative',
                        disabled && 'editor--disabled',
                        isPlainText ? '' : 'composer-content--rich-edition',
                        editorClassname,
                    ])}
                >
                    {metadata.isPlainText ? (
                        !!onAddAttachments ? (
                            <Dropzone onDrop={onAddAttachments}>{plaintextEditor}</Dropzone>
                        ) : (
                            plaintextEditor
                        )
                    ) : (
                        <RoosterEditor
                            placeholder={placeholder}
                            onChange={onChange}
                            onReady={onReady}
                            showBlockquoteToggle={showBlockquoteToggle}
                            onBlockquoteToggleClick={onBlockquoteToggleClick}
                            setToolbarConfig={setToolbarConfig}
                            onPasteImage={onPasteImage}
                            showModalLink={modalLink.showCallback}
                            onFocus={onFocus}
                            mailSettings={mailSettings}
                            className={simple ? 'border rounded' : ''}
                            openEmojiPicker={() => openEmojiPickerRef.current?.()}
                            dropzone={hasDropzone ? DROPZONE_COMPOSER_SETTINGS : undefined}
                            onAddAttachments={onAddAttachments}
                        />
                    )}
                </div>

                {hasToolbar && (
                    <EditorToolbar
                        config={toolbarConfig}
                        metadata={metadata}
                        mailSettings={mailSettings}
                        className={editorToolbarClassname}
                        openEmojiPickerRef={openEmojiPickerRef}
                        simple={simple}
                    />
                )}
            </div>

            <div
                onSubmit={(e) => {
                    e.stopPropagation();
                }}
            >
                {modalDefaultFont.render && metadata.supportDefaultFontSelector && (
                    <DefaultFontModal {...modalDefaultFont.props} {...modalDefaultFont.modalsStateProps} />
                )}
                {modalImage.render && <InsertImageModal {...modalImage.props} {...modalImage.modalsStateProps} />}
                {modalLink.render && modalLink.props && (
                    <InsertLinkModal {...modalLink.props} modalStateProps={modalLink.modalsStateProps} />
                )}
            </div>
        </>
    );
};

export default Editor;
