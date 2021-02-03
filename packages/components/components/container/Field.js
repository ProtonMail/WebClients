import React from 'react';
import PropTypes from 'prop-types';

const Field = ({ children, className }) => {
    return <div className={['field-container', className].filter(Boolean).join(' ')}>{children}</div>;
};

Field.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

export default Field;
