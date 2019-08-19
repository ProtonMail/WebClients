import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

import './CircularProgress.scss';

const CircularProgress = ({
    children,
    className,
    progress,
    rootRef,
    size = 32,
    backgroundColor = 'global-altgrey',
    color = 'pm-blue',
    ...rest
}) => {
    return (
        <svg
            ref={rootRef}
            viewBox="0 0 36 36"
            className={classnames(['circular-chart', className])}
            width={size}
            height={size}
            {...rest}
        >
            <path
                className={classnames(['circle', `stroke-${backgroundColor}`])}
                strokeDasharray="100, 100"
                d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
                className={classnames(['circle', `stroke-${color}`])}
                strokeDasharray={`${progress}, 100`}
                d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {children}
        </svg>
    );
};

CircularProgress.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    rootRef: PropTypes.object,
    size: PropTypes.number,
    progress: PropTypes.number.isRequired,
    backgroundColor: PropTypes.string,
    color: PropTypes.string
};

export default CircularProgress;
