import React from 'react';
import { c } from 'ttag';

import { classnames } from '../../helpers';

interface Props {
    size?: number;
    color?: string;
    className?: string;
}
const FullLoader = ({ size = 50, color, className }: Props) => {
    const isSmall = size < 50;
    const isMedium = size >= 50 && size < 150;

    return (
        <>
            <svg
                className={classnames(['full-loader', isSmall && 'is-xbold', isMedium && 'is-bold', className])}
                style={color ? { color } : undefined}
                viewBox="0 0 200 200"
                width={size}
                height={size}
                role="img"
                aria-hidden="true"
                focusable="false"
            >
                <circle cx="100" cy="100" r="80" className="full-loader-circle" />
                <circle cx="100" cy="100" r="80" className="full-loader-circle" />
            </svg>
            <span className="sr-only">{c('Info').t`Loading`}</span>
        </>
    );
};

export default FullLoader;
