import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { clsx } from 'clsx';

import type { PaperTrailCardData } from '../reportTypes';
import {
    CARD_WIDTH,
    type ShareCardRenderOptions,
    type ShareCardTheme,
    computeShareCardHeight,
    renderShareCard,
} from './drawShareCard';

import './ShareCardCanvasPreview.scss';

interface Props {
    data: PaperTrailCardData;
    theme?: ShareCardTheme;
    className?: string;
    hideFooter?: boolean;
}

/** Renders the exportable share card on a canvas — same output as the share modal preview. */
export const ShareCardCanvasPreview = forwardRef<HTMLCanvasElement, Props>(function ShareCardCanvasPreview(
    { data, theme = 'light', className, hideFooter = false },
    ref
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderOptions = useMemo((): ShareCardRenderOptions => {
        return { hideFooter };
    }, [hideFooter]);
    const [height, setHeight] = useState(() => {
        return computeShareCardHeight(data.areas.length, renderOptions);
    });

    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            void renderShareCard(canvas, data, theme, renderOptions).then(() => {
                setHeight(canvas.height);
            });
        }
    }, [data, theme, renderOptions]);

    return (
        <canvas
            ref={canvasRef}
            width={CARD_WIDTH}
            height={height}
            className={clsx('share-card-canvas-preview', className)}
        />
    );
});
