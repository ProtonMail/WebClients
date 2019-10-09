import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from 'react-components';

const ToolbarButton = ({ children, loading, disabled, className, ...rest }) => {
    return (
        <button
            type="button"
            disabled={disabled || loading}
            className={classnames(['toolbar-button', className])}
            {...rest}
        >
            {children}
        </button>
    );
};

ToolbarButton.propTypes = {
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    title: PropTypes.string
};

export default ToolbarButton;
