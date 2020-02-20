import React, { ReactNode, useState } from 'react';
import { classnames, usePopperAnchor, DropdownButton, Dropdown, generateUID } from 'react-components';

interface Props {
    autoClose?: boolean;
    title?: string;
    className?: string;
    content?: ReactNode;
    children: ReactNode;
    onOpen?: () => void;
    disabled?: boolean;
    size?: string;
    [rest: string]: any;
}

const EditorToolbarDropdown = ({
    title,
    content,
    className,
    children,
    onOpen,
    autoClose = true,
    disabled = false,
    size = 'normal',
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('dropdown'));

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();

    const handleClick = () => {
        if (!isOpen) {
            onOpen?.();
        }
        toggle();
    };

    return (
        <>
            <DropdownButton
                title={title}
                buttonRef={anchorRef}
                isOpen={isOpen}
                onClick={handleClick}
                hasCaret={true}
                disabled={disabled}
                caretClassName="editor-toolbar-icon"
                className={classnames([
                    'flex-item-noshrink editor-toolbar-button editor-toolbar-button--dropdown',
                    className
                ])}
                {...rest}
            >
                {content}
            </DropdownButton>
            <Dropdown
                id={uid}
                size={size}
                autoClose={autoClose}
                autoCloseOutside={autoClose}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                className="editor-toolbar-dropdown"
            >
                {children}
            </Dropdown>
        </>
    );
};

export default EditorToolbarDropdown;
