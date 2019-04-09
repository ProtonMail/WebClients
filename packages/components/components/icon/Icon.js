import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component to print svg icon
 * <Icon name="label" alt="My label" />
 * @param {String} name of the svg icon present in the design-system
 * @param {String} className used on svg tag
 * @param {String} fill      To construct the fill-global className
 * @param {Number} size      To construct the icon size className icon-<size>p (default 16)
 * @param {String} viewBox
 * @param {String} alt used by screen reader
 * @return {React.Component}
 */
const Icon = ({ name, className, viewBox, alt, fill, size, ...rest }) => {
    const fillClass = fill ? `fill-global-${fill} ` : '';
    return (
        <>
            <svg
                viewBox={viewBox}
                className={`icon-${size}p `.concat(fillClass, className).trim()}
                role="img"
                focusable="false"
                {...rest}
            >
                <use xlinkHref={`#shape-${name}`} />
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};

Icon.propTypes = {
    alt: PropTypes.string,
    name: PropTypes.string.isRequired,
    viewBox: PropTypes.string,
    className: PropTypes.string,
    fill: PropTypes.string,
    size: PropTypes.number
};

Icon.defaultProps = {
    viewBox: '0 0 16 16',
    size: 16,
    fill: 'grey',
    className: ''
};

export default Icon;
