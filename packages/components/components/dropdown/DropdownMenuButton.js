import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

const DropdownMenuButton = ({ className = '', disabled, loading, children, ...rest }) => {
    return (
        <button
            type="button"
            disabled={disabled || loading}
            className={classnames(['w100 pt0-5 pb0-5', className])}
            {...rest}
        >
            {children}
        </button>
    );
};

DropdownMenuButton.propTypes = {
    className: PropTypes.string,
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
    children: PropTypes.node.isRequired
};

export default DropdownMenuButton;
