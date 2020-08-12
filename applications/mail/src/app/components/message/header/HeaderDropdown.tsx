import React, { useState, ReactNode } from 'react';
import { generateUID, usePopperAnchor, DropdownButton, Dropdown, Tooltip, classnames } from 'react-components';

export interface DropdownRenderProps {
    onClose: () => void;
    onLock: (lock: boolean) => void;
    onOpenAdditionnal: (index: number) => void;
}

export interface DropdownRender {
    (props: DropdownRenderProps): ReactNode;
}

interface Props {
    dropDownClassName?: string;
    content?: ReactNode;
    title?: string;
    className?: string;
    children: DropdownRender;
    autoClose?: boolean;
    noMaxSize?: boolean;
    loading?: boolean;
    /**
     * Used on mobile to open an additional dropdown from the dropdown
     * The handler onOpenAdditionnal is passed to use them
     */
    additionalDropdowns?: DropdownRender[];
    [rest: string]: any;
}

const HeaderDropdown = ({
    title,
    content,
    children,
    autoClose,
    noMaxSize,
    loading,
    className,
    dropDownClassName,
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

    return (
        <>
            <DropdownButton
                className={classnames(['relative', className])}
                buttonRef={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret={true}
                disabled={loading}
                {...rest}
            >
                <Tooltip className="increase-surface-click" title={title}>
                    {content}
                </Tooltip>
            </DropdownButton>
            <Dropdown
                id={uid}
                className={dropDownClassName}
                originalPlacement="bottom"
                autoClose={autoClose}
                autoCloseOutside={!lock}
                isOpen={isOpen}
                noMaxSize={noMaxSize}
                anchorRef={anchorRef}
                onClose={close}
            >
                {children({ onClose: close, onLock: setLock, onOpenAdditionnal: setAdditionalOpen })}
            </Dropdown>
            {additionalDropdowns?.map((additionalDropdown, index) => {
                return (
                    <Dropdown
                        key={index}
                        id={`${uid}-${index}`}
                        className={dropDownClassName}
                        originalPlacement="bottom"
                        autoClose={false}
                        isOpen={additionalOpen === index}
                        noMaxSize={true}
                        anchorRef={anchorRef}
                        onClose={handleAdditionalClose}
                    >
                        {additionalDropdown({
                            onClose: handleAdditionalClose,
                            onLock: setLock,
                            onOpenAdditionnal: setAdditionalOpen
                        })}
                    </Dropdown>
                );
            })}
        </>
    );
};

export default HeaderDropdown;
