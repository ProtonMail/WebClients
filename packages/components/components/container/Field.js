import React from 'react';
import PropTypes from 'prop-types';

const Field = ({ children, className }) => {
    return <span className={className}>{children}</span>;
};

Field.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

Field.defaultProps = {
    className: 'pm-field-container'
};

export default Field;
