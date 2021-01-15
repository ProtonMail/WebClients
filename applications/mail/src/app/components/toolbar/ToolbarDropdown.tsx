import React, { ReactNode, useState, useEffect } from 'react';
import { classnames, usePopperAnchor, DropdownButton, Dropdown, generateUID, Tooltip } from 'react-components';

interface LockableDropdownProps {
    onClose: () => void;
    onLock: (lock: boolean) => void;
}

interface Props {
    autoClose?: boolean;
    title?: ReactNode;
    className?: string;
    dropDownClassName?: string;
    content?: ReactNode;
    children: (props: LockableDropdownProps) => ReactNode;
    disabled?: boolean;
    noMaxSize?: boolean;
    [rest: string]: any;
    externalToggleRef?: React.MutableRefObject<() => void>;
}

const ToolbarDropdown = ({
    title,
    content,
    className,
    dropDownClassName,
    children,
    autoClose = true,
    disabled = false,
    noMaxSize = false,
    externalToggleRef,
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const [lock, setLock] = useState(false);

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    useEffect(() => {
        if (externalToggleRef) {
            externalToggleRef.current = toggle;
        }
    }, []);

    return (
        <>
            <Tooltip title={title} className="flex flex-item-noshrink">
                <DropdownButton
                    buttonRef={anchorRef}
                    isOpen={isOpen}
                    onClick={toggle}
                    hasCaret
                    disabled={disabled}
                    caretClassName="toolbar-icon"
                    className={classnames(['flex-item-noshrink toolbar-button toolbar-button--dropdown', className])}
                    {...rest}
                >
                    {content}
                </DropdownButton>
            </Tooltip>

            <Dropdown
                id={uid}
                originalPlacement="bottom"
                autoClose={autoClose}
                autoCloseOutside={!lock}
                isOpen={isOpen}
                noMaxSize={noMaxSize}
                anchorRef={anchorRef}
                onClose={close}
                className={classnames(['toolbar-dropdown', dropDownClassName])}
            >
                {children({ onClose: close, onLock: setLock })}
            </Dropdown>
        </>
    );
};

export default ToolbarDropdown;
