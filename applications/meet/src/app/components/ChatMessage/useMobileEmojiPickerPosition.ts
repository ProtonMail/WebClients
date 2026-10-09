import type { CSSProperties, RefObject } from 'react';
import { useLayoutEffect, useState } from 'react';

import { autoUpdate } from '@floating-ui/dom';

// emoji-mart's default and minimum host heights.
const EMOJI_PICKER_HEIGHT = 435;
const EMOJI_PICKER_MIN_HEIGHT = 230;

const hiddenStyle: CSSProperties = {
    top: -9999,
    left: -9999,
};

// Pinned above the anchor (end-aligned) in layout viewport coordinates, so it moves together with the
// anchor. The only adjustment is shrinking once it would cross the top of the visible viewport.
export const getMobileEmojiPickerStyle = (
    anchor: HTMLElement,
    floating: HTMLElement,
    offset: number,
    margin: number
): CSSProperties => {
    const anchorRect = anchor.getBoundingClientRect();
    const visibleTop = window.visualViewport?.offsetTop ?? 0;
    const spaceAbove = Math.floor(anchorRect.top - visibleTop - offset - margin);
    const height = Math.max(EMOJI_PICKER_MIN_HEIGHT, Math.min(EMOJI_PICKER_HEIGHT, spaceAbove));

    const maxLeft = window.innerWidth - floating.offsetWidth - margin;
    const left = Math.max(margin, Math.min(anchorRect.right - floating.offsetWidth, maxLeft));

    return {
        top: anchorRect.top - offset - height,
        left,
        '--emoji-picker-max-height': `${height}px`,
    };
};

export const useMobileEmojiPickerStyle = (
    anchorRef: RefObject<HTMLElement | null>,
    floatingRef: RefObject<HTMLElement | null>,
    isOpen: boolean,
    offset: number,
    margin: number
) => {
    const [style, setStyle] = useState<CSSProperties>(hiddenStyle);

    useLayoutEffect(() => {
        const anchor = anchorRef.current;
        const floating = floatingRef.current;

        if (!isOpen || !anchor || !floating) {
            return;
        }

        const update = () => {
            setStyle(getMobileEmojiPickerStyle(anchor, floating, offset, margin));
        };

        const stopAutoUpdate = autoUpdate(anchor, floating, update);

        // The keyboard and page panning move the visible viewport without moving the anchor.
        const viewport = window.visualViewport;
        viewport?.addEventListener('resize', update);
        viewport?.addEventListener('scroll', update);

        return () => {
            stopAutoUpdate();
            viewport?.removeEventListener('resize', update);
            viewport?.removeEventListener('scroll', update);
            setStyle(hiddenStyle);
        };
    }, [isOpen, offset, margin, anchorRef, floatingRef]);

    return style;
};
