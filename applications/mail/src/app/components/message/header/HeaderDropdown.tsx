import type { MutableRefObject, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { Button } from '@proton/atoms';
import generateUID from '@proton/atoms/generateUID';
import type { DropdownProps } from '@proton/components';
import { Dropdown, DropdownButton, DropdownSizeUnit, Tooltip, usePopperAnchor } from '@proton/components';
import type { DropdownButtonProps } from '@proton/components/components/dropdown/DropdownButton';

export interface DropdownRenderProps {
    onClose: () => void;
    onLock: (lock: boolean) => void;
    onOpenAdditional: (index: number) => void;
}

export interface DropdownRender {
    contentProps?: DropdownProps['contentProps'];
    render: (props: DropdownRenderProps) => ReactNode;
}

interface Props extends Omit<DropdownButtonProps<typeof Button>, 'title' | 'content' | 'children'> {
    dropDownClassName?: string;
    content?: ReactNode;
    title?: ReactNode;
    className?: string;
    children: DropdownRender;
    autoClose?: boolean;
    dropdownSize?: DropdownProps['size'];
    loading?: boolean;
    /**
     * Used on mobile to open an additional dropdown from the dropdown
     * The handler onOpenAdditional is passed to use them
     */
    additionalDropdowns?: DropdownRender[];
    externalToggleRef?: MutableRefObject<() => void>;
}

const HeaderDropdown = ({
    title,
    content,
    children,
    autoClose,
    dropdownSize,
    loading,
    className,
    dropDownClassName,
    externalToggleRef,
    additionalDropdowns,
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const [lock, setLock] = useState(false);
    const [additionalOpen, setAdditionalOpen] = useState<number>();

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleAdditionalClose = () => {
        setAdditionalOpen(undefined);
    };

    useEffect(() => {
        if (externalToggleRef) {
            externalToggleRef.current = toggle;
        }
    }, []);

    return (
        <>
            <Tooltip title={title}>
                <DropdownButton
                    as={Button}
                    className={className}
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={toggle}
                    disabled={loading}
                    aria-expanded={isOpen}
                    {...rest}
                >
                    {content}
                </DropdownButton>
            </Tooltip>
            <Dropdown
                id={uid}
                className={dropDownClassName}
                originalPlacement="bottom"
                autoClose={autoClose}
                autoCloseOutside={!lock}
                isOpen={isOpen}
                size={dropdownSize}
                anchorRef={anchorRef}
                onClose={close}
                contentProps={children.contentProps}
            >
                {children.render({ onClose: close, onLock: setLock, onOpenAdditional: setAdditionalOpen })}
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
                        data-testid={`message-view-more-dropdown:additional-${index}`}
                    >
                        {additionalDropdown.render({
                            onClose: handleAdditionalClose,
                            onLock: setLock,
                            onOpenAdditional: setAdditionalOpen,
                        })}
                    </Dropdown>
                );
            })}
        </>
    );
};

export default HeaderDropdown;
