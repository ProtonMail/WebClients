/**
 * This is a temporary icon with "repeat" shape while we don't have the proper icon in the design system
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { classnames } from 'react-components';

const RepeatIcon = ({
    className = '',
    viewBox = '0 0 16 16',
    alt,
    fill = 'grey',
    color,
    size = 16,
    rotate = 0,
    ...rest
}) => {
    const fillClass = fill ? `fill-global-${fill} ` : '';
    const style = {
        ...(color && { fill: color }),
        ...(rotate && { transform: `rotate(${rotate}deg)` })
    };

    return (
        <>
            <svg
                style={style}
                viewBox={viewBox}
                className={classnames([`icon-${size}p`, fillClass, className])}
                role="img"
                focusable="false"
                {...rest}
            >
                <path d="M12.666 12.709H6.614l.838-.838a.317.317 0 000-.45.317.317 0 00-.45 0L5.62 12.802a.317.317 0 000 .45l1.382 1.382a.317.317 0 00.226.094.317.317 0 00.226-.544l-.838-.838h6.053a1.33 1.33 0 001.327-1.328V4.71a1.33 1.33 0 00-1.327-1.327h-.883a.32.32 0 100 .64h.883c.38 0 .69.31.69.69v7.31a.694.694 0 01-.693.687zM8.996 2.094a.317.317 0 00-.45 0 .317.317 0 000 .45l.838.838H3.33A1.33 1.33 0 002.004 4.71v7.31a1.33 1.33 0 001.327 1.327h.883a.32.32 0 100-.64H3.33c-.38 0-.69-.31-.69-.69V4.71c0-.38.31-.69.69-.69h6.053l-.839.838a.317.317 0 00.227.544.317.317 0 00.226-.094l1.382-1.382a.319.319 0 000-.453l-1.384-1.38z" />
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};

RepeatIcon.propTypes = {
    alt: PropTypes.string,
    viewBox: PropTypes.string,
    className: PropTypes.string,
    fill: PropTypes.string,
    size: PropTypes.number,
    color: PropTypes.string,
    rotate: PropTypes.number
};

export default memo(RepeatIcon);
