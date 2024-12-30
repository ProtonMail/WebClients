import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import type { OTPRendererHandles } from '@proton/pass/components/Otp/types';
import clsx from '@proton/utils/clsx';

import './OTPDonut.scss';

type CSSVarColor = `--${string}`;

type Props = {
    colorEmpty?: CSSVarColor;
    colorFilled?: CSSVarColor;
    enabled: boolean;
    thickness?: number;
};

type OTPDonutColors = [empty: string, filled: string];

export const OTPDonut = forwardRef<OTPRendererHandles, Props>(
    ({ colorEmpty = '--text-hint', colorFilled = '--signal-success', enabled, thickness = 3 }, ref) => {
        const wrapperRef = useRef<HTMLDivElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const colorsRef = useRef<OTPDonutColors>();

        const getColors = useCallback(
            (canvas: HTMLCanvasElement): OTPDonutColors => {
                if (colorsRef.current) return colorsRef.current;

                const computedStyle = window.getComputedStyle(canvas);
                const filled = computedStyle.getPropertyValue(colorFilled);
                const empty = computedStyle.getPropertyValue(colorEmpty);

                return [empty, filled];
            },
            [colorEmpty, colorFilled]
        );

        useImperativeHandle<OTPRendererHandles, OTPRendererHandles>(
            ref,
            () => ({
                draw: (percent, period) => {
                    wrapperRef.current?.style.setProperty('--countdown-value', `"${Math.round(percent * period)}"`);

                    const canvas = canvasRef.current;
                    const ctx = canvas?.getContext('2d');
                    if (!(canvas && ctx)) return;

                    const size = 36;
                    const dpr = window.devicePixelRatio || 1;
                    const [empty, filled] = getColors(canvas);

                    canvas.width = size * dpr;
                    canvas.height = size * dpr;
                    ctx.scale(dpr, dpr);

                    const center = size / 2;
                    const radius = center - thickness;
                    const startAngle = -Math.PI / 2;
                    const endAngle = startAngle + (1 - percent) * (2 * Math.PI);

                    ctx.clearRect(0, 0, size, size);

                    ctx.strokeStyle = empty;
                    ctx.lineWidth = thickness;
                    ctx.beginPath();
                    ctx.arc(center, center, radius, 0, 2 * Math.PI);
                    ctx.stroke();

                    ctx.strokeStyle = filled;
                    ctx.lineWidth = thickness;
                    ctx.beginPath();
                    ctx.arc(center, center, radius, startAngle, endAngle);
                    ctx.stroke();
                },
            }),
            [getColors]
        );

        useEffect(() => {
            colorsRef.current = undefined;
        }, [colorFilled, colorEmpty]);

        return (
            <div ref={wrapperRef} className={clsx('pass-otp--donut pointer-events-none anime-fade-in')}>
                {enabled && <canvas ref={canvasRef} className="pass-otp--donut" />}
            </div>
        );
    }
);

OTPDonut.displayName = 'OTPDonutForwarded';
