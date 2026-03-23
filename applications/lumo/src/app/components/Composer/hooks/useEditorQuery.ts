import { useEffect, useRef } from 'react';

/**
 * Populates the textarea with a query string exactly once per unique value.
 * If `onReady` is provided, calls it after setting content (auto-submit mode).
 * If omitted, focuses the cursor at the end of the content (prefill mode).
 *
 * Note: `onReady` should be a stable callback reference (e.g. wrapped in useCallback)
 * to prevent the effect from re-running unnecessarily.
 */
export const useEditorQuery = (
    query: string | undefined,
    textareaRef: React.RefObject<HTMLTextAreaElement>,
    setValue: (value: string) => void,
    isProcessingAttachment: boolean,
    onReady?: () => void
) => {
    const hasExecuted = useRef(false);
    const lastQuery = useRef<string | null>(null);

    useEffect(() => {
        if (query !== lastQuery.current) {
            hasExecuted.current = false;
            lastQuery.current = query || null;
        }

        if (query && !hasExecuted.current && !isProcessingAttachment) {
            setValue(query);
            hasExecuted.current = true;

            if (onReady) {
                setTimeout(() => onReady(), 100);
            } else {
                setTimeout(() => {
                    const textarea = textareaRef.current;
                    if (textarea) {
                        textarea.focus();
                        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                    }
                }, 0);
            }
        }
    }, [query, textareaRef, setValue, isProcessingAttachment, onReady]);
};
