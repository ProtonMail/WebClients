import React, { ReactNode, useState } from 'react';
import { usePopperAnchor, DropdownButton, Dropdown, generateUID, Tooltip } from 'react-components';

interface Props {
    autoClose?: boolean;
    title?: string;
    className?: string;
    content?: ReactNode;
    children: ReactNode;
    onOpen?: () => void;
    noMaxSize?: boolean;
    disabled?: boolean;
    [rest: string]: any;
}

const EditorToolbarDropdown = ({
    title,
    content,
    className,
    children,
    onOpen,
    noMaxSize,
    autoClose = true,
    disabled = false,
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('dropdown'));

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleClick = () => {
        if (!isOpen) {
            onOpen?.();
        }
        toggle();
    };

    return (
        <>
            <Tooltip title={title} className={className}>
                <DropdownButton
                    // title={title}
                    buttonRef={anchorRef}
                    isOpen={isOpen}
                    onClick={handleClick}
                    hasCaret={true}
                    disabled={disabled}
                    caretClassName="editor-toolbar-icon"
                    className="editor-toolbar-button composer-toolbar-fontDropDown mw100"
                    {...rest}
                >
                    {content}
                </DropdownButton>
            </Tooltip>
            <Dropdown
                id={uid}
                autoClose={autoClose}
                autoCloseOutside={autoClose}
                isOpen={isOpen}
                noMaxSize={noMaxSize}
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
