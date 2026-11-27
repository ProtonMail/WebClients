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
import { FILL_OR_FALL_BACK } from '../fillOrFallBack';
import type { FillColor, TrendChartProps } from './TrendChart.types';
import {
    ARRIVAL,
    AXIS,
    BORDER_WIDTH,
    FILL_ALPHA,
    LATEST_POINT_RADIUS,
    NO_LABEL,
    NO_LATEST_POINT,
    READINGS_EITHER_SIDE_OF_A_GAP,
    SKELETON_SERIES,
    TENSION,
} from './constants';
import { splitAtThreshold } from './splitAtThreshold';

import './TrendChart.scss';

/**
 * Small helper to dim a color for charts.js. Mostly used for the coloring of the area beneath the trend chart line.
 */
const asFill = (value: string) => parseColor(value)?.alpha(FILL_ALPHA)?.rgbString() ?? value;

const widestGapCarriedAcross = (bridgeMissedReadings: boolean | number) =>
    typeof bridgeMissedReadings === 'number'
        ? bridgeMissedReadings + READINGS_EITHER_SIDE_OF_A_GAP - 1
        : bridgeMissedReadings;

export const TrendChart = ({
    mode = 'view',
    data,
    bridgeMissedReadings = true,
    threshold,
    fill,
    thresholdColor,
    showThresholdLabel = true,
    valueRange,
    valueTicks,
    wholeValues = false,
    showValueGuides = false,
    transformYAxisValue,
    transformXAxisValue,
    transformTooltipValue,
    showTooltipLabel = true,
    showLatestPoint = false,
    borderWidth = BORDER_WIDTH,
    tension = TENSION,
    ariaLabel,
    className,
}: TrendChartProps) => {
    const colors = useChartColors();
    const reducedMotion = useReducedMotion();
    const isLoading = mode === 'load';
    const series = isLoading ? SKELETON_SERIES : (data ?? []);

    const latestIndex =
        showLatestPoint && !isLoading ? series.findLastIndex(({ value }) => value !== null) : NO_LATEST_POINT;

    const [belowColor, aboveColor]: [FillColor, FillColor] =
        threshold === undefined
            ? [fill ?? 'primary', fill ?? 'primary']
            : [fill?.below ?? 'primary', fill?.above ?? 'danger'];

    const dashedThresholdColor: FillColor = thresholdColor ?? aboveColor;
    const labelsThreshold = threshold !== undefined && showThresholdLabel;
    const pinnedMin = valueRange?.min;
    const pinnedMax = valueRange?.max;

    const valueTicksKey = valueTicks?.join();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the contents of valueTicks, deliberately
    const tickValues = useMemo(() => valueTicks, [valueTicksKey]);

    const accessibility: Pick<AriaAttributes, 'aria-hidden' | 'aria-label'> & {
        role?: 'img';
    } = ariaLabel === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': ariaLabel };

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
                [TREND_CHART_THRESHOLD_PLUGIN_ID]: {
                    value: threshold,
                    color: colors[dashedThresholdColor],
                    ...(showValueGuides && tickValues !== undefined
                        ? {
                              guides: {
                                  values: tickValues,
                                  color: colors.borderWeak,
                              },
                          }
                        : {}),
                },
                [TREND_CHART_PLACEHOLDER_TICKS_PLUGIN_ID]: {
                    enabled: isLoading,
                    color: colors.primary,
                },
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
                    ...(pinnedMin === undefined || pinnedMax === undefined ? {} : { min: pinnedMin, max: pinnedMax }),
                    afterFit: (axis) => {
                        axis.width = Math.max(AXIS.yWidth, axis.width);
                        axis.paddingTop = AXIS.topOverhang;
                        axis.paddingBottom = 0;
                    },
                    afterBuildTicks:
                        tickValues === undefined && !labelsThreshold
                            ? undefined
                            : (axis) => {
                                  if (tickValues !== undefined) {
                                      axis.ticks = tickValues
                                          .filter((value) => value >= axis.min && value <= axis.max)
                                          .map((value) => ({ value }));
                                  }

                                  if (!labelsThreshold || threshold < axis.min || threshold > axis.max) {
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
                        ...(wholeValues ? { precision: 0 } : {}),
                        major: { enabled: true },
                        color: ({ tick }) =>
                            labelsThreshold && tick?.value === threshold
                                ? colors[dashedThresholdColor]
                                : colors.textWeak,
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
            labelsThreshold,
            pinnedMin,
            pinnedMax,
            tickValues,
            wholeValues,
            showValueGuides,
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
                            spanGaps: widestGapCarriedAcross(bridgeMissedReadings),
                            borderColor: splitAtThreshold(threshold, colors[belowColor], colors[aboveColor]),
                            backgroundColor: splitAtThreshold(
                                threshold,
                                asFill(colors[belowColor]),
                                asFill(colors[aboveColor])
                            ),
                            borderWidth,
                            fill: true,
                            tension,
                            ...(showLatestPoint ? { clip: LATEST_POINT_RADIUS } : {}),
                            pointRadius: ({ dataIndex }) => (dataIndex === latestIndex ? LATEST_POINT_RADIUS : 0),
                            pointBackgroundColor: splitAtThreshold(threshold, colors[belowColor], colors[aboveColor]),
                            pointBorderWidth: 0,
                        },
                    ],
                }}
                options={options}
            />
            {isLoading && <div className="trend-chart-shimmer" data-testid="trend-chart-shimmer" />}
        </div>
    );
};
