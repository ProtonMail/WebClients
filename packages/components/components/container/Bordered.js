import React from 'react';
import PropTypes from 'prop-types';
import { getClasses } from '../../helpers/component';

const Bordered = ({ children, className }) => {
    return <div className={getClasses('bordered-container p1', className)}>{children}</div>;
};

Bordered.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default Bordered;