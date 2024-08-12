import type { ReactNode, RefObject } from 'react';
import { useCallback } from 'react';

import { Dropzone } from '@proton/components/components';
import type { ToolbarConfig } from '@proton/components/components/editor/helpers/getToolbarConfig';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { DropzoneContentProps } from '../dropzone/DropzoneContent';
import { EDITOR_DEFAULT_METADATA } from './constants';
import type { EditorActions, EditorMetadata, SetEditorToolbarConfig } from './interface';
import DefaultFontModal from './modals/DefaultFontModal';
import InsertImageModal from './modals/InsertImageModal';
import InsertLinkModal from './modals/InsertLinkModal/InsertLinkModal';
import PlainTextEditor from './plainTextEditor/PlainTextEditor';
import RoosterEditor from './rooster/RoosterEditor';
import EditorToolbar from './toolbar/Toolbar';

export interface EditorProps {
    className?: string;
    editorToolbarClassname?: string;
    editorClassname?: string;
    metadata?: Partial<EditorMetadata>;
    onChange: (value: string) => void;
    onMouseUp?: () => void;
    onKeyUp?: () => void;
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
    /**
     * Used for locale in the emoji picker
     */
    userSettings?: UserSettings;
    isPlainText?: boolean;
    openEmojiPickerRef: RefObject<() => void>;
    toolbarConfig?: ToolbarConfig;
    setToolbarConfig: SetEditorToolbarConfig;
    modalLink: any;
    modalImage: any;
    modalDefaultFont: any;
    /**
     * Display or not the toolbar.
     * Toolbar contains actions like bold, italic, etc.
     */
    displayToolbar?: boolean;
    /**
     * Custom render function for the toolbar.
     * In case we want to add a wrapper around the toolbar for example.
     * @param toolbar The EditorToolbar component
     * @param displayToolbar The displayToolbar prop value
     */
    toolbarCustomRender?: (toolbar: ReactNode, displayToolbar: boolean) => ReactNode;
    hasDropzone?: boolean;
    /**
     * When true forces the small breakpoint behavior for toolbar
     * Leave undefined to use the default behavior
     */
    isSmallViewportForToolbar?: boolean;
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
    metadata: metadataProp,
    onChange = noop,
    onMouseUp = noop,
    onKeyUp = noop,
    simple,
    onFocus = noop,
    disabled = false,
    onReady = noop,
    showBlockquoteToggle,
    onBlockquoteToggleClick = noop,
    onAddAttachments,
    mailSettings,
    userSettings,
    isPlainText,
    openEmojiPickerRef,
    toolbarConfig,
    setToolbarConfig,
    modalLink,
    modalImage,
    modalDefaultFont,
    displayToolbar = true,
    toolbarCustomRender = (component, display) => (display ? component : null),
    hasDropzone = true,
    isSmallViewportForToolbar = undefined,
}: EditorProps) => {
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
        <PlainTextEditor
            onChange={onChange}
            onReady={onReady}
            onFocus={onFocus}
            onMouseUp={onMouseUp}
            onKeyUp={onKeyUp}
        />
    );

    return (
        <>
            <div
                className={clsx([
                    className,
                    simple && 'simple-editor',
                    'editor w-full h-full rounded flex flex-column-reverse flex-1',
                ])}
            >
                <div
                    className={clsx([
                        'h-full flex-1 flex flex-column relative flex-nowrap',
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
                            onMouseUp={onMouseUp}
                            onKeyUp={onKeyUp}
                        />
                    )}
                </div>

                {toolbarCustomRender(
                    <EditorToolbar
                        config={toolbarConfig}
                        metadata={metadata}
                        mailSettings={mailSettings}
                        className={editorToolbarClassname}
                        openEmojiPickerRef={openEmojiPickerRef}
                        simple={simple}
                        isSmallViewportForToolbar={isSmallViewportForToolbar}
                        userSettings={userSettings}
                    />,
                    displayToolbar
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
