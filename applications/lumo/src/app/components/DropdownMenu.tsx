import { useRef } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DropdownMenuButton, Icon, SimpleDropdown } from '@proton/components';
import type { IconName } from '@proton/icons/types';

import { useSidebar } from '../providers/SidebarProvider';

import './DropdownMenu.scss';

export type DropdownOptions = {
    label: string;
    value?: string;
    icon: IconName;
    onClick: (e?: React.MouseEvent) => void | Promise<void> | ((option: string) => void) | (() => Promise<void>);
};
interface Props {
    options: DropdownOptions[];
    onToggle: () => void;
    isOpen: boolean;
}

const DropdownMenu = ({ options, onToggle, isOpen }: Props) => {
    const ref = useRef<HTMLButtonElement>(null);
    const { isSmallScreen } = useSidebar();

    return (
        <div
            className={clsx(
                'relative shrink-0 flex',
                !isSmallScreen && 'group-hover:opacity-100',
                !isSmallScreen && !isOpen && 'group-hover:opacity-100-no-width'
            )}
        >
            <SimpleDropdown
                as={Button}
                className="rounded-sm"
                icon
                hasCaret={false}
                shape="ghost"
                size="small"
                content={<Icon name="three-dots-horizontal" alt={c('collider_2025:Title').t`More options`} />}
                onToggle={onToggle}
                dropdownClassName="chat-dropdown-menu"
            >
                {options.map((option, index) => {
                    return (
                        <DropdownMenuButton
                            onClick={(e) => option.onClick(e)}
                            key={index}
                            className="flex flex-row flex-nowrap items-center gap-2 w-full"
                            ref={ref}
                        >
                            <Icon name={option.icon} />
                            <span>{option.label}</span>
                        </DropdownMenuButton>
                    );
                })}
            </SimpleDropdown>
        </div>
    );
};

export default DropdownMenu;
