import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers';

const Bordered = ({ children, className = '', ...rest }) => {
    return (
        <div className={classnames(['bordered p1 mb1', className])} {...rest}>
            {children}
        </div>
    );
};

Bordered.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
};

export default Bordered;
