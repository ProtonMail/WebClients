import type { FC, PropsWithChildren } from 'react';

import { Dropdown, DropdownButton, DropdownMenu, DropdownMenuButton, usePopperAnchor } from '@proton/components';
import clsx from '@proton/utils/clsx';

type DropdownMenuBaseProps = PropsWithChildren & {
    className?: string;
    dropdownMenuButtonClassname?: string;
    dropdownOptions: {
        label: string;
        value: string;
        onClick: () => void;
    }[];
    hasCaret?: boolean;
};

export const DropdownMenuBase: FC<DropdownMenuBaseProps> = ({
    children,
    dropdownOptions,
    className,
    dropdownMenuButtonClassname,
    hasCaret,
}) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                className={clsx('rounded-full', className)}
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret={hasCaret}
                color="weak"
                shape="solid"
                pill
            >
                {children}
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="top">
                <DropdownMenu>
                    {dropdownOptions.map((option, index) => (
                        <DropdownMenuButton
                            key={`${option.value}${index}`}
                            className={clsx('text-left', dropdownMenuButtonClassname)}
                            onClick={option.onClick}
                        >
                            {option.label}
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
