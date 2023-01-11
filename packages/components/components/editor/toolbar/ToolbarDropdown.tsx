import { ReactNode, Ref, forwardRef, useImperativeHandle, useState } from 'react';

import { PopperPlacement } from '../../../components/popper';
import { classnames, generateUID } from '../../../helpers';
import Dropdown, { DropdownProps } from '../../dropdown/Dropdown';
import DropdownButton, { DropdownButtonProps } from '../../dropdown/DropdownButton';
import { usePopperAnchor } from '../../popper';
import Tooltip from '../../tooltip/Tooltip';

interface Props extends Omit<DropdownButtonProps<'button'>, 'title'> {
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
                    className={classnames([
                        'editor-toolbar-button interactive-pseudo-inset composer-toolbar-fontDropDown max-w100 flex flex-align-items-center flex-nowrap',
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
