import { useEffect, useRef } from 'react';

/**
 * Populates the editor with a query string exactly once per unique value.
 * If `onReady` is provided, calls it after setting content (auto-submit mode).
 * If omitted, focuses the cursor at the end of the content (prefill mode).
 *
 * Note: `onReady` should be a stable callback reference (e.g. wrapped in useCallback)
 * to prevent the effect from re-running unnecessarily.
 */
export const useEditorQuery = (
    query: string | undefined,
    editor: any,
    isProcessingAttachment: boolean,
    onReady?: (editor: any) => void
) => {
    const hasExecuted = useRef(false);
    const lastQuery = useRef<string | null>(null);

    useEffect(() => {
        if (query !== lastQuery.current) {
            hasExecuted.current = false;
            lastQuery.current = query || null;
        }

        if (query && editor && !hasExecuted.current && !isProcessingAttachment) {
            editor.commands.setContent(query);
            hasExecuted.current = true;

            if (onReady) {
                setTimeout(() => onReady(editor), 100);
            } else {
                editor.commands.focus('end');
            }
        }
    }, [query, editor, isProcessingAttachment, onReady]);
};
