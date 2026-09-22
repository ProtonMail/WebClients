import { useContext, useEffect, useState } from 'react';

import { THEME_ID, ThemeContext } from '@proton/components/containers/themes/ThemeProvider';

/**
 * Why this module exists: a canvas cannot consume `var(--x)`. chart.js paints with concrete colour strings,
 * so the active theme's CSS custom properties have to be read off the document and handed over resolved.
 */

export interface ChartColors {
    text: string;
    textWeak: string;
    border: string;
    borderWeak: string;
    background: string;
    primary: string;
    danger: string;
    warning: string;
    success: string;
    info: string;
}

const CSS_VARIABLES = {
    text: '--text-norm',
    textWeak: '--text-weak',
    border: '--border-norm',
    borderWeak: '--border-weak',
    background: '--background-norm',
    primary: '--primary',
    danger: '--signal-danger',
    warning: '--signal-warning',
    success: '--signal-success',
    info: '--signal-info',
} as const satisfies Record<keyof ChartColors, string>;

const FALLBACK_COLORS: ChartColors = {
    text: '#0c0c14',
    textWeak: '#5c5958',
    border: '#d1cfcd',
    borderWeak: '#eae7e4',
    background: '#ffffff',
    primary: '#6d4aff',
    danger: '#dc3251',
    warning: '#ff9900',
    success: '#1ea885',
    info: '#239ece',
};

export const getChartColors = (): ChartColors => {
    if (typeof document === 'undefined' || !document.body) {
        return FALLBACK_COLORS;
    }

    const styles = getComputedStyle(document.body);

    const read = (key: keyof ChartColors) => styles.getPropertyValue(CSS_VARIABLES[key]).trim() || FALLBACK_COLORS[key];

    return {
        text: read('text'),
        textWeak: read('textWeak'),
        border: read('border'),
        borderWeak: read('borderWeak'),
        background: read('background'),
        primary: read('primary'),
        danger: read('danger'),
        warning: read('warning'),
        success: read('success'),
        info: read('info'),
    };
};

const sameColors = (one: ChartColors, other: ChartColors) =>
    (Object.keys(CSS_VARIABLES) as (keyof ChartColors)[]).every((key) => one[key] === other[key]);

const syncChartColors = (setColors: (value: (current: ChartColors) => ChartColors) => void) => {
    setColors((current) => {
        const applied = getChartColors();

        return sameColors(current, applied) ? current : applied;
    });
};

export const useChartColors = (): ChartColors => {
    const [colors, setColors] = useState<ChartColors>(getChartColors);
    const { addListener } = useContext(ThemeContext);

    useEffect(() => {
        const apply = () => requestAnimationFrame(() => syncChartColors(setColors));

        apply();

        const unsubscribe = addListener(apply);

        const observers: MutationObserver[] = [];

        const themeStyle = document.getElementById(THEME_ID);
        if (themeStyle) {
            const themeObserver = new MutationObserver(apply);
            themeObserver.observe(themeStyle, { childList: true, characterData: true, subtree: true });
            observers.push(themeObserver);
        }

        const bodyObserver = new MutationObserver(apply);
        bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
        observers.push(bodyObserver);

        return () => {
            unsubscribe();
            observers.forEach((observer) => observer.disconnect());
        };
    }, [addListener]);

    return colors;
};
