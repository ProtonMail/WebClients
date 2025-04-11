import type { ChangeEvent, ClipboardEvent, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import useIsMounted from '@proton/hooks/useIsMounted';

import type { EditorActions } from '../interface';

interface Props {
    onChange: (value: string) => void;
    onMouseUp?: () => void;
    onKeyUp?: () => void;
    onReady: (editorActions: EditorActions) => void;
    onFocus: () => void;
    onPasteFiles: (files: File[]) => void;
    // Needed for dropzone
    children?: ReactNode;
}

const PlainTextEditor = ({
    onFocus,
    onReady,
    onChange,
    onMouseUp,
    onKeyUp,
    onPasteFiles,
    children,
    ...rest
}: Props) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isMountedCallback = useIsMounted();
    const mouseDownRef = useRef(false);

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
            insertContent: (content: string) => {
                if (textareaRef.current) {
                    textareaRef.current.value = textareaRef.current.value + content;
                }
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

    // Listen mouse up at document lvl to handle the case when the user clicks
    // outside the editor
    useEffect(() => {
        const handleMouseUp = () => {
            if (mouseDownRef.current) {
                mouseDownRef.current = false;
                onMouseUp?.();
            }
        };
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleMouseDown = () => {
        mouseDownRef.current = true;
    };

    const handlePaste = async (e: ClipboardEvent) => {
        const {
            clipboardData: { files },
        } = e;

        const filesArray = Array.from(files);
        if (filesArray && filesArray.length > 0) {
            onPasteFiles(filesArray);
            e.preventDefault();
            e.stopPropagation();
        }
    };

    return (
        <div className="w-full h-full pt-2 pb-4 px-2" {...rest}>
            <textarea
                className="w-full h-full editor-textarea outline-none--at-all"
                ref={textareaRef}
                onFocus={onFocus}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                    onChange(event.target.value);
                }}
                onMouseDown={handleMouseDown}
                onPaste={handlePaste}
                onKeyUp={onKeyUp}
                data-testid="editor-textarea"
            />
            {children}
        </div>
    );
};

export default PlainTextEditor;
