import React from 'react';
import PropTypes from 'prop-types';
import { classnames, SimpleDropdown } from 'react-components';

const ToolbarDropdown = ({ title, content, className, children, autoClose = true }) => {
    return (
        <SimpleDropdown
            autoClose={autoClose}
            title={title}
            content={content}
            caretClassName="toolbar-icon"
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
    children: PropTypes.node.isRequired
};

export default ToolbarDropdown;
