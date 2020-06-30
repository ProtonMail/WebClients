import React, {
    MutableRefObject,
    useRef,
    useEffect,
    useState,
    ChangeEvent,
    MouseEventHandler,
    forwardRef,
    Ref,
    ReactNode
} from 'react';
import { RIGHT_TO_LEFT } from 'proton-shared/lib/constants';
import { noop } from 'proton-shared/lib/helpers/function';

import { Button } from '../button';
import { classnames } from '../../helpers/component';

import EditorToolbar from './toolbar/SquireToolbar';
import SquireIframe from './SquireIframe';
import { SquireType } from './squireConfig';
import { setTextDirectionWithoutFocus, insertImage } from './squireActions';

import './SquireEditor.scss';

export interface SquireEditorMetadata {
    supportImages: boolean;
    supportPlainText: boolean;
    isPlainText: boolean;
    supportRightToLeft: boolean;
    rightToLeft: RIGHT_TO_LEFT;
}

const defaultMetadata: SquireEditorMetadata = {
    supportImages: true,
    supportPlainText: false,
    isPlainText: false,
    supportRightToLeft: false,
    rightToLeft: RIGHT_TO_LEFT.OFF
};

export interface SquireEditorRef {
    focus: () => void;
    value: string;
    document?: Element;
    insertImage: (url: string, attrs?: { [key: string]: string | undefined }) => void;
}

interface Props {
    className?: string;
    placeholder?: string;
    metadata?: Partial<SquireEditorMetadata>;
    onChange?: (value: string) => void;
    onChangeMetadata?: (metadataChange: Partial<SquireEditorMetadata>) => void;
    isNarrow?: boolean;
    showEllipseButton?: boolean;
    onEllipseClick?: MouseEventHandler;
    disabled?: boolean;
    onReady?: () => void;
    onFocus?: () => void;
    onAddImages?: (files: File[]) => void;
    toolbarMoreDropdownExtension?: ReactNode;
}

/**
 * This component is *Uncontrolled*
 * https://reactjs.org/docs/uncontrolled-components.html
 * There is issues when trying to synchronize input value to the current content of the editor
 * Uncontrolled components is prefered in this case
 * Look at the specific SquireEditorRef provided to set initial value
 */
const SquireEditor = forwardRef(
    (
        {
            className,
            placeholder,
            metadata: inputMetadata = defaultMetadata,
            onChange = noop,
            onChangeMetadata = noop,
            isNarrow = false,
            showEllipseButton = false,
            onEllipseClick = noop,
            disabled = false,
            onReady = noop,
            onFocus = noop,
            onAddImages = noop,
            toolbarMoreDropdownExtension = null
        }: Props,
        ref: Ref<SquireEditorRef>
    ) => {
        const [editorReady, setEditorReady] = useState(false);

        const squireRef = useRef<SquireType>(null) as MutableRefObject<SquireType>;
        const textareaRef = useRef<HTMLTextAreaElement>(null);

        const metadata: SquireEditorMetadata = { ...defaultMetadata, ...inputMetadata };

        useEffect(() => {
            const mutableRef = ref as MutableRefObject<SquireEditorRef>;
            mutableRef.current = {
                get value() {
                    if (metadata.isPlainText) {
                        return textareaRef.current?.value || '';
                    } else {
                        return squireRef.current?.getHTML() || '';
                    }
                },
                set value(value: string) {
                    if (metadata.isPlainText) {
                        textareaRef.current && (textareaRef.current.value = value);
                    } else {
                        squireRef.current?.setHTML(value);
                        setTextDirectionWithoutFocus(squireRef.current, metadata.rightToLeft || RIGHT_TO_LEFT.OFF);
                        squireRef.current?.fireEvent('input'); // For Squire to be aware of the change
                    }
                },
                get document() {
                    if (metadata.isPlainText) {
                        return undefined;
                    } else {
                        return (squireRef.current.getDocument() as any) as Element;
                    }
                },
                focus: () => {
                    if (metadata.isPlainText) {
                        textareaRef.current?.focus();
                        textareaRef.current?.setSelectionRange(0, 0);
                    } else {
                        squireRef.current?.focus();
                    }
                },
                insertImage: (url: string, attrs: { [key: string]: string | undefined } = {}) => {
                    insertImage(squireRef.current, url, attrs);
                }
            };
        }, [metadata]);

        useEffect(() => {
            if (metadata.isPlainText) {
                onReady();
                setEditorReady(false);
            }
        }, [editorReady, metadata.isPlainText]);

        const handleReady = () => {
            onReady();
            setEditorReady(true);
        };

        const handlePlainTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
            onChange(event.target.value);
        };

        return (
            <div
                className={classnames([
                    className,
                    'editor w100 h100 rounded flex flex-column',
                    disabled && 'editor--disabled',
                    showEllipseButton && 'editor--showEllipsisButton'
                ])}
            >
                <EditorToolbar
                    metadata={metadata}
                    onChangeMetadata={onChangeMetadata}
                    squireRef={squireRef}
                    isNarrow={isNarrow}
                    editorReady={editorReady}
                    onAddImages={onAddImages}
                    moreDropdownExtension={toolbarMoreDropdownExtension}
                />
                {metadata.isPlainText ? (
                    <textarea
                        className="w100 h100 flex-item-fluid pt1 pb1 pl0-5 pr0-5"
                        ref={textareaRef}
                        onFocus={onFocus}
                        onChange={handlePlainTextChange}
                        placeholder={placeholder}
                    />
                ) : (
                    <>
                        <SquireIframe
                            ref={squireRef}
                            placeholder={placeholder}
                            metadata={metadata}
                            onFocus={onFocus}
                            onReady={handleReady}
                            onInput={onChange}
                            onAddImages={onAddImages}
                        />
                        {showEllipseButton && (
                            <div className="editor-ellipsis-button-container p0-5 bg-white color-global-grey">
                                <Button className="pm-button--small" onClick={onEllipseClick}>
                                    ...
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }
);

export default SquireEditor;
