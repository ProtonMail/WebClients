import React from 'react';
import PropTypes from 'prop-types';

import { classnames } from '../../helpers/component';

const FullLoader = ({ size = 50, color, className }) => {
    const smaller = size < 50;
    return (
        <svg className={classnames(['loadingAnimation', className])} viewBox="0 0 200 200" width={size} height={size}>
            <circle
                cx="100"
                cy="100"
                r="80"
                className={classnames([
                    'loadingAnimation-circle',
                    smaller ? 'loadingAnimation-orbit1--smaller' : 'loadingAnimation-orbit1',
                    smaller && 'loadingAnimation-circle--smaller',
                    color && `loadingAnimation-circle--${color}`
                ])}
            />
            <circle
                cx="100"
                cy="100"
                r="80"
                className={classnames([
                    'loadingAnimation-circle',
                    smaller ? 'loadingAnimation-orbit2--smaller' : 'loadingAnimation-orbit2',
                    smaller && 'loadingAnimation-circle--smaller',
                    color && `loadingAnimation-circle--${color}`
                ])}
            />
        </svg>
    );
};

FullLoader.propTypes = {
    size: PropTypes.number,
    color: PropTypes.string,
    className: PropTypes.string
};

export default FullLoader;
