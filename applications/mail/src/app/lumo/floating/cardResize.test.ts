import type { MouseEvent as ReactMouseEvent } from 'react';

import { renderHook } from '@testing-library/react';

import { ResizeHandlePosition } from '../../components/list/ResizeHandle';
import { CARD_MIN_WIDTH, CARD_RESIZING_CLASS, clampCardWidth, getResizeGrip, useCardResize } from './cardResize';
import { PanelSide } from './panelSide';

describe('clampCardWidth', () => {
    it('never goes below the minimum', () => {
        expect(clampCardWidth(100, 1200)).toBe(CARD_MIN_WIDTH);
    });

    it('keeps a width inside the limits', () => {
        expect(clampCardWidth(500, 1200)).toBe(500);
    });

    it('caps at 60% of the mailbox', () => {
        expect(clampCardWidth(1000, 1200)).toBe(720);
    });

    it('keeps the minimum when the mailbox is too narrow for the cap', () => {
        expect(clampCardWidth(500, 400)).toBe(CARD_MIN_WIDTH);
    });
});

describe('getResizeGrip', () => {
    it('grips the shared outer edge of card and prompt on the right side', () => {
        expect(getResizeGrip(PanelSide.RIGHT)).toEqual({ position: ResizeHandlePosition.LEFT, spansPrompt: true });
    });

    it('grips only the card inner edge on the left side', () => {
        expect(getResizeGrip(PanelSide.LEFT)).toEqual({ position: ResizeHandlePosition.RIGHT, spansPrompt: false });
    });
});

describe('useCardResize', () => {
    const pressHandle = (handlePosition: ResizeHandlePosition, fromX: number, onResize = jest.fn()) => {
        const preventDefault = jest.fn();
        const hook = renderHook(() => useCardResize({ startWidth: 400, handlePosition, onResize }));
        hook.result.current({ clientX: fromX, preventDefault } as unknown as ReactMouseEvent);
        return { ...hook, preventDefault };
    };

    const drag = (handlePosition: ResizeHandlePosition, fromX: number, toX: number) => {
        const onResize = jest.fn();
        pressHandle(handlePosition, fromX, onResize);
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: toX }));
        document.dispatchEvent(new MouseEvent('mouseup'));
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: toX + 50 }));
        return onResize;
    };

    it('grows when the left handle is dragged left', () => {
        expect(drag(ResizeHandlePosition.LEFT, 500, 450).mock.calls).toEqual([[450]]);
    });

    it('grows when the right handle is dragged right', () => {
        expect(drag(ResizeHandlePosition.RIGHT, 500, 550).mock.calls).toEqual([[450]]);
    });

    it('shields iframes and blocks text selection only while the drag is held', () => {
        const { preventDefault } = pressHandle(ResizeHandlePosition.RIGHT, 500);
        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(document.body).toHaveClass(CARD_RESIZING_CLASS);

        document.dispatchEvent(new MouseEvent('mouseup'));
        expect(document.body).not.toHaveClass(CARD_RESIZING_CLASS);
    });

    it('ends a held drag when the handle unmounts', () => {
        const onResize = jest.fn();
        const { unmount } = pressHandle(ResizeHandlePosition.RIGHT, 500, onResize);

        unmount();
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 550 }));

        expect(onResize).not.toHaveBeenCalled();
        expect(document.body).not.toHaveClass('cursor-col-resize');
        expect(document.body).not.toHaveClass(CARD_RESIZING_CLASS);
    });
});
