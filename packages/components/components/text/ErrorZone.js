import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

const ErrorZone = ({ children, id, className }) => {
    return (
        <div className={classnames(['color-global-warning error-zone', className])} id={id}>
            {children}
        </div>
    );
};

ErrorZone.propTypes = {
    children: PropTypes.node,
    id: PropTypes.string,
    className: PropTypes.string
};

export default ErrorZone;
