import clsx from 'clsx';
import { useEffect, useState } from 'react';

import { useEncryptedTextAnimation } from '../../../hooks/useEncryptedTextAnimation';
import { LumoIcon, type IconName } from '../../LumoIcon/LumoIcon';

import './VegaLiteChart.scss';

const CHART_ICONS: IconName[] = [
    'ChartNoAxesCombined',
    'ChartCandlestick',
    'ChartPie',
    'ChartLine',
    'ChartBar',
];

const LOADING_MESSAGES = [
    'Generating chart…',
    'Plotting purr-fect data…',
    'Crunching the cat-able numbers…',
    'Drawing whisker plots…',
    'Sifting through the meow-trics…',
    'Claw-culating trends…',
] as const;

const ICON_CYCLE_MS = 4000;
const MESSAGE_CYCLE_MS = 4000;

const VegaChartLoadingContent = () => {
    const [iconIndex, setIconIndex] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);
    const message = LOADING_MESSAGES[messageIndex] ?? LOADING_MESSAGES[0];
    const { displayText } = useEncryptedTextAnimation(message, { animateOnChange: true, duration: 520 });

    useEffect(() => {
        const iconTimer = window.setInterval(() => {
            setIconIndex((current) => (current + 1) % CHART_ICONS.length);
        }, ICON_CYCLE_MS);

        const messageTimer = window.setInterval(() => {
            setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
        }, MESSAGE_CYCLE_MS);

        return () => {
            window.clearInterval(iconTimer);
            window.clearInterval(messageTimer);
        };
    }, []);

    return (
        <div className="vega-lite-chart__loading-content relative flex flex-column items-center gap-3">
            <LumoIcon
                key={CHART_ICONS[iconIndex]}
                name={CHART_ICONS[iconIndex] ?? 'ChartNoAxesCombined'}
                size={32}
                className="vega-lite-chart__loading-icon"
                aria-hidden="true"
            />
            <span className="vega-lite-chart__loading-text text-monospace" aria-label={message}>
                {displayText}
            </span>
        </div>
    );
};

/** Standalone chart loading shell — must include `.vega-lite-chart` for layout/sizing. */
export const VegaChartLoading = () => (
    <div
        className={clsx(
            'vega-lite-chart vega-lite-chart--loading-only relative flex items-center justify-center border-none shadow-none bg-transparent'
        )}
        aria-busy="true"
        aria-live="polite"
    >
        <VegaChartLoadingContent />
    </div>
);

/** Overlay variant used while vega-embed mounts inside an existing chart container. */
export const VegaChartLoadingOverlay = () => (
    <div
        className="vega-lite-chart__loading absolute inset-0 flex items-center justify-center pointer-events-none z-1"
        aria-busy="true"
        aria-live="polite"
    >
        <VegaChartLoadingContent />
    </div>
);
