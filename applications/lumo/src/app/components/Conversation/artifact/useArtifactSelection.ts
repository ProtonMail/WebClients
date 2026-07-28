import { type RefObject, useCallback, useEffect, useState } from 'react';

import type { PopperPosition } from '@proton/components/components/popper/interface';

export interface ArtifactSelection {
    text: string;
    position: PopperPosition;
    /** Viewport Y coordinate of the selection's bottom edge — used to anchor inline edit UI. */
    anchorBottom: number;
}

/**
 * Tracks a text selection made inside a ref'd container, exposing its text and the
 * bounding rect of the selection so a floating action can be anchored to it. Mirrors the
 * mouseup + `document.getSelection()` + `container.contains(anchorNode/focusNode)` pattern
 * used by Mail's composer assistant (`useComposerAssistantSelectedText.ts`), adapted here
 * as a standalone hook with no composer-specific dependencies.
 */
export function useArtifactSelection(containerRef: RefObject<HTMLDivElement>) {
    const [selection, setSelection] = useState<ArtifactSelection | null>(null);

    const clearSelection = useCallback(() => {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    }, []);

    useEffect(() => {
        const handleMouseUp = () => {
            const container = containerRef.current;
            const domSelection = document.getSelection();

            if (!container || !domSelection || domSelection.isCollapsed) {
                // Do not clear here — focus moves to the inline edit input and collapses
                // the DOM selection. Dismissal is handled by ArtifactInlineEdit (click
                // outside, Escape, scroll, submit).
                return;
            }

            const isInContainer =
                container.contains(domSelection.anchorNode) && container.contains(domSelection.focusNode);
            const text = domSelection.toString().trim();

            if (!isInContainer || !text) {
                setSelection(null);
                return;
            }

            const rect = domSelection.getRangeAt(0).getBoundingClientRect();
            setSelection({
                text,
                position: { top: rect.top, left: rect.left + rect.width / 2 },
                anchorBottom: rect.bottom,
            });
        };

        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [containerRef]);

    // Dismiss when the user scrolls the artifact content — fixed-position UI would drift.
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !selection) {
            return;
        }

        const scrollables = container.querySelectorAll('.artifact-code-content, .artifact-document-content');
        const handleScroll = () => {
            clearSelection();
        };

        scrollables.forEach((el) => {
            el.addEventListener('scroll', handleScroll);
        });
        return () => {
            scrollables.forEach((el) => {
                el.removeEventListener('scroll', handleScroll);
            });
        };
    }, [selection, clearSelection, containerRef]);

    return { selection, clearSelection };
}
