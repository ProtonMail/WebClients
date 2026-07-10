import { useCallback, useRef } from 'react';
import type { KeyboardEvent } from 'react';

const ROW_SELECTOR = '[data-chat-message-row]';

const isTextEntry = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable;
};

const getRowFocusTarget = (row: HTMLElement): HTMLElement | null =>
    row.tabIndex >= 0 ? row : row.querySelector<HTMLElement>('button:not([disabled])');

export const useChatMessageListNavigation = <T extends HTMLElement = HTMLDivElement>() => {
    const containerRef = useRef<T>(null);

    const handleKeyDown = useCallback((event: KeyboardEvent<T>) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
            return;
        }

        if (isTextEntry(event.target)) {
            return;
        }

        const container = containerRef.current;
        if (!container) {
            return;
        }

        const rows = Array.from(container.querySelectorAll<HTMLElement>(ROW_SELECTOR)).filter(
            (row) => row.offsetParent !== null
        );
        if (!rows.length) {
            return;
        }

        const currentRow = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>(ROW_SELECTOR) ?? null;
        const currentIndex = currentRow ? rows.indexOf(currentRow) : -1;
        if (currentIndex === -1) {
            return;
        }

        const nextIndex = currentIndex + (event.key === 'ArrowDown' ? 1 : -1);
        if (nextIndex < 0 || nextIndex >= rows.length) {
            return;
        }

        const nextTarget = getRowFocusTarget(rows[nextIndex]);
        if (!nextTarget) {
            return;
        }

        event.preventDefault();
        nextTarget.focus();
    }, []);

    return {
        containerRef,
        navigationProps: {
            ref: containerRef,
            onKeyDown: handleKeyDown,
        },
    };
};
