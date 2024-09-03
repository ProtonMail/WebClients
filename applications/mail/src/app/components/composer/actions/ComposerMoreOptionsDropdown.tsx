import type { ReactNode } from 'react';
import { useState } from 'react';

import type { DropdownButtonProps, DropdownProps } from '@proton/components';
import { Dropdown, DropdownButton, Tooltip, usePopperAnchor } from '@proton/components';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

interface Props extends Omit<DropdownButtonProps<'button'>, 'title' | 'content'> {
    autoClose?: boolean;
    title?: string;
    titleTooltip?: ReactNode;
    className?: string;
    content?: ReactNode;
    children: ReactNode;
    onOpen?: () => void;
    size?: DropdownProps['size'];
    disabled?: boolean;
    originalPlacement?: DropdownProps['originalPlacement'];
}

const ComposerMoreOptionsDropdown = ({
    title,
    titleTooltip,
    content,
    className,
    children,
    onOpen,
    size,
    autoClose = true,
    disabled = false,
    originalPlacement = 'top-start',
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('dropdown'));

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleClick = () => {
        if (!isOpen) {
            toggle();
        }
        toggle();
    };

    return (
        <>
            <Tooltip title={titleTooltip}>
                <DropdownButton
                    as="button"
                    type="button"
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={handleClick}
                    caretClassName="editor-toolbar-icon"
                    disabled={disabled}
                    className={clsx([
                        'editor-toolbar-button interactive composer-toolbar-fontDropDown max-w-full flex items-center flex-nowrap',
                        className,
                    ])}
                    title={title}
                    data-testid="composer:more-options-button"
                    {...rest}
                >
                    {content}
                </DropdownButton>
            </Tooltip>
            <Dropdown
                id={uid}
                autoClose={autoClose}
                autoCloseOutside={autoClose}
                originalPlacement={originalPlacement}
                isOpen={isOpen}
                anchorRef={anchorRef}
                size={size}
                onClose={close}
                className="editor-toolbar-dropdown"
            >
                {children}
            </Dropdown>
        </>
    );
};

export default ComposerMoreOptionsDropdown;
