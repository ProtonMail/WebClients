import { forwardRef, ReactNode, Ref, useImperativeHandle, useState } from 'react';

import { classnames, generateUID } from '../../../helpers';
import { usePopperAnchor } from '../../popper';
import Tooltip from '../../tooltip/Tooltip';
import DropdownButton from '../../dropdown/DropdownButton';
import Dropdown from '../../dropdown/Dropdown';

interface Props {
    autoClose?: boolean;
    autoCloseOutside?: boolean;
    title?: string;
    className?: string;
    content?: ReactNode;
    children: ReactNode;
    onOpen?: () => void;
    noMaxSize?: boolean;
    disabled?: boolean;
    originalPlacement?: string;
    hasCaret?: boolean;
    [rest: string]: any;
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
        noMaxSize,
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
                        'editor-toolbar-button interactive composer-toolbar-fontDropDown max-w100 flex flex-align-items-center flex-nowrap',
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

export default forwardRef(ToolbarDropdown);
