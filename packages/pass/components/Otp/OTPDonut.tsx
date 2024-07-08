import { type FC, useEffect, useRef } from 'react';

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

    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas?.getContext('2d');

        if (!(ctx && canvas)) return;

        const size = 36;
        const computedStyle = window.getComputedStyle(canvas);
        const filled = computedStyle.getPropertyValue(colorFilled);
        const empty = computedStyle.getPropertyValue(colorEmpty);
        const dpr = window.devicePixelRatio || 1;

        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;

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
    }, [percent, thickness, colorEmpty, colorFilled]);

    return (
        <div
            className={clsx('pass-otp--donut pointer-events-none anime-fade-in')}
            style={{ '--countdown-value': `"${Math.round(percent * period)}"` }}
        >
            {enabled && <canvas ref={ref} className="pass-otp--donut" />}
        </div>
    );
};
