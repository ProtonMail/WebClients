import React from 'react';

import { classnames } from '../../helpers';

interface Props {
    value?: number;
    max?: number;
    id?: string;
    className?: string;
}

const Progress = ({ value = 50, max = 100, id, className, ...rest }: Props) => {
    return (
        <progress
            aria-describedby={id}
            className={classnames(['progress-bar w100', className])}
            value={value}
            max={max}
            {...rest}
        />
    );
};

export default Progress;
