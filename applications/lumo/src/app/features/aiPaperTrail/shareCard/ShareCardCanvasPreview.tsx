import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import clsx from 'clsx';

import type { PaperTrailCardData } from '../reportTypes';
import { CARD_HEIGHT, CARD_WIDTH, type ShareCardTheme, renderShareCard } from './drawShareCard';

import './ShareCardCanvasPreview.scss';

interface Props {
    data: PaperTrailCardData;
    theme?: ShareCardTheme;
    className?: string;
}

/** Renders the exportable share card on a canvas — same output as the share modal preview. */
export const ShareCardCanvasPreview = forwardRef<HTMLCanvasElement, Props>(function ShareCardCanvasPreview(
    { data, theme = 'light', className },
    ref
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            void renderShareCard(canvas, data, theme);
        }
    }, [data, theme]);

    return (
        <canvas
            ref={canvasRef}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            className={clsx('share-card-canvas-preview', className)}
        />
    );
});
