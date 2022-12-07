import { ReactNode, useState } from 'react';

import {
    Dropdown,
    DropdownButton,
    DropdownButtonProps,
    DropdownProps,
    Tooltip,
    classnames,
    generateUID,
    usePopperAnchor,
} from '@proton/components';

interface Props extends Omit<DropdownButtonProps<'button'>, 'title'> {
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
                    className={classnames([
                        'editor-toolbar-button interactive composer-toolbar-fontDropDown max-w100 flex flex-align-items-center flex-nowrap',
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
