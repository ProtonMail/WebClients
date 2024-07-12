import type { FC, PropsWithChildren } from 'react';

import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    usePopperAnchor,
} from '@proton/components/components';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

type DropdownMenuBaseProps = PropsWithChildren & {
    className?: string;
    dropdownMenuButtonClassname?: string;
    dropdownOptions: {
        label: string;
        value: string;
        onClick?: (...args: string[]) => void;
    }[];
    hasCaret?: boolean;
    onClick?: (...args: string[]) => void;
};

export const DropdownMenuBase: FC<DropdownMenuBaseProps> = ({
    children,
    dropdownOptions,
    className,
    dropdownMenuButtonClassname,
    hasCaret,
    onClick = noop,
}) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                className={clsx('rounded-full', className)}
                style={{ backgroundColor: 'var(--interaction-weak)' }}
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret={hasCaret}
                color="norm"
                shape="ghost"
            >
                {children}
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="top">
                <DropdownMenu>
                    {dropdownOptions.map((option) => {
                        const handleClick = option?.onClick ?? onClick;

                        return (
                            <DropdownMenuButton
                                key={option.value}
                                className={clsx('text-left', dropdownMenuButtonClassname)}
                                onClick={() => handleClick(option.value, option.label)}
                            >
                                {option.label}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
