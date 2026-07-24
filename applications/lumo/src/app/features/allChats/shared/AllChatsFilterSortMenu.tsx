import { useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { MenuDropdown } from '../../../components/Composer/components/MenuDropdown';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { ChatHistoryDateField } from '../../../redux/slices/lumoUserSettings';
import type { AllChatsFilterValue } from '../filterAllChatsConversations';
import { AllChatsFilterSortMenuContent } from './AllChatsFilterSortMenuContent';

import '../AllChatsHeaderActions.scss';

interface AllChatsFilterSortMenuProps {
    filter: AllChatsFilterValue;
    onFilterChange: (value: AllChatsFilterValue) => void;
    sortField: ChatHistoryDateField;
    onSortFieldChange: (value: ChatHistoryDateField) => void;
    className?: string;
    forIcon?: boolean;
}

export const AllChatsFilterSortMenu = ({
    filter,
    onFilterChange,
    sortField,
    onSortFieldChange,
    className,
    forIcon = false,
}: AllChatsFilterSortMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);
    const buttonLabel = c('collider_2025:Button').t`Filter & Sort`;

    return (
        <>
            <Button
                ref={anchorRef}
                shape="outline"
                size="medium"
                className={clsx(
                    'all-chats-header-action-button all-chats-filter-sort-menu-button shrink-0 flex flex-nowrap items-center gap-1',
                    filter !== 'all' && 'is-active',
                    forIcon && 'button-for-icon',
                    className
                )}
                aria-label={buttonLabel}
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
                <span className="all-chats-filter-sort-menu-button-label">{buttonLabel}</span>
            </Button>

            <MenuDropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={() => {
                    setIsOpen(false);
                }}
                placement="bottom-end"
            >
                <AllChatsFilterSortMenuContent
                    filter={filter}
                    onFilterChange={onFilterChange}
                    sortField={sortField}
                    onSortFieldChange={onSortFieldChange}
                    onItemSelect={() => {
                        setIsOpen(false);
                    }}
                />
            </MenuDropdown>
        </>
    );
};
