import { type FC, useCallback, useEffect, useRef } from 'react';

import clsx from '@proton/utils/clsx';

import './OTPDonut.scss';

type CSSVarColor = `--${string}`;

type Props = {
    colorEmpty?: CSSVarColor;
    colorFilled?: CSSVarColor;
    enabled: boolean;
    percent: number;
    period?: number;
    thickness?: number;
};

export const OTPDonut: FC<Props> = ({
    colorEmpty = '--text-hint',
    colorFilled = '--signal-success',
    enabled,
    percent,
    period = 0,
    thickness = 3,
}) => {
    const ref = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const colorsRef = useRef<[empty: string, filled: string]>();

    const getColors = useCallback(
        (canvas: HTMLCanvasElement): [empty: string, filled: string] => {
            if (colorsRef.current) return colorsRef.current;

            const computedStyle = window.getComputedStyle(canvas);
            const filled = computedStyle.getPropertyValue(colorFilled);
            const empty = computedStyle.getPropertyValue(colorEmpty);

            return [empty, filled];
        },
        [colorEmpty, colorFilled]
    );

    const draw = useCallback(
        (percent: number) => {
            const canvas = ref.current;
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
        [thickness, getColors]
    );

    useEffect(() => {
        cancelAnimationFrame(animationRef.current!);
        animationRef.current = requestAnimationFrame(() => draw(percent));
        return () => cancelAnimationFrame(animationRef.current!);
    }, [percent]);

    useEffect(() => {
        colorsRef.current = undefined;
    }, [colorFilled, colorEmpty]);

    return (
        <div
            className={clsx('pass-otp--donut pointer-events-none anime-fade-in')}
            style={{ '--countdown-value': `"${Math.round(percent * period)}"` }}
        >
            {enabled && <canvas ref={ref} className="pass-otp--donut" />}
        </div>
    );
};
