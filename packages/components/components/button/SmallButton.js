import React from 'react';
import PropTypes from 'prop-types';
import { getClasses } from '../../helpers/component';

import Button from './Button';

const SmallButton = ({ children, className }) => {
    return <Button className={getClasses('pm-button pm-button--small', className)}>{children}</Button>
};

SmallButton.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

SmallButton.defaultProps = {
    className: ''
};

export default SmallButton;