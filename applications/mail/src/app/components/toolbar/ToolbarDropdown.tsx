import { ReactNode, Ref, useImperativeHandle, useState } from 'react';

import {
    Dropdown,
    DropdownButton,
    DropdownButtonProps,
    DropdownProps,
    DropdownSizeUnit,
    Tooltip,
    generateUID,
    usePopperAnchor,
} from '@proton/components';
import clsx from '@proton/utils/clsx';

export interface DropdownRenderProps {
    onClose: () => void;
    onLock: (lock: boolean) => void;
    onOpenAdditionnal: (index: number) => void;
}

export interface DropdownRender {
    contentProps?: DropdownProps['contentProps'];
    render: (props: DropdownRenderProps) => ReactNode;
}

interface Props extends Omit<DropdownButtonProps<'button'>, 'title' | 'content'> {
    hasCaret?: boolean;
    autoClose?: boolean;
    title?: ReactNode;
    className?: string;
    dropDownClassName?: string;
    content?: ReactNode;
    children: DropdownRender;
    disabled?: boolean;
    dropdownSize?: DropdownProps['size'];
    /**
     * Used on mobile to open an additional dropdown from the dropdown
     * The handler onOpenAdditionnal is passed to use them
     */
    additionalDropdowns?: DropdownRender[];
    externalToggleRef?: Ref<() => void>;
    externalCloseRef?: Ref<() => void>;
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
    dropdownSize,
    additionalDropdowns,
    externalToggleRef,
    externalCloseRef,
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const [lock, setLock] = useState(false);
    const [additionalOpen, setAdditionalOpen] = useState<number>();

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleAdditionalClose = () => {
        setAdditionalOpen(undefined);
    };

    useImperativeHandle(externalToggleRef, () => toggle, []);
    useImperativeHandle(externalCloseRef, () => close, []);

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
                    className={clsx([
                        'toolbar-button flex flex-align-items-center',
                        hasCaret && 'toolbar-button--dropdown',
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
                size={dropdownSize}
                anchorRef={anchorRef}
                onClose={close}
                className={clsx(['toolbar-dropdown', dropDownClassName])}
                contentProps={children.contentProps}
            >
                {children.render({ onClose: close, onLock: setLock, onOpenAdditionnal: setAdditionalOpen })}
            </Dropdown>
            {additionalDropdowns?.map((additionalDropdown, index) => {
                return (
                    <Dropdown
                        key={index} // eslint-disable-line react/no-array-index-key
                        id={`${uid}-${index}`}
                        className={dropDownClassName}
                        originalPlacement="bottom"
                        autoClose={false}
                        autoCloseOutside={!lock}
                        isOpen={additionalOpen === index}
                        size={{ maxWidth: DropdownSizeUnit.Viewport, maxHeight: DropdownSizeUnit.Viewport }}
                        anchorRef={anchorRef}
                        onClose={handleAdditionalClose}
                        contentProps={additionalDropdown.contentProps}
                    >
                        {additionalDropdown.render({
                            onClose: handleAdditionalClose,
                            onLock: setLock,
                            onOpenAdditionnal: setAdditionalOpen,
                        })}
                    </Dropdown>
                );
            })}
        </>
    );
};

export default ToolbarDropdown;
