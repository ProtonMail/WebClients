import React from 'react';
import PropTypes from 'prop-types';

import { classnames } from '../../helpers/component';

const Progress = ({ value = 50, low = 0, min = 0, max = 100, id, ...rest }) => {
    const high = value > 80 ? 80 : 50;
    return (
        <meter
            aria-describedby={id}
            className={classnames(['setting-meterbar inbl w100', value > 80 && 'setting-meterbar--high'])}
            high={high}
            low={low}
            value={value}
            min={min}
            max={max}
            {...rest}
        />
    );
};

Progress.propTypes = {
    id: PropTypes.string,
    value: PropTypes.number,
    max: PropTypes.number,
    min: PropTypes.number,
    low: PropTypes.number
};

export default Progress;
