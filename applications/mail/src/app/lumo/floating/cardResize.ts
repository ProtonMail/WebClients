import type { MouseEvent as ReactMouseEvent } from 'react';
import { useEffect, useRef } from 'react';

import clamp from '@proton/utils/clamp';

import { ResizeHandlePosition } from '../../components/list/ResizeHandle';
import { PanelSide } from './panelSide';

export const CARD_MIN_WIDTH = 348;
const CARD_MAX_MAILBOX_RATIO = 0.6;
export const CARD_RESIZING_CLASS = 'lumo-floating-panel-card-resizing';

/** The minimum wins when the mailbox is too narrow for the ratio cap, so the card never shrinks below its default. */
export const clampCardWidth = (width: number, mailboxWidth: number) => {
    return clamp(width, CARD_MIN_WIDTH, Math.max(CARD_MIN_WIDTH, mailboxWidth * CARD_MAX_MAILBOX_RATIO));
};

interface ResizeGrip {
    position: ResizeHandlePosition;
    spansPrompt: boolean;
}

/** On the left the grip sits on the card's inner edge, clear of the prompt and the hamburger below it. */
export const getResizeGrip = (side: PanelSide): ResizeGrip => {
    return side === PanelSide.RIGHT
        ? { position: ResizeHandlePosition.LEFT, spansPrompt: true }
        : { position: ResizeHandlePosition.RIGHT, spansPrompt: false };
};

interface CardResizeDrag {
    startWidth: number;
    handlePosition: ResizeHandlePosition;
    onResize: (width: number) => void;
}

export const useCardResize = ({ startWidth, handlePosition, onResize }: CardResizeDrag) => {
    const stopActiveResizeRef = useRef<() => void>();

    useEffect(() => {
        return () => stopActiveResizeRef.current?.();
    }, []);

    return (event: ReactMouseEvent) => {
        event.preventDefault();
        const startX = event.clientX;
        const growDirection = handlePosition === ResizeHandlePosition.LEFT ? -1 : 1;

        const handleMove = (moveEvent: MouseEvent) => {
            onResize(startWidth + growDirection * (moveEvent.clientX - startX));
        };
        const stopResize = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', stopResize);
            document.body.classList.remove('cursor-col-resize', CARD_RESIZING_CLASS);
            stopActiveResizeRef.current = undefined;
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', stopResize);
        document.body.classList.add('cursor-col-resize', CARD_RESIZING_CLASS);
        stopActiveResizeRef.current = stopResize;
    };
};
