import type { ReactNode, Ref } from 'react';
import { forwardRef, useImperativeHandle, useState } from 'react';

import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import type { DropdownButtonProps } from '@proton/components/components/dropdown/DropdownButton';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import type { PopperPlacement } from '@proton/components/components/popper/interface';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

interface Props extends Omit<DropdownButtonProps<'button'>, 'title' | 'content'> {
    autoClose?: boolean;
    autoCloseOutside?: boolean;
    title?: string;
    className?: string;
    content?: ReactNode;
    children: ReactNode;
    onOpen?: () => void;
    dropdownSize?: DropdownProps['size'];
    disabled?: boolean;
    originalPlacement?: PopperPlacement;
    hasCaret?: boolean;
}

export interface ToolbarDropdownAction {
    close: () => void;
    open: () => void;
}

const ToolbarDropdown = (
    {
        title,
        content,
        className,
        children,
        onOpen,
        dropdownSize,
        autoClose = true,
        autoCloseOutside = true,
        disabled = false,
        originalPlacement = 'bottom',
        hasCaret = false,
        ...rest
    }: Props,
    ref: Ref<ToolbarDropdownAction>
) => {
    const [uid] = useState(generateUID('dropdown'));

    const { anchorRef, isOpen, toggle, close, open } = usePopperAnchor<HTMLButtonElement>();

    const handleClick = () => {
        if (!isOpen) {
            onOpen?.();
        }
        toggle();
    };

    useImperativeHandle(ref, () => ({ close, open }), [close, open]);

    return (
        <>
            <Tooltip title={title}>
                <DropdownButton
                    as="button"
                    type="button"
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={handleClick}
                    hasCaret={hasCaret}
                    disabled={disabled}
                    caretClassName="editor-toolbar-icon"
                    className={clsx([
                        'editor-toolbar-button interactive-pseudo-inset relative composer-toolbar-fontDropDown max-w-full flex items-center flex-nowrap',
                        className,
                    ])}
                    title={title}
                    {...rest}
                >
                    {content}
                </DropdownButton>
            </Tooltip>
            <Dropdown
                id={uid}
                autoClose={autoClose}
                autoCloseOutside={autoCloseOutside}
                originalPlacement={originalPlacement}
                isOpen={isOpen}
                size={dropdownSize}
                anchorRef={anchorRef}
                onClose={close}
                className="editor-toolbar-dropdown"
            >
                {children}
            </Dropdown>
        </>
    );
};

export default forwardRef(ToolbarDropdown);
