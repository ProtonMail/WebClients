import { useMemo } from 'react';
import type { AriaAttributes } from 'react';

import { useReducedMotion } from '@proton/components/hooks/useReducedMotion';
import clsx from '@proton/utils/clsx';

import { BAR_CHART_ACTIVE_ROW_PLUGIN_ID } from '../../plugins/barChartActiveRow/barChartActiveRow';
import { BAR_CHART_VALUE_LABELS_PLUGIN_ID } from '../../plugins/barChartValueLabels/barChartValueLabels';
import {
    PLACEHOLDER_TICKS_ROOM,
    TREND_CHART_PLACEHOLDER_TICKS_PLUGIN_ID,
} from '../../plugins/trendChartPlaceholderTicks/trendChartPlaceholderTicks';
import type { BarChartOptions } from '../../primitives/BarChart';
import { BarChart } from '../../primitives/BarChart';
import type { ChartColors } from '../../theme';
import { useChartColors } from '../../theme';
import { ROW_CURSOR_POSITIONER_ID } from '../../tooltip/rowCursorPosition';
import { FILL_OR_FALL_BACK } from '../fillOrFallBack';
import type { BarDataPoint, FillColor, HorizontalBarChartProps } from './HorizontalBarChart.types';
import { ARRIVAL, BAR, GRID_LINES, NO_LABEL, SKELETON_RANGE, SKELETON_SERIES, TOOLTIP, VALUE_LABEL } from './constants';
import { deriveMinAndMax } from './deriveMinAndMax';
import { gridTicks } from './gridTicks';

import './HorizontalBarChart.scss';

const NO_ROWS: BarDataPoint[] = [];

const getValueLabelMapper = (
    isLoading: boolean,
    transformValueLabel: HorizontalBarChartProps['transformValueLabel']
): ((row: BarDataPoint, index: number) => string) => {
    if (isLoading) {
        return () => NO_LABEL;
    }

    if (transformValueLabel === undefined) {
        return ({ value }) => String(value);
    }

    return ({ value }, index) => transformValueLabel(value, index);
};

const getBarColorMapper = (
    isLoading: boolean,
    colors: ChartColors,
    fill: FillColor
): ((row: BarDataPoint) => string) => {
    if (isLoading) {
        return () => colors.border;
    }

    return ({ fill: rowFill }) => colors[rowFill ?? fill];
};

export const HorizontalBarChart = ({
    mode = 'view',
    data,
    valueRange,
    fill = 'primary',
    gridLines = GRID_LINES,
    transformValueLabel,
    transformCategoryValue,
    transformTooltipValue,
    showTooltipLabel = true,
    ariaLabel,
    className,
}: HorizontalBarChartProps) => {
    const colors = useChartColors();
    const reducedMotion = useReducedMotion();
    const isLoading = mode === 'load';
    const series = isLoading ? SKELETON_SERIES : (data ?? NO_ROWS);

    const { min, max } = isLoading ? SKELETON_RANGE : deriveMinAndMax(series, valueRange);

    const valueLabels = useMemo(
        () => series.map(getValueLabelMapper(isLoading, transformValueLabel)),
        [series, transformValueLabel, isLoading]
    );

    const barColors = useMemo(
        () => series.map(getBarColorMapper(isLoading, colors, fill)),
        [series, isLoading, colors, fill]
    );

    const accessibility: Pick<AriaAttributes, 'aria-hidden' | 'aria-label'> & { role?: 'img' } =
        ariaLabel === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': ariaLabel };

    const options: BarChartOptions = useMemo(
        () => ({
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: isLoading || reducedMotion ? false : ARRIVAL,
            layout: { padding: { top: 0, right: 0, bottom: 0, left: 0 } },
            interaction: {
                mode: 'index',
                intersect: false,
                axis: 'y',
            },
            plugins: {
                legend: { display: false },
                [BAR_CHART_VALUE_LABELS_PLUGIN_ID]: {
                    enabled: !isLoading,
                    readings: valueLabels,
                    textColor: colors.textWeak,
                    gapFromBar: VALUE_LABEL.gapFromBar,
                    fadeInFrom: reducedMotion ? 0 : VALUE_LABEL.fadeInFrom,
                },
                [BAR_CHART_ACTIVE_ROW_PLUGIN_ID]: {
                    enabled: !isLoading,
                    color: colors.interactionHover,
                },
                [TREND_CHART_PLACEHOLDER_TICKS_PLUGIN_ID]: {
                    enabled: isLoading,
                    color: colors.primary,
                    axes: ['y'],
                },
                tooltip: {
                    enabled: !isLoading,
                    displayColors: false,
                    position: ROW_CURSOR_POSITIONER_ID,
                    caretPadding: TOOLTIP.caretPadding,
                    callbacks: {
                        ...(showTooltipLabel ? {} : { title: () => '' }),
                        label: ({ parsed: { x } }) => {
                            if (x === null) {
                                return '';
                            }

                            return transformTooltipValue === undefined ? String(x) : transformTooltipValue(x);
                        },
                    },
                },
            },
            scales: {
                x: {
                    min,
                    max,
                    border: { display: false },
                    grid: {
                        color: colors.borderWeak,
                        drawTicks: false,
                    },
                    ticks: { display: false },
                    afterBuildTicks: (axis) => {
                        axis.ticks = gridTicks(min, max, gridLines);
                    },
                },
                y: {
                    grid: { display: false },
                    border: { display: false },
                    afterFit: isLoading
                        ? (axis) => {
                              axis.width = Math.max(PLACEHOLDER_TICKS_ROOM, axis.width);
                          }
                        : undefined,
                    ticks: {
                        autoSkip: false,
                        color: colors.textWeak,
                        callback(value, index) {
                            if (isLoading) {
                                return NO_LABEL;
                            }

                            const label = this.getLabelForValue(Number(value));

                            return transformCategoryValue === undefined ? label : transformCategoryValue(label, index);
                        },
                    },
                },
            },
        }),
        [
            colors,
            min,
            max,
            gridLines,
            valueLabels,
            transformCategoryValue,
            transformTooltipValue,
            showTooltipLabel,
            isLoading,
            reducedMotion,
        ]
    );

    return (
        <div
            className={clsx(
                'horizontal-bar-chart w-full h-full',
                isLoading && 'horizontal-bar-chart--loading',
                className
            )}
            style={{
                ...FILL_OR_FALL_BACK,
                ...(series.length === 0 ? {} : { maxHeight: `${series.length * BAR.rowPitch}px` }),
            }}
            data-testid="horizontal-bar-chart"
        >
            <BarChart
                {...accessibility}
                data={{
                    labels: series.map(({ label }) => label),
                    datasets: [
                        {
                            data: series.map(({ value }) => value),
                            backgroundColor: barColors,
                            hoverBackgroundColor: barColors,
                            borderRadius: BAR.radius,
                            borderSkipped: false,
                            maxBarThickness: BAR.maxThickness,
                            categoryPercentage: BAR.categoryPercentage,
                            barPercentage: BAR.barPercentage,
                        },
                    ],
                }}
                options={options}
            />
            {isLoading && <div className="horizontal-bar-chart-shimmer" data-testid="horizontal-bar-chart-shimmer" />}
        </div>
    );
};
