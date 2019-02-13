import React from 'react';
import PropTypes from 'prop-types';

const RightSidebar = ({ children }) => {
    return (
        <div>{children}</div>
    );
};

RightSidebar.propTypes = {
    children: PropTypes.node.isRequired
};

export default RightSidebar;