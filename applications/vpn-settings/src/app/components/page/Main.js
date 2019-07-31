import React from 'react';
import PropTypes from 'prop-types';

const Main = ({ className, children }) => {
    return <main className={`main-area-content bg-white relative flex-item-fluid ${className}`}>{children}</main>;
};

Main.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

Main.defaultProps = {
    className: ''
};

export default Main;
