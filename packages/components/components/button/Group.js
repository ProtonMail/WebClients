import React from 'react';
import PropTypes from 'prop-types';

const Group = ({ children, className }) => <div className={`pm-group-buttons ${className}`}>{children}</div>;

Group.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

Group.defaultProps = {
    className: ''
};

export default Group;
