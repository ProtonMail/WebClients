import React, { ReactNode, useState } from 'react';
import { classnames, usePopperAnchor, DropdownButton, Dropdown, generateUID } from 'react-components';

interface Props {
    autoClose?: boolean;
    title?: string;
    className?: string;
    content?: ReactNode;
    children: ({ onClose }: { onClose: () => void }) => ReactNode;
    size?: string;
}

const ToolbarDropdown = ({ title, content, className, children, autoClose = true, size = 'normal' }: Props) => {
    const [uid] = useState(generateUID('dropdown'));

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();

    return (
        <>
            <DropdownButton
                title={title}
                buttonRef={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret={true}
                caretClassName="toolbar-icon"
                className={classnames(['flex-item-noshrink toolbar-button toolbar-button--dropdown', className])}
            >
                {content}
            </DropdownButton>
            <Dropdown id={uid} size={size} autoClose={autoClose} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                {children({ onClose: close })}
            </Dropdown>
        </>
    );
};

export default ToolbarDropdown;
