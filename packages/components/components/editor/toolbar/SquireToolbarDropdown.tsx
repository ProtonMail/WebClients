import React, { ReactNode, useState } from 'react';

import { classnames, generateUID } from '../../../helpers';
import { usePopperAnchor } from '../../popper';
import Tooltip from '../../tooltip/Tooltip';
import DropdownButton from '../../dropdown/DropdownButton';
import Dropdown from '../../dropdown/Dropdown';

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

const SquireToolbarDropdown = ({
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
            <Tooltip title={title}>
                <DropdownButton
                    as="button"
                    type="button"
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={handleClick}
                    hasCaret
                    disabled={disabled}
                    caretClassName="editor-toolbar-icon"
                    className={classnames([
                        'editor-toolbar-button interactive composer-toolbar-fontDropDown max-w100 flex flex-align-items-center flex-nowrap',
                        className,
                    ])}
                    tabIndex={-1}
                    title={title}
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

export default SquireToolbarDropdown;
