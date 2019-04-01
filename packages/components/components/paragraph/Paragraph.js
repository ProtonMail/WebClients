import React from 'react';
import PropTypes from 'prop-types';

const Paragraph = ({ className, children }) => {
    return <div className={`pt1 pb1 ${className}`}>{children}</div>;
};

Paragraph.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

Paragraph.defaultProps = {
    className: ''
};

export default Paragraph;
