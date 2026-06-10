import type { FC } from 'react';
import { useEffect, useRef } from 'react';

import { clsx } from 'clsx';

import type { MaybeNull } from '@proton/pass/types/utils';

import { useLumoAnimatedBackground } from '../../hooks/useLumoAnimatedBackground';
import { useLumoTheme } from '../../providers';

import './Blobs.scss';

const DOT_COLOR_CSS_VAR = '--background-main-canvas';

const DOTS = {
    /** Distance between neighbouring dot centres. Larger = sparser grid. */
    spacing: 15,
    /** Radius of each dot. */
    radius: 1.5,
    /** Dot colour. */
    // color: '#FFFFFF',
    /** Opacity of the brightest dot (0–1). Dots fade out towards the edges. */
    maxOpacity: 1,
};

const getDotColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue(DOT_COLOR_CSS_VAR).trim() || '#FFFFFF';
};

const renderDots = (canvas: MaybeNull<HTMLCanvasElement>) => {
    const ctx = canvas?.getContext('2d');
    if (!(canvas && ctx)) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth * dpr;
    const height = canvas.clientHeight * dpr;
    canvas.width = width;
    canvas.height = height;

    const spacing = DOTS.spacing * dpr;
    const radius = DOTS.radius * dpr;

    const centerX = width / 2;
    const centerY = height / 2;
    const maxDistance = Math.hypot(centerX, centerY);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = getDotColor();

    for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
            /** Each dot's opacity blends a global radial fade */
            const distance = Math.hypot(x - centerX, y - centerY);
            const radialFade = 1 - distance / maxDistance;
            const jitter = 1 - Math.random();
            const opacity = DOTS.maxOpacity * radialFade * jitter;

            ctx.globalAlpha = Math.max(0, opacity);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
};

export const Blobs: FC = () => {
    const ref = useRef<HTMLCanvasElement>(null);
    const { theme } = useLumoTheme();
    const { isAnimatedBackgroundEnabled } = useLumoAnimatedBackground();

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) {
            return;
        }

        renderDots(canvas);

        const observer = new ResizeObserver(() => {
            renderDots(canvas);
        });
        observer.observe(canvas);
        return () => {
            observer.disconnect();
        };
    }, [theme]);

    return (
        <div className={clsx('lumo--blobs', !isAnimatedBackgroundEnabled && 'lumo--blobs--static')} aria-hidden="true">
            <canvas className="lumo--blobs-overlay" ref={ref} />
            <div className="lumo--blobs-gradient" />
        </div>
    );
};
