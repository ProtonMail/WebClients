import { ChangeEvent, ReactNode, useEffect, useRef } from 'react';

import useIsMounted from '@proton/hooks/useIsMounted';

import { EditorActions } from '../interface';

interface Props {
    onChange: (value: string) => void;
    onReady: (editorActions: EditorActions) => void;
    onFocus: () => void;
    // Needed for dropzone
    children?: ReactNode;
}

const PlainTextEditor = ({ onFocus, onReady, onChange, children, ...rest }: Props) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isMountedCallback = useIsMounted();

    let beforeSelection: string;
    let afterSelection: string;

    useEffect(() => {
        const actions: EditorActions = {
            focus: () => {
                textareaRef.current?.focus();
            },
            getContent: () => {
                return textareaRef.current?.value || '';
            },
            setContent: (value: string) => {
                if (textareaRef.current) {
                    textareaRef.current.value = value;
                    // setTimeout is needed for Firefox
                    // I guess setting the value is async and we have to release the thread before touching to the selection
                    setTimeout(() => textareaRef.current?.setSelectionRange(0, 0));
                }
            },
            isDisposed: () => isMountedCallback() === false || !textareaRef.current,
            scroll: (scrollToOption: ScrollToOptions) => {
                textareaRef.current?.scrollTo?.(scrollToOption);
            },
            getSelectionContent: () => {
                const textarea = textareaRef.current;
                if (!textarea) {
                    return;
                }
                beforeSelection = textarea.value.slice(0, textarea.selectionStart);
                afterSelection = textarea.value.slice(textarea.selectionEnd, textarea.value.length);

                return textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
            },
            setSelectionContent: (content) => {
                const textarea = textareaRef.current;
                if (!textarea) {
                    return;
                }
                textarea.value = beforeSelection + content + afterSelection;
            },
        };
        onReady(actions);
    }, []);

    return (
        <div className="w-full h-full pt-2 pb-4 px-2" {...rest}>
            <textarea
                className="w-full h-full"
                ref={textareaRef}
                onFocus={onFocus}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                    onChange(event.target.value);
                }}
                data-testid="editor-textarea"
            />
            {children}
        </div>
    );
};

export default PlainTextEditor;
