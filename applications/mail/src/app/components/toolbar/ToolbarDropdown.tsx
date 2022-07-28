import { ReactNode, useState, Ref, useImperativeHandle } from 'react';
import { classnames, usePopperAnchor, DropdownButton, Dropdown, generateUID, Tooltip } from '@proton/components';

interface LockableDropdownProps {
    onClose: () => void;
    onLock: (lock: boolean) => void;
}

interface Props {
    hasCaret?: boolean;
    autoClose?: boolean;
    title?: ReactNode;
    className?: string;
    dropDownClassName?: string;
    content?: ReactNode;
    children: (props: LockableDropdownProps) => ReactNode;
    disabled?: boolean;
    noMaxSize?: boolean;
    [rest: string]: any;
    externalToggleRef?: Ref<() => void>;
}

const ToolbarDropdown = ({
    title,
    content,
    className,
    dropDownClassName,
    children,
    hasCaret = true,
    autoClose = true,
    disabled = false,
    noMaxSize = false,
    externalToggleRef,
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const [lock, setLock] = useState(false);

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    useImperativeHandle(externalToggleRef, () => toggle, []);

    return (
        <>
            <Tooltip title={title}>
                <DropdownButton
                    as="button"
                    type="button"
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={toggle}
                    hasCaret={hasCaret}
                    disabled={disabled}
                    caretClassName="toolbar-icon"
                    className={classnames([
                        'toolbar-button toolbar-button--dropdown flex flex-align-items-center',
                        className,
                    ])}
                    {...rest}
                >
                    {content}
                </DropdownButton>
            </Tooltip>

            <Dropdown
                id={uid}
                originalPlacement="bottom"
                autoClose={autoClose}
                autoCloseOutside={!lock}
                isOpen={isOpen}
                noMaxSize={noMaxSize}
                anchorRef={anchorRef}
                onClose={close}
                className={classnames(['toolbar-dropdown', dropDownClassName])}
            >
                {children({ onClose: close, onLock: setLock })}
            </Dropdown>
        </>
    );
};

export default ToolbarDropdown;
