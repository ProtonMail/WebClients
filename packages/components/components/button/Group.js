import React from 'react';
import PropTypes from 'prop-types';

const Group = ({ children }) => <div className="pm-group-buttons mr1">{children}</div>;

Group.propTypes = {
    children: PropTypes.node.isRequired
};

export default Group;