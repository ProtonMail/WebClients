import React from 'react';
import PropTypes from 'prop-types';

const ErrorZone = ({ children, id }) => {
    return (
        <div className="color-global-warning error-zone" id={id}>
            {children}
        </div>
    );
};

ErrorZone.propTypes = {
    children: PropTypes.node,
    id: PropTypes.string.isRequired
};

export default ErrorZone;
