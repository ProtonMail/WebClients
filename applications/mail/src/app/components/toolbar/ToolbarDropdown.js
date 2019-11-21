import React from 'react';
import PropTypes from 'prop-types';
import { classnames, SimpleDropdown } from 'react-components';

const ToolbarDropdown = ({ title, content, className, children, autoClose = true, size = 'normal' }) => {
    return (
        <SimpleDropdown
            autoClose={autoClose}
            title={title}
            content={content}
            caretClassName="toolbar-icon"
            size={size}
            className={classnames(['flex-item-noshrink toolbar-button toolbar-button--dropdown', className])}
        >
            {children}
        </SimpleDropdown>
    );
};

ToolbarDropdown.propTypes = {
    autoClose: PropTypes.bool,
    title: PropTypes.string,
    className: PropTypes.string,
    content: PropTypes.node,
    children: PropTypes.node.isRequired,
    size: PropTypes.string
};

export default ToolbarDropdown;
