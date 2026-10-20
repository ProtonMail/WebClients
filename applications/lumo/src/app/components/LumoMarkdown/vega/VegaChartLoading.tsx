import { useEffect, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useEncryptedTextAnimation } from '../../../hooks/useEncryptedTextAnimation';
import { type IconName, LumoIcon } from '../../LumoIcon/LumoIcon';
import { LUMO_VEGA_CHART_SHELL_CLASS } from '../lumoMarkdownCardShell';

import './VegaLiteChart.scss';

const CHART_ICONS: IconName[] = ['ChartNoAxesCombined', 'ChartCandlestick', 'ChartPie', 'ChartLine', 'ChartBar'];

// translator: Playful rotating loading status while a chart is generated; retain a cat-themed tone where possible.
const getLoadingMessages = () =>
    [
        c('collider_2025:Label').t`Generating chart…`,
        c('collider_2025:Label').t`Plotting purr-fect data…`,
        c('collider_2025:Label').t`Crunching the cat-able numbers…`,
        c('collider_2025:Label').t`Drawing whisker plots…`,
        c('collider_2025:Label').t`Sifting through the meow-trics…`,
        c('collider_2025:Label').t`Claw-culating trends…`,
    ] as const;

const ICON_CYCLE_MS = 4000;
const MESSAGE_CYCLE_MS = 4000;

const VegaChartLoadingContent = () => {
    const [iconIndex, setIconIndex] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);
    const messages = getLoadingMessages();
    const message = messages[messageIndex] ?? messages[0];
    const { displayText } = useEncryptedTextAnimation(message, { animateOnChange: true, duration: 520 });

    useEffect(() => {
        const iconTimer = window.setInterval(() => {
            setIconIndex((current) => (current + 1) % CHART_ICONS.length);
        }, ICON_CYCLE_MS);

        const messageTimer = window.setInterval(() => {
            setMessageIndex((current) => (current + 1) % messages.length);
        }, MESSAGE_CYCLE_MS);

        return () => {
            window.clearInterval(iconTimer);
            window.clearInterval(messageTimer);
        };
    }, [messages.length]);

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

/** Standalone chart loading shell — matches VegaLiteChart chrome for seamless transitions. */
export const VegaChartLoading = () => (
    <div
        className={clsx(LUMO_VEGA_CHART_SHELL_CLASS, 'vega-lite-chart--loading-only flex items-center justify-center')}
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
