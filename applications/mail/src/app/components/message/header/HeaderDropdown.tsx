import { MutableRefObject, ReactNode, useEffect, useState } from 'react';

import { Button } from '@proton/atoms';
import {
    Dropdown,
    DropdownButton,
    DropdownProps,
    DropdownSizeUnit,
    Tooltip,
    generateUID,
    usePopperAnchor,
} from '@proton/components';
import { DropdownButtonProps } from '@proton/components/components/dropdown/DropdownButton';

export interface DropdownRenderProps {
    onClose: () => void;
    onLock: (lock: boolean) => void;
    onOpenAdditionnal: (index: number) => void;
}

export interface DropdownRender {
    contentProps?: DropdownProps['contentProps'];
    render: (props: DropdownRenderProps) => ReactNode;
}

interface Props extends Omit<DropdownButtonProps<typeof Button>, 'title'> {
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
     * The handler onOpenAdditionnal is passed to use them
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

export default HeaderDropdown;
