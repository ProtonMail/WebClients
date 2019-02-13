import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';
import { getClasses } from '../../helpers/component';

const PrimaryButton = ({ children, className, ...rest }) => {
    return (<Button className={getClasses('pm-button-blue', className)} {...rest}>{children}</Button>);
};

PrimaryButton.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export default PrimaryButton;