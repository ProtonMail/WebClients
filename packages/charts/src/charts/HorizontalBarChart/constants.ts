import type { BarDataPoint } from './HorizontalBarChart.types';

export const ARRIVAL = {
    duration: 1000,
    easing: 'easeOutQuart',
} as const;

export const BAR = {
    maxThickness: 12,
    radius: 3,
    categoryPercentage: 0.7,
    barPercentage: 0.5,
    rowPitch: 34,
} as const;

export const VALUE_LABEL = {
    gapFromBar: 8,
    fadeInFrom: 0.85,
} as const;

export const TOOLTIP = {
    caretPadding: 10,
} as const;

export const GRID_LINES = 5;

export const EMPTY_RANGE_MAX = 100;

export const SKELETON_SERIES: BarDataPoint[] = [84, 56, 67, 31, 44].map((value) => ({
    label: '',
    value,
}));

export const SKELETON_RANGE = { min: 0, max: 100 } as const;

export const NO_LABEL = '';
