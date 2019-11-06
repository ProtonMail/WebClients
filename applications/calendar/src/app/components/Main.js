import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from 'react-components';

const Main = ({ children, className }) => {
    return <main className={classnames(['relative flex-item-fluid', className])}>{children}</main>;
};

Main.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default Main;
