import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

const Inner = ({ children, className = '' }) => (
    <div className={classnames(['pm-modalContentInner', className])}>{children}</div>
);

Inner.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export default Inner;
