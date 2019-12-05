import React, { useState, ReactNode } from 'react';
import { generateUID, usePopperAnchor, DropdownButton, Dropdown } from 'react-components';

interface Props {
    content?: ReactNode;
    children: ({ onClose }: { onClose: () => void }) => ReactNode;
    autoClose?: boolean;
    [rest: string]: any;
}

const HeaderDropdown = ({ content, children, autoClose, ...rest }: Props) => {
    const [uid] = useState(generateUID('dropdown'));

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();

    return (
        <>
            <DropdownButton {...rest} buttonRef={anchorRef} isOpen={isOpen} onClick={toggle} caretClassName={null}>
                {content}
            </DropdownButton>
            <Dropdown id={uid} autoClose={autoClose} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                {children({ onClose: close })}
            </Dropdown>
        </>
    );
};

export default HeaderDropdown;
