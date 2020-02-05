import React from 'react';
import { c } from 'ttag';

import { classnames } from '../../helpers/component';

interface Props {
    size?: number;
    color?: string;
    className?: string;
}
const FullLoader = ({ size = 50, color, className }: Props) => {
    const isSmall = size < 50;

    const diameter = isSmall ? 10 : 100;
    const radius = isSmall ? 8 : 80;
    const viewBox = isSmall ? '0 0 20 20' : '0 0 200 200';

    return (
        <>
            <svg
                className={classnames(['loadingAnimation', className])}
                viewBox={viewBox}
                width={size}
                height={size}
                role="img"
                aria-hidden="true"
                focusable="false"
            >
                <circle
                    cx={diameter}
                    cy={diameter}
                    r={radius}
                    className={classnames([
                        'loadingAnimation-circle',
                        isSmall ? 'loadingAnimation-orbit1--smaller' : 'loadingAnimation-orbit1',
                        isSmall && 'loadingAnimation-circle--smaller',
                        color && `loadingAnimation-circle--${color}`
                    ])}
                />
                <circle
                    cx={diameter}
                    cy={diameter}
                    r={radius}
                    className={classnames([
                        'loadingAnimation-circle',
                        isSmall ? 'loadingAnimation-orbit2--smaller' : 'loadingAnimation-orbit2',
                        isSmall && 'loadingAnimation-circle--smaller',
                        color && `loadingAnimation-circle--${color}`
                    ])}
                />
            </svg>
            <span className="sr-only">{c('Info').t`Loading`}</span>
        </>
    );
};

export default FullLoader;
