import * as React from 'react';
import isBetween from '@proton/shared/lib/helpers/isBetween';

import { classnames } from '../../helpers';

interface Props extends React.ComponentPropsWithoutRef<'div'> {
    /** whether or not the meter should be thin */
    thin?: boolean;
    /** whether or not the meter should be squared */
    squared?: boolean;
    /** add a textual label */
    label?: string;
    min?: number;
    low?: number;
    high?: number;
    max?: number;
    optimum?: number;
    value?: number;
}

export enum MeterValue {
    Optimum = 0,
    Min = 0,
    Low = 50,
    High = 80,
    Max = 100,
}

const { Optimum, Min, Low, High, Max } = MeterValue;

export const getMeterColor = (
    value: number,
    optimum: number = Optimum,
    min: number = Min,
    low: number = Low,
    high: number = High,
    max: number = Max
) => {
    const isLow = isBetween(value, min, low);
    const isMid = isBetween(value, low, high);
    const isHigh = isBetween(value, high, max) || value >= max;

    if (isBetween(optimum, min, low)) {
        if (isHigh) {
            return 'danger';
        }
        if (isMid) {
            return 'warning';
        }
        if (isLow) {
            return 'success';
        }
    }

    if (isBetween(optimum, low, high)) {
        if (isHigh) {
            return 'warning';
        }
        if (isMid) {
            return 'success';
        }
        if (isLow) {
            return 'warning';
        }
    }

    if (isBetween(optimum, high, max) || optimum === max) {
        if (isHigh) {
            return 'success';
        }
        if (isMid) {
            return 'warning';
        }
        if (isLow) {
            return 'danger';
        }
    }

    console.error(
        `Misuse of getMeterColor, verify values provided for value (${value}), optimum (${optimum}), min (${min}), max (${max}), low (${low}), high (${high})`
    );

    return 'danger';
};

const Meter = ({
    thin = false,
    squared = false,
    label,
    min = Min,
    max = Max,
    value = 0,
    id,
    className,
    ...rest
}: Props) => (
    <div
        id={id}
        className={classnames(['meter-bar', thin && 'is-thin', squared && 'is-squared', className])}
        role="meter"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        {...rest}
    >
        <div
            className={classnames(['meter-bar-thumb', `bg-${getMeterColor(value)}`, 'mrauto'])}
            style={{ width: `${Math.ceil(value)}%` }}
        >
            {!rest['aria-labelledby'] && <span className="sr-only">{label || `${value} / ${max}`}</span>}
        </div>
    </div>
);

export default Meter;
