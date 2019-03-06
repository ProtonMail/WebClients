import React from 'react';
import PropTypes from 'prop-types';

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
