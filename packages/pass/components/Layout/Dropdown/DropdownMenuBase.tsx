import type { FC, PropsWithChildren } from 'react';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

import { DropdownMenuButton } from './DropdownMenuButton';

export const DROPDOWN_SEPARATOR = '__SEPARATOR__' as const;
export type DropdownMenuOption =
    | { label: string; value: string; icon?: IconName; onClick: () => void }
    | typeof DROPDOWN_SEPARATOR;

type DropdownMenuBaseProps = PropsWithChildren & {
    className?: string;
    dropdownMenuButtonClassname?: string;
    dropdownOptions: DropdownMenuOption[];
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
                    {dropdownOptions.map((option, index) =>
                        option === DROPDOWN_SEPARATOR ? (
                            <hr key={`sep-${index}`} className="my-0" />
                        ) : (
                            <DropdownMenuButton
                                key={`${option.value}${index}`}
                                className={clsx('text-left', dropdownMenuButtonClassname)}
                                onClick={option.onClick}
                                label={option.label}
                                icon={option.icon}
                                size="small"
                            />
                        )
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
