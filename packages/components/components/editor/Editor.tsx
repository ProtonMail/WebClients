import { useCallback } from 'react';
import { BeforePasteEvent } from 'roosterjs-editor-types';
import { noop } from '@proton/shared/lib/helpers/function';
import { MailSettings } from '@proton/shared/lib/interfaces';

import { classnames } from '../../helpers';

import EditorToolbar from './toolbar/Toolbar';
import { EditorActions, EditorMetadata } from './interface';
import { EDITOR_DEFAULT_METADATA, EMBEDDABLE_TYPES } from './constants';
import useToolbarConfig from './hooks/useToolbarConfig';
import useModalDefaultFont from './hooks/useModalDefaultFont';
import useModalImage from './hooks/useModalImage';
import useModalLink from './hooks/useModalLink';
import RoosterEditor from './rooster/RoosterEditor';
import PlainTextEditor from './plainTextEditor/PlainTextEditor';

interface Props {
    className?: string;
    placeholder?: string;
    metadata?: Partial<EditorMetadata>;
    onChange?: (value: string) => void;
    onChangeMetadata?: (metadataChange: Partial<EditorMetadata>) => void;
    showBlockquoteToggle?: boolean;
    onBlockquoteToggleClick?: () => void;
    disabled?: boolean;
    onReady: (editorActions: EditorActions) => void;
    simple?: boolean;
    onFocus?: () => void;
    onAddAttachments?: (files: File[]) => void;
    isOutside?: boolean;
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

    const showModalLink = useModalLink();
    const showModalImage = useModalImage();
    const showModalDefaultFont = useModalDefaultFont();

    const [toolbarConfig, setToolbarConfig] = useToolbarConfig({
        showModalImage,
        showModalLink,
        showModalDefaultFont,
        onChangeMetadata,
        onAddAttachments,
    });

    const handleBeforePaste = useCallback(
        (event: BeforePasteEvent) => {
            // Skip if no image support
            if (!metadata.supportImages) {
                return;
            }

            const { image } = event.clipboardData;
            if (image) {
                // we replace pasted content by empty string
                event.fragment.textContent = '';
                // Check if image type is supported
                const isSupportedFileType = EMBEDDABLE_TYPES.includes(image.type);
                if (isSupportedFileType && onAddAttachments) {
                    // Then show modal
                    onAddAttachments([event.clipboardData.image]);
                }
            }
        },
        [onAddAttachments]
    );

    return (
        <div
            className={classnames([
                className,
                simple && 'simple-editor',
                'editor w100 h100 rounded flex flex-column-reverse',
            ])}
            onFocus={onFocus}
        >
            <div className={classnames(['w100 h100 flex-item-fluid relative', disabled && 'editor--disabled'])}>
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
                        disabled={disabled}
                        onReady={onReady}
                        showBlockquoteToggle={showBlockquoteToggle}
                        onBlockquoteToggleClick={onBlockquoteToggleClick}
                        setToolbarConfig={setToolbarConfig}
                        onBeforePaste={handleBeforePaste}
                        showModalLink={showModalLink}
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
    );
};

export default Editor;
