import React from 'react';
import PropTypes from 'prop-types';

const Field = ({ children }) => {
    return <span className="pm-field-container">{children}</span>;
};

Field.propTypes = {
    children: PropTypes.node
};

export default Field;
