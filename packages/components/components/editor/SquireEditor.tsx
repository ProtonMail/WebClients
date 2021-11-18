import { MutableRefObject, useRef, useEffect, useState, ChangeEvent, forwardRef, Ref, useMemo, memo } from 'react';
import { RIGHT_TO_LEFT } from '@proton/shared/lib/constants';
import { noop } from '@proton/shared/lib/helpers/function';
import { classnames } from '../../helpers';
import EditorToolbar from './toolbar/SquireToolbar';
import SquireIframe from './SquireIframe';
import { setTextDirectionWithoutFocus, insertImage, clearUndoHistory } from './squireActions';
import { FontData, SquireEditorMetadata, SquireType } from './interface';

import './SquireEditor.scss';

const defaultMetadata: SquireEditorMetadata = {
    supportImages: true,
    supportPlainText: false,
    isPlainText: false,
    supportRightToLeft: false,
    rightToLeft: RIGHT_TO_LEFT.OFF,
};

export interface SquireEditorRef {
    focus: () => void;
    value: string;
    document?: Element;
    insertImage: (url: string, attrs?: { [key: string]: string | undefined }) => void;
    /**
     * Clear Squire undo history, do nothing in plaintext mode
     */
    clearUndoHistory: () => void;
}

interface Props {
    id?: string;
    className?: string;
    placeholder?: string;
    metadata?: Partial<SquireEditorMetadata>;
    onChange?: (value: string) => void;
    onChangeMetadata?: (metadataChange: Partial<SquireEditorMetadata>) => void;
    isNarrow?: boolean;
    showEllipseButton?: boolean;
    onEllipseClick?: () => void;
    disabled?: boolean;
    onReady?: () => void;
    onFocus?: () => void;
    onAddImages?: (files: File[]) => void;
    keydownHandler?: (e: KeyboardEvent) => void;
    defaultFont?: FontData;
}

/**
 * This component is *Uncontrolled*
 * https://reactjs.org/docs/uncontrolled-components.html
 * There is issues when trying to synchronize input value to the current content of the editor
 * Uncontrolled components is prefered in this case
 * Look at the specific SquireEditorRef provided to set initial value
 */
const SquireEditor = (
    {
        id,
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
        keydownHandler,
        defaultFont,
    }: Props,
    ref: Ref<SquireEditorRef>
) => {
    const [editorReady, setEditorReady] = useState(false);

    const squireRef = useRef<SquireType>(null) as MutableRefObject<SquireType>;
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const metadata: SquireEditorMetadata = useMemo(() => ({ ...defaultMetadata, ...inputMetadata }), [inputMetadata]);

    useEffect(() => {
        const mutableRef = ref as MutableRefObject<SquireEditorRef>;
        mutableRef.current = {
            get value() {
                if (metadata.isPlainText) {
                    return textareaRef.current?.value || '';
                }
                return squireRef.current?.getHTML() || '';
            },
            set value(value: string) {
                if (metadata.isPlainText) {
                    if (textareaRef.current) {
                        textareaRef.current.value = value;
                        // setTimeout is needed for Firefox
                        // I guess setting the value is async and we have to release the thread before touching to the selection
                        setTimeout(() => textareaRef.current?.setSelectionRange(0, 0));
                    }
                } else {
                    squireRef.current?.setHTML(value);
                    setTextDirectionWithoutFocus(squireRef.current, metadata.rightToLeft || RIGHT_TO_LEFT.OFF);
                    squireRef.current?.fireEvent('input'); // For Squire to be aware of the change
                }
            },
            get document() {
                if (metadata.isPlainText) {
                    return undefined;
                }
                return squireRef.current.getDocument() as any as Element;
            },
            focus: () => {
                if (metadata.isPlainText) {
                    textareaRef.current?.focus();
                } else {
                    squireRef.current?.focus();
                }
            },
            insertImage: (url: string, attrs: { [key: string]: string | undefined } = {}) => {
                insertImage(squireRef.current, url, attrs);
                onChange(squireRef.current?.getHTML());
            },
            clearUndoHistory: () => {
                if (squireRef.current) {
                    clearUndoHistory(squireRef.current);
                }
            },
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
        <div className={classnames([className, 'editor w100 h100 rounded flex flex-column-reverse'])}>
            <div className={classnames(['w100 h100 flex-item-fluid relative mt0-5', disabled && 'editor--disabled'])}>
                {metadata.isPlainText ? (
                    <textarea
                        id={id}
                        className="covered-absolute w100 h100 pt0-5 pb1 pl0-5 pr0-5"
                        ref={textareaRef}
                        onFocus={onFocus}
                        onChange={handlePlainTextChange}
                        placeholder={placeholder}
                        data-test-id="composer:body"
                        data-testid="squire-textarea"
                    />
                ) : (
                    <SquireIframe
                        id={id}
                        ref={squireRef}
                        placeholder={placeholder}
                        metadata={metadata}
                        onFocus={onFocus}
                        onReady={handleReady}
                        onInput={onChange}
                        onAddImages={onAddImages}
                        showEllipseButton={showEllipseButton}
                        onEllipseClick={onEllipseClick}
                        data-test-id="composer:body"
                        keydownHandler={keydownHandler}
                    />
                )}
            </div>
            <EditorToolbar
                metadata={metadata}
                onChangeMetadata={onChangeMetadata}
                squireRef={squireRef}
                isNarrow={isNarrow}
                editorReady={editorReady}
                onAddImages={onAddImages}
                defaultFont={defaultFont}
            />
        </div>
    );
};

export default memo(forwardRef(SquireEditor));
