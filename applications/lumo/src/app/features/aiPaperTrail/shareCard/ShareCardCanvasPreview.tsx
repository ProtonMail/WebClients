import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import clsx from 'clsx';

import type { PaperTrailCardData } from '../reportTypes';
import {
    CARD_WIDTH,
    type ShareCardTheme,
    computeShareCardHeight,
    renderShareCard,
} from './drawShareCard';

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
    const [height, setHeight] = useState(() => computeShareCardHeight(data.areas.length));

    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            void renderShareCard(canvas, data, theme).then(() => {
                setHeight(canvas.height);
            });
        }
    }, [data, theme]);

    return (
        <canvas
            ref={canvasRef}
            width={CARD_WIDTH}
            height={height}
            className={clsx('share-card-canvas-preview', className)}
        />
    );
});
