import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';
import { getClasses } from '../../helpers/component';

const ButtonGroup = ({ children, className, ...rest }) => (
    <Button className={getClasses('pm-group-button', className)} {...rest}>
        {children}
    </Button>
);

ButtonGroup.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default ButtonGroup;
