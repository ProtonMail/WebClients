import { useCallback, useRef, useState } from 'react';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { shouldConvertPasteToAttachment } from '../util/pastedContentHelper';

export interface ComposerInputProps {
    onSubmitCallback: (value: string) => void;
    content?: string;
    isGenerating?: boolean;
    isProcessingAttachment?: boolean;
    isAutocompleteActiveRef?: React.MutableRefObject<boolean>;
    onFocus?: () => void;
    onBlur?: () => void;
    onPasteLargeContent?: (content: string) => void;
}

const useComposerInput = ({
    onSubmitCallback,
    content,
    isGenerating,
    isProcessingAttachment,
    isAutocompleteActiveRef,
    onFocus,
    onBlur,
    onPasteLargeContent,
}: ComposerInputProps) => {
    const [value, setValue] = useState(content || '');
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const cursorPositionRef = useRef<number>(0);

    const updateCursorPosition = useCallback(() => {
        if (textareaRef.current) {
            cursorPositionRef.current = textareaRef.current.selectionStart ?? 0;
        }
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        cursorPositionRef.current = e.target.selectionStart ?? 0;
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (isGenerating || isProcessingAttachment) {
                return;
            }

            const isEnter = e.key === 'Enter';
            if (!isEnter) {
                return;
            }

            // If autocomplete is active, let the autocomplete handler take over
            if (isAutocompleteActiveRef?.current) {
                return;
            }

            if (isMobile()) {
                // Mobile: allow default new-line behaviour
                return;
            }

            if (e.shiftKey) {
                // Shift+Enter: allow default new-line behaviour
                return;
            }

            // Enter: submit
            e.preventDefault();
            if (value.trim()) {
                onSubmitCallback(value);
            }
        },
        [isGenerating, isProcessingAttachment, isAutocompleteActiveRef, value, onSubmitCallback]
    );

    const handlePaste = useCallback(
        (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
            if (!onPasteLargeContent) {
                return;
            }
            const pastedText = e.clipboardData?.getData('text/plain');
            if (pastedText && shouldConvertPasteToAttachment(pastedText)) {
                e.preventDefault();
                onPasteLargeContent(pastedText);
            }
        },
        [onPasteLargeContent]
    );

    const handleSubmit = useCallback(() => {
        if (isProcessingAttachment) {
            return;
        }
        if (value.trim()) {
            onSubmitCallback(value);
        }
    }, [isProcessingAttachment, value, onSubmitCallback]);

    const clear = useCallback(() => {
        setValue('');
        cursorPositionRef.current = 0;
    }, []);

    const focus = useCallback((position?: 'end') => {
        const ta = textareaRef.current;
        if (!ta) {
            return;
        }
        ta.focus();
        if (position === 'end') {
            ta.setSelectionRange(ta.value.length, ta.value.length);
        }
    }, []);

    const isEmpty = value.trim().length === 0;

    return {
        value,
        setValue,
        textareaRef,
        cursorPositionRef,
        isEmpty,
        handleSubmit,
        handleChange,
        handleKeyDown,
        handlePaste,
        updateCursorPosition,
        onFocus,
        onBlur,
        clear,
        focus,
    };
};

export default useComposerInput;
