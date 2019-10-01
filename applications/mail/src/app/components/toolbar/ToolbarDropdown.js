import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownCaret, usePopperAnchor, generateUID, classnames } from 'react-components';

const ToolbarDropdown = ({ title, content, className, children, originalPlacement, size, autoClose }) => {
    const [uid] = useState(generateUID('toolbar-dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();

    return (
        <>
            <button
                title={title}
                type="button"
                className={classnames(['flex-item-noshrink toolbar-button toolbar-button--dropdown', className])}
                aria-expanded={isOpen}
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
            >
                <span className="mauto">
                    <span className="mr0-5">{content}</span>
                    <DropdownCaret className="toolbar-icon" isOpen={isOpen} />
                </span>
            </button>
            <Dropdown
                id={uid}
                originalPlacement={originalPlacement}
                size={size}
                autoClose={autoClose}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
            >
                {children}
            </Dropdown>
        </>
    );
};

ToolbarDropdown.propTypes = {
    title: PropTypes.string,
    className: PropTypes.string,
    content: PropTypes.node,
    children: PropTypes.node.isRequired,
    originalPlacement: PropTypes.string,
    size: PropTypes.string,
    autoClose: PropTypes.bool
};

export default ToolbarDropdown;
