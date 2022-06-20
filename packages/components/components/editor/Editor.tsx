import { Dispatch, DragEvent, RefObject, SetStateAction, useCallback } from 'react';

import { c } from 'ttag';

import { ToolbarConfig } from '@proton/components/components/editor/helpers/getToolbarConfig';
import { MailSettings } from '@proton/shared/lib/interfaces';
import dragAndDrop from '@proton/styles/assets/img/illustrations/drag-and-drop-img.svg';
import noop from '@proton/utils/noop';

import { classnames } from '../../helpers';
import { onlyDragFiles } from '../dropzone';
import { EDITOR_DEFAULT_METADATA } from './constants';
import { EditorActions, EditorMetadata, SetEditorToolbarConfig } from './interface';
import DefaultFontModal from './modals/DefaultFontModal';
import InsertImageModal from './modals/InsertImageModal';
import InsertLinkModal from './modals/InsertLinkModal';
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
    fileHover?: boolean;
    setFileHover?: Dispatch<SetStateAction<boolean>>;
    openEmojiPickerRef: RefObject<() => void>;
    toolbarConfig?: ToolbarConfig;
    setToolbarConfig: SetEditorToolbarConfig;
    modalLink: any;
    modalImage: any;
    modalDefaultFont: any;
    hasToolbar?: boolean;
    hasDropzone?: boolean;
}

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
    fileHover,
    setFileHover,
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

    const handleDrop = onlyDragFiles((event: DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setFileHover?.(false);
        onAddAttachments?.([...event.dataTransfer.files]);
    });

    /**
     * Listening for entering on the whole section
     * But for leaving only on the overlay to prevent any interception by the editor
     */
    const handleDragLeave = onlyDragFiles((event) => {
        event.stopPropagation();
        setFileHover?.(false);
    });

    const handleDragOver = onlyDragFiles((event) => {
        // In order to allow drop we need to preventDefault
        event.preventDefault();
        event.stopPropagation();
        setFileHover?.(true);
    });

    const onPasteImage = useCallback(
        (imageFile: File) => {
            if (metadata.supportImages) {
                onAddAttachments?.([imageFile]);
            }
        },
        [onAddAttachments, metadata.supportImages]
    );

    return (
        <>
            <div
                className={classnames([
                    className,
                    simple && 'simple-editor',
                    'editor w100 h100 rounded flex flex-column-reverse flex-item-fluid',
                ])}
            >
                <div
                    className={classnames([
                        'h100 flex-item-fluid flex flex-column relative',
                        disabled && 'editor--disabled',
                        isPlainText ? '' : 'composer-content--rich-edition',
                        editorClassname,
                    ])}
                    onDragOver={handleDragOver}
                >
                    {metadata.isPlainText ? (
                        <PlainTextEditor
                            onChange={onChange}
                            placeholder={placeholder}
                            onReady={onReady}
                            onFocus={onFocus}
                        />
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
                        />
                    )}

                    {fileHover && hasDropzone && (
                        <div
                            onDragLeave={handleDragLeave}
                            onDropCapture={handleDrop}
                            className={classnames([
                                'composer-editor-dropzone absolute-cover flex flex-justify-center flex-align-items-center rounded-xl',
                                /*!isOutside && */ 'mr1-75 ml1-75',
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
            {modalDefaultFont.render && metadata.supportDefaultFontSelector && (
                <DefaultFontModal {...modalDefaultFont.props} {...modalDefaultFont.modalsStateProps} />
            )}
            {modalImage.render && <InsertImageModal {...modalImage.props} {...modalImage.modalsStateProps} />}
            {modalLink.render && modalLink.props && (
                <InsertLinkModal
                    {...modalLink.props}
                    mailSettings={mailSettings}
                    modalStateProps={modalLink.modalsStateProps}
                />
            )}
        </>
    );
};

export default Editor;
