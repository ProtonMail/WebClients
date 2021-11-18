import Tooltip from '@proton/components/components/tooltip/Tooltip';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import { classnames, generateUID, usePopperAnchor } from '@proton/components';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { ReactNode, useState } from 'react';

interface Props {
    autoClose?: boolean;
    title?: string;
    titleTooltip?: ReactNode;
    className?: string;
    content?: ReactNode;
    children: ReactNode;
    onOpen?: () => void;
    noMaxSize?: boolean;
    disabled?: boolean;
    originalPlacement?: string;

    [rest: string]: any;
}

const ComposerMoreOptionsDropdown = ({
    title,
    titleTooltip,
    content,
    className,
    children,
    onOpen,
    noMaxSize,
    autoClose = true,
    disabled = false,
    originalPlacement = 'top-left',
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
                originalPlacement={originalPlacement}
                isOpen={isOpen}
                anchorRef={anchorRef}
                noMaxSize={noMaxSize}
                onClose={close}
                className="editor-toolbar-dropdown"
            >
                {children}
            </Dropdown>
        </>
    );
};

export default ComposerMoreOptionsDropdown;
