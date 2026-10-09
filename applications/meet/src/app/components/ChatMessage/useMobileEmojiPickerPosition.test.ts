import { afterEach, describe, expect, it, vi } from 'vitest';

import { getMobileEmojiPickerStyle } from './useMobileEmojiPickerPosition';

const OFFSET = 8;
const MARGIN = 8;

const createAnchor = (top: number, right: number) => {
    const anchor = document.createElement('button');
    anchor.getBoundingClientRect = () => ({ top, right, bottom: top + 36, left: right - 36 }) as DOMRect;
    return anchor;
};

const createFloating = (width: number) => {
    const floating = document.createElement('div');
    Object.defineProperty(floating, 'offsetWidth', { value: width });
    return floating;
};

const mockVisualViewport = (offsetTop: number) => {
    vi.stubGlobal('visualViewport', { offsetTop });
};

describe('getMobileEmojiPickerStyle', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('sits directly above the anchor, end-aligned, at full height when there is room', () => {
        mockVisualViewport(0);

        const style = getMobileEmojiPickerStyle(createAnchor(600, 360), createFloating(300), OFFSET, MARGIN);

        expect(style).toEqual({ top: 600 - OFFSET - 435, left: 60, '--emoji-picker-max-height': '435px' });
    });

    it('stays attached to the anchor when the visible viewport scrolls below the anchor', () => {
        mockVisualViewport(500);

        const style = getMobileEmojiPickerStyle(createAnchor(1000, 360), createFloating(300), OFFSET, MARGIN);

        expect(style.top).toBe(1000 - OFFSET - 435);
    });

    it('shrinks instead of crossing the top of the visible viewport, keeping its bottom on the anchor', () => {
        mockVisualViewport(100);

        const style = getMobileEmojiPickerStyle(createAnchor(400, 360), createFloating(300), OFFSET, MARGIN);
        const height = 400 - 100 - OFFSET - MARGIN;

        expect(style['--emoji-picker-max-height']).toBe(`${height}px`);
        expect(style.top).toBe(100 + MARGIN);
    });

    it('never shrinks below the minimum height', () => {
        mockVisualViewport(0);

        const style = getMobileEmojiPickerStyle(createAnchor(50, 360), createFloating(300), OFFSET, MARGIN);

        expect(style['--emoji-picker-max-height']).toBe('230px');
        expect(style.top).toBe(50 - OFFSET - 230);
    });
});
