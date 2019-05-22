import React from 'react';
import PropTypes from 'prop-types';

const Field = ({ children, className }) => {
    return <div className={className}>{children}</div>;
};

Field.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

Field.defaultProps = {
    className: 'pm-field-container'
};

export default Field;
