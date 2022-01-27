import { ChangeEvent, useEffect, useRef } from 'react';
import { useIsMounted } from '../../..';
import { EditorActions } from '../interface';

interface Props {
    onChange: (value: string) => void;
    placeholder?: string;
    onReady: (editorActions: EditorActions) => void;
    onFocus: () => void;
}

const PlainTextEditor = ({ onFocus, onReady, onChange, placeholder }: Props) => {
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
            isDisposed: () => isMountedCallback() === false,
        };
        onReady(actions);
    }, []);

    return (
        <textarea
            className="covered-absolute w100 h100 pt0-5 pb1 pl0-5 pr0-5"
            ref={textareaRef}
            onFocus={onFocus}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                onChange(event.target.value);
            }}
            placeholder={placeholder}
            data-test-id="composer:body"
            data-testid="editor-textarea"
        />
    );
};

export default PlainTextEditor;
