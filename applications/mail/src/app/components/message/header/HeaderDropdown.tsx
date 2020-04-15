import React, { useState, ReactNode } from 'react';
import { generateUID, usePopperAnchor, DropdownButton, Dropdown } from 'react-components';

interface LockableDropdownProps {
    onClose: () => void;
    onLock: (lock: boolean) => void;
}

interface Props {
    dropDownClassName?: string;
    content?: ReactNode;
    children: (props: LockableDropdownProps) => ReactNode;
    autoClose?: boolean;
    noMaxSize?: boolean;
    [rest: string]: any;
}

const HeaderDropdown = ({ content, children, autoClose, noMaxSize, dropDownClassName, ...rest }: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const [lock, setLock] = useState(false);

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton {...rest} buttonRef={anchorRef} isOpen={isOpen} onClick={toggle} hasCaret={true}>
                {content}
            </DropdownButton>
            <Dropdown
                id={uid}
                className={dropDownClassName}
                originalPlacement="bottom"
                autoClose={autoClose}
                autoCloseOutside={!lock}
                isOpen={isOpen}
                noMaxSize={noMaxSize}
                anchorRef={anchorRef}
                onClose={close}
            >
                {children({ onClose: close, onLock: setLock })}
            </Dropdown>
        </>
    );
};

export default HeaderDropdown;
