import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Dropdown from './Dropdown';
import { usePopperAnchor } from '../popper';
import DropdownButton from './DropdownButton';
import { generateUID } from '../../helpers/component';

/**
 * @type any
 */
const SimpleDropdown = ({ content, children, originalPlacement, size, autoClose, ...rest }) => {
    const [uid] = useState(generateUID('dropdown'));

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();

    return (
        <>
            <DropdownButton {...rest} buttonRef={anchorRef} isOpen={isOpen} onClick={toggle} hasCaret>
                {content}
            </DropdownButton>
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

SimpleDropdown.propTypes = {
    content: PropTypes.node,
    children: PropTypes.node,
    originalPlacement: PropTypes.string,
    size: PropTypes.string,
    autoClose: PropTypes.bool
};

export default SimpleDropdown;
