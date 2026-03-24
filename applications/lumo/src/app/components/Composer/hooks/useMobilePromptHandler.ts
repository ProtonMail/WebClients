import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useEffect } from 'react';

export const useMobilePromptHandler = (
    setValue: Dispatch<SetStateAction<string>>,
    textareaRef: MutableRefObject<HTMLTextAreaElement | null>
): void => {
    useEffect(() => {
        const handler = (prompt: string) => {
            const text = prompt.trim();
            if (!text) return;
            setValue((prev) => {
                if (!prev) return text;
                return prev.endsWith(' ') ? `${prev}${text}` : `${prev} ${text}`;
            });
            textareaRef.current?.focus();
        };

        // CRITICAL: pre-initialize so typeof check passes when mobile calls injectSpokenText.
        // Mobile assigns window.insertPromptAndSubmit once (injectEssentialJavaScript) then only
        // CALLS it (injectSpokenText) — the set trap alone is not enough.
        (window as any).__insertPromptImpl = handler;

        Object.defineProperty(window, 'insertPromptAndSubmit', {
            set(_mobileFn: unknown) {
                // Mobile re-injected (e.g. page reload) — keep our React-aware handler
                (window as any).__insertPromptImpl = handler;
            },
            get() {
                return (window as any).__insertPromptImpl;
            },
            configurable: true,
        });

        return () => {
            delete (window as any).insertPromptAndSubmit;
            delete (window as any).__insertPromptImpl;
        };
    }, [setValue, textareaRef]);
};
