import React, { useState } from 'react';
import Dropdown from './Dropdown';
import { usePopperAnchor } from '../popper';
import DropdownButton, { Props as DropdownButtonProps } from './DropdownButton';
import { generateUID } from '../../helpers/component';

interface Props extends DropdownButtonProps {
    hasCaret?: boolean;
    content: React.ReactNode;
    children?: React.ReactNode;
    originalPlacement?: string;
    autoClose?: boolean;
}

const SimpleDropdown = ({ content, children, originalPlacement, autoClose, hasCaret = true, ...rest }: Props) => {
    const [uid] = useState(generateUID('dropdown'));

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton {...rest} buttonRef={anchorRef} isOpen={isOpen} onClick={toggle} hasCaret={hasCaret}>
                {content}
            </DropdownButton>
            <Dropdown
                id={uid}
                originalPlacement={originalPlacement}
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

export default SimpleDropdown;
