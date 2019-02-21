import React from 'react';
import PropTypes from 'prop-types';
import { getClasses } from '../../helpers/component';

import Button from './Button';

const LargeButton = ({ children, className, ...rest }) => {
    return <Button className={getClasses('pm-button pm-button--large mr1', className)} {...rest}>{children}</Button>
};

LargeButton.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

LargeButton.defaultProps = {
    className: ''
};

export default LargeButton;