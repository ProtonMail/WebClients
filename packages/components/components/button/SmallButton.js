import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';
import { classnames } from '../../helpers/component';

const SmallButton = ({ children, className = '', ...rest }) => {
    return (
        <Button className={classnames(['pm-button--small', className])} {...rest}>
            {children}
        </Button>
    );
};

SmallButton.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export default SmallButton;
