import { ChangeEvent, ReactNode, useEffect, useRef } from 'react';

import useIsMounted from '@proton/hooks/useIsMounted';

import { EditorActions } from '../interface';

interface Props {
    onChange: (value: string) => void;
    placeholder?: string;
    onReady: (editorActions: EditorActions) => void;
    onFocus: () => void;
    // Needed for dropzone
    children?: ReactNode;
}

const PlainTextEditor = ({ onFocus, onReady, onChange, placeholder, children, ...rest }: Props) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isMountedCallback = useIsMounted();

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
        };
        onReady(actions);
    }, []);

    return (
        <div className="w100 h100 pt-2 pb-4 px-2" {...rest}>
            <textarea
                className="w100 h100"
                ref={textareaRef}
                onFocus={onFocus}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                    onChange(event.target.value);
                }}
                placeholder={placeholder}
                data-testid="editor-textarea"
            />
            {children}
        </div>
    );
};

export default PlainTextEditor;
