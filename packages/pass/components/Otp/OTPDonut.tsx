import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import type { OTPRendererHandles } from '@proton/pass/components/Otp/types';
import clsx from '@proton/utils/clsx';

import './OTPDonut.scss';

type CSSVarColor = `--${string}`;

export type OTPDonutColorConfig<T> = { empty: T; filled: T; warning: T; danger: T };

type Props = {
    colors?: OTPDonutColorConfig<CSSVarColor>;
    enabled: boolean;
    thickness?: number;
};

const DEFAULT_OTP_COLORS: OTPDonutColorConfig<CSSVarColor> = {
    empty: '--text-hint',
    filled: '--signal-success',
    warning: '--signal-warning',
    danger: '--signal-danger',
};

export const OTPDonut = forwardRef<OTPRendererHandles, Props>(
    ({ colors = DEFAULT_OTP_COLORS, enabled, thickness = 3 }, ref) => {
        const wrapperRef = useRef<HTMLDivElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const colorsRef = useRef<OTPDonutColorConfig<string>>();

        const getColors = useCallback(
            (canvas: HTMLCanvasElement): OTPDonutColorConfig<string> => {
                if (colorsRef.current) return colorsRef.current;
                const computedStyle = window.getComputedStyle(canvas);

                colorsRef.current = {
                    empty: computedStyle.getPropertyValue(colors.empty),
                    filled: computedStyle.getPropertyValue(colors.filled),
                    warning: computedStyle.getPropertyValue(colors.warning),
                    danger: computedStyle.getPropertyValue(colors.danger),
                };

                return colorsRef.current;
            },
            [colors]
        );

        useImperativeHandle<OTPRendererHandles, OTPRendererHandles>(
            ref,
            () => ({
                draw: (percent, period) => {
                    const countDown = Math.round(percent * period);
                    wrapperRef.current?.style.setProperty('--countdown-value', `"${countDown}"`);

                    const canvas = canvasRef.current;
                    const ctx = canvas?.getContext('2d');
                    if (!(canvas && ctx)) return;

                    const size = 36;
                    const dpr = window.devicePixelRatio || 1;
                    const computedColors = getColors(canvas);

                    const emptyColor = computedColors.empty;
                    const fillColor = (() => {
                        if (countDown <= 5) return computedColors.danger;
                        if (countDown <= 10) return computedColors.warning;
                        return computedColors.filled;
                    })();

                    canvas.width = size * dpr;
                    canvas.height = size * dpr;
                    ctx.scale(dpr, dpr);

                    const center = size / 2;
                    const radius = center - thickness;
                    const startAngle = -Math.PI / 2;
                    const endAngle = startAngle + (1 - percent) * (2 * Math.PI);

                    ctx.clearRect(0, 0, size, size);

                    ctx.strokeStyle = fillColor;
                    ctx.lineWidth = thickness;
                    ctx.beginPath();
                    ctx.arc(center, center, radius, endAngle, startAngle);
                    ctx.stroke();

                    ctx.strokeStyle = emptyColor;
                    ctx.lineWidth = thickness;
                    ctx.beginPath();
                    ctx.arc(center, center, radius, startAngle, endAngle);
                    ctx.stroke();
                },
            }),
            [getColors]
        );

        useEffect(() => (colorsRef.current = undefined), [colors]);

        return (
            <div ref={wrapperRef} className={clsx('pass-otp--donut pointer-events-none anime-fade-in')}>
                {enabled && <canvas ref={canvasRef} className="pass-otp--donut" />}
            </div>
        );
    }
);

OTPDonut.displayName = 'OTPDonutForwarded';
