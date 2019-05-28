import React from 'react';
import PropTypes from 'prop-types';

const Preformatted = ({ className, ...rest }) => {
    return <pre className={`bg-global-muted p1 mb1 scroll-if-needed ${className}`} {...rest} />;
};

Preformatted.propTypes = {
    className: PropTypes.string
};

Preformatted.defaultProps = {
    className: ''
};

export default Preformatted;
