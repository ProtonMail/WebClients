import React from 'react';

import { classnames } from '../../helpers';

interface Props {
    min?: number;
    low?: number;
    high?: number;
    max?: number;
    optimum?: number;
    value?: number;
    id?: string;
    className?: string;
}

/**
 * Component for visual rendering of a graduated and limited value
 * @param min               minimum possible value of a data
 * @param max               maximum possible value of a data
 * @param low               when the value of the data can be understood as low
 * @param high              when the value of the data can be understood as high
 * @param optimum           the optimum value of the data. Will influence the color of low and high values.
 * @param value             current value of a data
 * @param aria-describedby  an id to a description of the data
 * @param className         any class name
 */
const Meter = ({ min = 0, low = 50, high = 80, max = 100, optimum = 0, value = 50, id, className }: Props) => {
    return (
        <meter
            min={min}
            low={low}
            high={high}
            max={max}
            optimum={optimum}
            value={value}
            aria-describedby={id}
            className={classnames(['meter-bar', className])}
        />
    );
};

export default Meter;
