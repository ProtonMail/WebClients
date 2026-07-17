import { useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';

import { MenuDropdown } from '../../components/Composer/components/MenuDropdown';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import type { AllChatsFilterValue } from './filterAllChatsConversations';

const FilterMenuCheckmark = ({ visible }: { visible: boolean }) => {
    return (
        <span className={clsx('flex items-center shrink-0', !visible && 'visibility-hidden')}>
            <LumoIcon name="Check" size={16} className="color-primary" />
        </span>
    );
};

interface FilterMenuItemProps {
    label: string;
    selected: boolean;
    onSelect: () => void;
}

const FilterMenuItem = ({ label, selected, onSelect }: FilterMenuItemProps) => {
    return (
        <DropdownMenuButton
            className="justify-start"
            onMouseDown={(event) => {
                event.preventDefault();
            }}
            onClick={(event) => {
                event.stopPropagation();
                onSelect();
            }}
        >
            <div className="flex items-center gap-3 w-full">
                <span className="text-sm font-medium flex-1 text-left">{label}</span>
                <FilterMenuCheckmark visible={selected} />
            </div>
        </DropdownMenuButton>
    );
};

interface AllChatsFilterMenuProps {
    filter: AllChatsFilterValue;
    onFilterChange: (value: AllChatsFilterValue) => void;
}

const filterOptions: { value: AllChatsFilterValue; label: string }[] = [
    { value: 'all', label: c('collider_2025:Option').t`All` },
    { value: 'projects', label: c('collider_2025:Option').t`From projects` },
    { value: 'favorites', label: c('collider_2025:Option').t`Favorited` },
];

export const AllChatsFilterMenu = ({ filter, onFilterChange }: AllChatsFilterMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);

    return (
        <>
            <Button
                ref={anchorRef}
                shape="solid"
                size="medium"
                className={clsx(
                    'all-chats-header-action-button shrink-0 flex flex-nowrap items-center gap-1',
                    filter !== 'all' && 'is-active'
                )}
                aria-label={c('collider_2025:Button').t`Filter chats`}
                aria-expanded={isOpen}
                onMouseDown={(event) => {
                    event.preventDefault();
                }}
                onClick={() => {
                    setIsOpen((open) => {
                        return !open;
                    });
                }}
            >
                <LumoIcon name="Funnel" size={14} className="shrink-0" />
                <span>{c('collider_2025:Button').t`Filter`}</span>
                <LumoIcon name="ChevronDown" width={12} height={12} className="color-weak shrink-0" />
            </Button>

            <MenuDropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={() => {
                    setIsOpen(false);
                }}
                placement="bottom-end"
            >
                <div className="px-4 py-2 text-sm color-weak text-semibold">{c('collider_2025:Button')
                    .t`Filter chats`}</div>
                {filterOptions.map((option) => {
                    return (
                        <FilterMenuItem
                            key={option.value}
                            label={option.label}
                            selected={filter === option.value}
                            onSelect={() => {
                                onFilterChange(option.value);
                                setIsOpen(false);
                            }}
                        />
                    );
                })}
            </MenuDropdown>
        </>
    );
};
