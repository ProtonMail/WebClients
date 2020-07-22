import React, { useState, ReactNode } from 'react';
import { generateUID, usePopperAnchor, DropdownButton, Dropdown, Tooltip, classnames } from 'react-components';

interface LockableDropdownProps {
    onClose: () => void;
    onLock: (lock: boolean) => void;
}

interface Props {
    dropDownClassName?: string;
    content?: ReactNode;
    title?: string;
    className?: string;
    children: (props: LockableDropdownProps) => ReactNode;
    autoClose?: boolean;
    noMaxSize?: boolean;
    loading?: boolean;
    [rest: string]: any;
}

const HeaderDropdown = ({
    title,
    content,
    children,
    autoClose,
    noMaxSize,
    loading,
    className,
    dropDownClassName,
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const [lock, setLock] = useState(false);

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                className={classnames(['relative', className])}
                buttonRef={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret={true}
                disabled={loading}
                {...rest}
            >
                <Tooltip className="increase-surface-click" title={title}>
                    {content}
                </Tooltip>
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
