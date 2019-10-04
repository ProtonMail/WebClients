import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';
import { classnames } from '../../helpers/component';

const ButtonGroup = ({ children, className = '', ...rest }) => (
    <Button className={classnames(['pm-group-button', className])} {...rest}>
        {children}
    </Button>
);

ButtonGroup.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export default ButtonGroup;
