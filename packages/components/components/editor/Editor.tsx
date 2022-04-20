import { useCallback } from 'react';
import { noop } from '@proton/shared/lib/helpers/function';
import { MailSettings } from '@proton/shared/lib/interfaces';

import { classnames } from '../../helpers';

import EditorToolbar from './toolbar/Toolbar';
import { EditorActions, EditorMetadata } from './interface';
import { EDITOR_DEFAULT_METADATA } from './constants';
import useToolbarConfig from './hooks/useToolbarConfig';
import RoosterEditor from './rooster/RoosterEditor';
import PlainTextEditor from './plainTextEditor/PlainTextEditor';
import DefaultFontModal from './modals/DefaultFontModal';
import InsertImageModal from './modals/InsertImageModal';
import useEditorModal from './hooks/useEditorModal';
import { ModalDefaultFontProps, ModalImageProps, ModalLinkProps } from './hooks/interface';
import InsertLinkModal from './modals/InsertLinkModal';

interface Props {
    className?: string;
    placeholder?: string;
    metadata?: Partial<EditorMetadata>;
    onChange: (value: string) => void;
    onChangeMetadata?: (metadataChange: Partial<EditorMetadata>) => void;
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
}

const Editor = ({
    className,
    placeholder,
    metadata: metadataProp,
    onChange = noop,
    onChangeMetadata = noop,
    simple,
    onFocus = noop,
    disabled = false,
    onReady = noop,
    showBlockquoteToggle,
    onBlockquoteToggleClick = noop,
    onAddAttachments,
    mailSettings,
}: Props) => {
    /**
     * Set to true when editor setContent is called by parent components
     * in order to prevent onChange callback
     */
    const metadata: EditorMetadata = { ...EDITOR_DEFAULT_METADATA, ...metadataProp };

    const modalLink = useEditorModal<ModalLinkProps>();
    const modalImage = useEditorModal<ModalImageProps>();
    const modalDefaultFont = useEditorModal<ModalDefaultFontProps>();

    const [toolbarConfig, setToolbarConfig] = useToolbarConfig({
        showModalImage: modalImage.showCallback,
        showModalLink: modalLink.showCallback,
        showModalDefaultFont: modalDefaultFont.showCallback,
        onChangeMetadata,
        onAddAttachments,
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
                        'w100 h100 flex-item-fluid flex flex-column relative',
                        disabled && 'editor--disabled',
                    ])}
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
                        />
                    )}
                </div>

                <EditorToolbar
                    config={toolbarConfig}
                    metadata={metadata}
                    onChangeMetadata={onChangeMetadata}
                    mailSettings={mailSettings}
                />
            </div>
            {modalDefaultFont.render && metadata.supportDefaultFontSelector && (
                <DefaultFontModal {...modalDefaultFont.props} />
            )}
            {modalImage.render && <InsertImageModal {...modalImage.props} />}
            {modalLink.render && <InsertLinkModal {...modalLink.props} />}
        </>
    );
};

export default Editor;
