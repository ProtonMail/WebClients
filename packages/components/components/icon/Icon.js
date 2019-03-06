import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component to print svg icon
 * <Icon name="label" alt="My label" />
 * @param {String} name of the svg icon present in the design-system
 * @param {String} className used on svg tag
 * @param {String} viewBox
 * @param {String} alt used by screen reader
 * @return {React.Component}
 */
const Icon = ({ name, className, viewBox, alt, ...rest }) => {
    return (
        <>
            <svg viewBox={viewBox} className={className} role="img" focusable="false" {...rest}>
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
    className: PropTypes.string
};

Icon.defaultProps = {
    viewBox: '0 0 16 16',
    className: 'icon-16p fill-global-grey'
};

export default Icon;
