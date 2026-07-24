import { clsx } from 'clsx';
import { c } from 'ttag';

import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { IconName } from '../../../components/LumoIcon/LumoIcon';
import type { ChatHistoryDateField } from '../../../redux/slices/lumoUserSettings';
import type { AllChatsFilterValue } from '../filterAllChatsConversations';
import { allChatsMenuFilterOptions, allChatsSortOptions } from './allChatsHeaderOptions';

const MenuCheckmark = ({ visible }: { visible: boolean }) => {
    return (
        <span className={clsx('flex items-center shrink-0', !visible && 'visibility-hidden')}>
            <LumoIcon name="Check" size={20} className="color-primary" />
        </span>
    );
};

interface FilterMenuItemProps {
    label: string;
    icon: IconName;
    selected: boolean;
    onSelect: () => void;
}

const FilterMenuItem = ({ label, icon, selected, onSelect }: FilterMenuItemProps) => {
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
                <LumoIcon name={icon} size={20} className="color-weak shrink-0" />
                <span className="font-medium flex-1 text-left">{label}</span>
                <MenuCheckmark visible={selected} />
            </div>
        </DropdownMenuButton>
    );
};

interface SortMenuItemProps {
    label: string;
    selected: boolean;
    onSelect: () => void;
}

const SortMenuItem = ({ label, selected, onSelect }: SortMenuItemProps) => {
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
                <span className="font-medium flex-1 text-left">{label}</span>
                <MenuCheckmark visible={selected} />
            </div>
        </DropdownMenuButton>
    );
};

interface AllChatsFilterSortMenuContentProps {
    filter: AllChatsFilterValue;
    onFilterChange: (value: AllChatsFilterValue) => void;
    sortField: ChatHistoryDateField;
    onSortFieldChange: (value: ChatHistoryDateField) => void;
    onItemSelect?: () => void;
}

export const AllChatsFilterSortMenuContent = ({
    filter,
    onFilterChange,
    sortField,
    onSortFieldChange,
    onItemSelect,
}: AllChatsFilterSortMenuContentProps) => {
    return (
        <>
            <div className="px-4 py-2 color-weak text-semibold">{c('collider_2025:Title').t`Filters`}</div>
            {allChatsMenuFilterOptions.map((option) => {
                return (
                    <FilterMenuItem
                        key={option.value}
                        label={option.label}
                        icon={option.icon}
                        selected={filter === option.value}
                        onSelect={() => {
                            onFilterChange(option.value);
                            onItemSelect?.();
                        }}
                    />
                );
            })}
            <hr className="border-weak mx-2 my-1" />
            <div className="px-4 py-2 color-weak text-semibold">{c('collider_2025:Title').t`Sort by`}</div>
            {allChatsSortOptions.map((option) => {
                return (
                    <SortMenuItem
                        key={option.value}
                        label={option.label}
                        selected={sortField === option.value}
                        onSelect={() => {
                            onSortFieldChange(option.value);
                            onItemSelect?.();
                        }}
                    />
                );
            })}
        </>
    );
};
