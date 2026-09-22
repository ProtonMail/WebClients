import { useMemo } from 'react';
import type { AriaAttributes } from 'react';

import { color as parseColor } from 'chart.js/helpers';

import { useReducedMotion } from '@proton/components/hooks/useReducedMotion';
import clsx from '@proton/utils/clsx';

import { TREND_CHART_PLACEHOLDER_TICKS_PLUGIN_ID } from '../../plugins/trendChartPlaceholderTicks/trendChartPlaceholderTicks';
import { TREND_CHART_THRESHOLD_PLUGIN_ID } from '../../plugins/trendChartThreshold/trendChartThreshold';
import type { LineChartOptions } from '../../primitives/LineChart';
import { LineChart } from '../../primitives/LineChart';
import { useChartColors } from '../../theme';
import type { FillColor, TrendChartProps } from './TrendChart.types';
import { ARRIVAL, AXIS, BORDER_WIDTH, FILL_ALPHA, NO_LABEL, SKELETON_SERIES, TENSION } from './constants';
import { FILL_OR_FALL_BACK } from './fillOrFallBack';
import { splitAtThreshold } from './splitAtThreshold';

import './TrendChart.scss';

/**
 * Small helper to dim a color for charts.js. Mostly used for the coloring of the area beneath the trend chart line.
 */
const asFill = (value: string) => parseColor(value)?.alpha(FILL_ALPHA)?.rgbString() ?? value;

export const TrendChart = ({
    mode = 'view',
    data,
    threshold,
    fill,
    thresholdColor,
    transformYAxisValue,
    transformXAxisValue,
    transformTooltipValue,
    showTooltipLabel = true,
    borderWidth = BORDER_WIDTH,
    tension = TENSION,
    ariaLabel,
    className,
}: TrendChartProps) => {
    const colors = useChartColors();
    const reducedMotion = useReducedMotion();
    const isLoading = mode === 'load';
    const series = isLoading ? SKELETON_SERIES : (data ?? []);

    const [belowColor, aboveColor]: [FillColor, FillColor] =
        threshold === undefined
            ? [fill ?? 'primary', fill ?? 'primary']
            : [fill?.below ?? 'primary', fill?.above ?? 'danger'];

    const dashedThresholdColor: FillColor = thresholdColor ?? aboveColor;

    const accessibility: Pick<AriaAttributes, 'aria-hidden' | 'aria-label'> & { role?: 'img' } =
        ariaLabel === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': ariaLabel };

    const options: LineChartOptions = useMemo(
        () => ({
            interaction: {
                mode: 'index',
                intersect: false,
            },
            responsive: true,
            maintainAspectRatio: false,
            animation: isLoading || reducedMotion ? false : ARRIVAL,
            plugins: {
                [TREND_CHART_THRESHOLD_PLUGIN_ID]: { value: threshold, color: colors[dashedThresholdColor] },
                [TREND_CHART_PLACEHOLDER_TICKS_PLUGIN_ID]: { enabled: isLoading, color: colors.primary },
                tooltip: {
                    displayColors: false,
                    callbacks: {
                        ...(showTooltipLabel ? {} : { title: () => '' }),
                        label: ({ parsed: { y } }) => {
                            if (y === null) {
                                return '';
                            }
                            return transformTooltipValue === undefined ? String(y) : transformTooltipValue(y);
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    afterFit: (axis) => {
                        axis.height = Math.max(AXIS.xHeight, axis.height);
                        axis.paddingLeft = 0;
                        axis.paddingRight = AXIS.rightOverhang;
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: false,
                        callback(value, index, ticks) {
                            if (isLoading) {
                                return NO_LABEL;
                            }

                            const label = this.getLabelForValue(Number(value));
                            const previous = ticks[index - 1];
                            const isRepeatedLabel =
                                previous !== undefined && this.getLabelForValue(Number(previous.value)) === label;
                            if (isRepeatedLabel) {
                                return NO_LABEL;
                            }

                            return transformXAxisValue === undefined ? label : transformXAxisValue(label, index, ticks);
                        },
                    },
                },
                y: {
                    grid: { display: false },
                    border: { display: false },
                    /**
                     * A floor and not a ceiling, as on the label axis: a caller whose `transformYAxisValue`
                     * writes '1.2 TB' or '100 Mbps' gets the width those need, instead of the labels being
                     * cut off at a number chosen here.
                     */
                    afterFit: (axis) => {
                        axis.width = Math.max(AXIS.yWidth, axis.width);
                        axis.paddingTop = AXIS.topOverhang;
                        axis.paddingBottom = 0;
                    },
                    afterBuildTicks:
                        threshold === undefined
                            ? undefined
                            : (axis) => {
                                  if (threshold < axis.min || threshold > axis.max) {
                                      return;
                                  }

                                  if (axis.ticks.some(({ value }) => value === threshold)) {
                                      return;
                                  }
                                  axis.ticks = [...axis.ticks, { value: threshold, major: true }].sort(
                                      (one, other) => one.value - other.value
                                  );
                              },
                    ticks: {
                        ...(isLoading ? { maxTicksLimit: 4 } : {}),
                        major: { enabled: true },
                        color: ({ tick }) =>
                            tick?.value === threshold ? colors[dashedThresholdColor] : colors.textWeak,
                        callback(value, index, ticks) {
                            if (isLoading) {
                                return NO_LABEL;
                            }

                            return transformYAxisValue === undefined
                                ? this.getLabelForValue(Number(value))
                                : transformYAxisValue(Number(value), index, ticks);
                        },
                    },
                },
            },
        }),
        [
            colors,
            threshold,
            aboveColor,
            dashedThresholdColor,
            transformYAxisValue,
            transformXAxisValue,
            transformTooltipValue,
            showTooltipLabel,
            isLoading,
            reducedMotion,
        ]
    );

    return (
        <div
            className={clsx('trend-chart w-full h-full', isLoading && 'trend-chart--loading', className)}
            style={FILL_OR_FALL_BACK}
            data-testid="trend-chart"
        >
            <LineChart
                {...accessibility}
                data={{
                    labels: series.map(({ label }) => label),
                    datasets: [
                        {
                            data: series.map(({ value }) => value),
                            borderColor: splitAtThreshold(threshold, colors[belowColor], colors[aboveColor]),
                            backgroundColor: splitAtThreshold(
                                threshold,
                                asFill(colors[belowColor]),
                                asFill(colors[aboveColor])
                            ),
                            borderWidth,
                            fill: true,
                            tension,
                            pointRadius: 0,
                        },
                    ],
                }}
                options={options}
            />
            {isLoading && <div className="trend-chart-shimmer" data-testid="trend-chart-shimmer" />}
        </div>
    );
};
