import type { BarDataPoint, HorizontalBarChartProps } from './HorizontalBarChart.types';
import { EMPTY_RANGE_MAX } from './constants';

type Span = { min: number; max: number };

const NOTHING_TO_MEASURE: Span = { min: 0, max: EMPTY_RANGE_MAX };

const spanBetweenZeroAnd = (reading: number): Span =>
    reading === 0 ? NOTHING_TO_MEASURE : { min: Math.min(0, reading), max: Math.max(0, reading) };

export const deriveMinAndMax = (data: BarDataPoint[], valueRange?: HorizontalBarChartProps['valueRange']): Span => {
    if (valueRange !== undefined) {
        return valueRange;
    }

    if (data.length === 0) {
        return NOTHING_TO_MEASURE;
    }

    const readings = data.map(({ value }) => value);
    const smallest = Math.min(...readings);
    const largest = Math.max(...readings);

    const everyReadingIsTheSame = smallest === largest;

    return everyReadingIsTheSame ? spanBetweenZeroAnd(smallest) : { min: smallest, max: largest };
};
