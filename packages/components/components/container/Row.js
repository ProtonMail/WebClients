import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

const Row = ({ children, className = '', collapseOnMobile = true, ...rest }) => {
    return (
        <div
            className={classnames(['flex flex-nowrap mb1', collapseOnMobile && 'onmobile-flex-column ', className])}
            {...rest}
        >
            {children}
        </div>
    );
};

Row.propTypes = {
    children: PropTypes.node.isRequired,
    collapseOnMobile: PropTypes.bool,
    className: PropTypes.string
};

export default Row;
