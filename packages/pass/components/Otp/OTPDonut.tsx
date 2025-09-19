import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import { matchDarkTheme } from '@proton/pass/components/Layout/Theme/utils';
import type { IOtpRenderer } from '@proton/pass/components/Otp/types';
import type { MaybeNull } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './OTPDonut.scss';

type CSSVarColor = `--${string}`;

export type OTPDonutColorConfig<T> = { empty: T; filled: T; warning: T; danger: T };

type Props = {
    colors?: OTPDonutColorConfig<CSSVarColor>;
    enabled: boolean;
    thickness?: number;
};

export const DEFAULT_OTP_COLORS: OTPDonutColorConfig<CSSVarColor> = {
    empty: '--text-hint',
    filled: '--signal-success',
    warning: '--signal-warning',
    danger: '--signal-danger',
};

/** Should be customizable */
const size = 36;

export const OTPDonut = forwardRef<IOtpRenderer, Props>(
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

        useImperativeHandle<IOtpRenderer, IOtpRenderer>(ref, () => {
            const setupCanvas = (countdown: number): MaybeNull<CanvasRenderingContext2D> => {
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (!(canvas && ctx)) return null;

                const dpr = window.devicePixelRatio || 1;
                canvas.width = size * dpr;
                canvas.height = size * dpr;
                ctx.scale(dpr, dpr);
                ctx.clearRect(0, 0, size, size);

                wrapperRef.current?.style.setProperty('--countdown-value', `"${countdown}"`);
                return ctx;
            };

            return {
                draw: (percent, period) => {
                    const countDown = Math.round(percent * period);
                    const ctx = setupCanvas(countDown);
                    if (!ctx) return;

                    const computedColors = getColors(canvasRef.current!);
                    const fillColor = (() => {
                        if (countDown <= 5) return computedColors.danger;
                        if (countDown <= 10) return computedColors.warning;
                        return computedColors.filled;
                    })();

                    const center = size / 2;
                    const radius = center - thickness;
                    const startAngle = -Math.PI / 2;
                    const endAngle = startAngle + (1 - percent) * (2 * Math.PI);

                    ctx.strokeStyle = fillColor;
                    ctx.lineWidth = thickness;
                    ctx.beginPath();
                    ctx.arc(center, center, radius, endAngle, startAngle);
                    ctx.stroke();

                    ctx.strokeStyle = computedColors.empty;
                    ctx.lineWidth = thickness;
                    ctx.beginPath();
                    ctx.arc(center, center, radius, startAngle, endAngle);
                    ctx.stroke();
                },

                drawFrom: (countdown, canvas) => {
                    const ctx = setupCanvas(countdown);
                    if (ctx) ctx.drawImage(canvas, 0, 0, size, size);
                },

                getCanvas: () => canvasRef.current ?? null,
            };
        }, [getColors]);

        useEffect(() => {
            const media = matchDarkTheme();
            const listener = () => (colorsRef.current = undefined);

            listener();
            media.addEventListener('change', listener);

            return () => media.removeEventListener('change', listener);
        }, [colors]);

        return (
            <div ref={wrapperRef} className={clsx('pass-otp--donut pointer-events-none anime-fade-in')}>
                {enabled && <canvas ref={canvasRef} className="pass-otp--donut" />}
            </div>
        );
    }
);

OTPDonut.displayName = 'OTPDonutForwarded';
