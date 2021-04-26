import React, { useState, ReactNode, useEffect } from 'react';
import { generateUID, usePopperAnchor, DropdownButton, Dropdown, Tooltip, Button } from 'react-components';

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
    title?: ReactNode;
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
    externalToggleRef?: React.MutableRefObject<() => void>;
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
                    hasCaret
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
                noMaxSize={noMaxSize}
                anchorRef={anchorRef}
                onClose={close}
            >
                {children({ onClose: close, onLock: setLock, onOpenAdditionnal: setAdditionalOpen })}
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
                        noMaxSize
                        anchorRef={anchorRef}
                        onClose={handleAdditionalClose}
                    >
                        {additionalDropdown({
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
