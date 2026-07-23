import { clsx } from 'clsx';

import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';
import { AllChatsHeaderActions } from './AllChatsHeaderActions';
import { AllChatsHeaderSearch } from './AllChatsHeaderSearch';
import type { AllChatsFilterValue } from './filterAllChatsConversations';

import './AllChatsHeaderActions.scss';

interface AllChatsHeaderBarProps {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    isSearchOpen: boolean;
    onSearchOpenChange: (isOpen: boolean) => void;
    sortField: ChatHistoryDateField;
    onSortFieldChange: (value: ChatHistoryDateField) => void;
    filter: AllChatsFilterValue;
    onFilterChange: (value: AllChatsFilterValue) => void;
    onRequestDeleteAll: () => void;
    isDeleteAllDisabled: boolean;
    hasSelection: boolean;
}

export const AllChatsHeaderBar = ({
    searchQuery,
    onSearchQueryChange,
    isSearchOpen,
    onSearchOpenChange,
    sortField,
    onSortFieldChange,
    filter,
    onFilterChange,
    onRequestDeleteAll,
    isDeleteAllDisabled,
    hasSelection,
}: AllChatsHeaderBarProps) => {
    return (
        <div className="all-chats-header-bar flex flex-1 items-center gap-2 min-w-0 flex-nowrap">
            <div
                className={clsx(
                    'all-chats-header-search-slot shrink-0',
                    isSearchOpen && 'all-chats-header-search-slot-is-open'
                )}
            >
                <AllChatsHeaderSearch
                    searchQuery={searchQuery}
                    onSearchQueryChange={onSearchQueryChange}
                    isOpen={isSearchOpen}
                    onOpenChange={onSearchOpenChange}
                />
            </div>
            <AllChatsHeaderActions
                sortField={sortField}
                onSortFieldChange={onSortFieldChange}
                filter={filter}
                onFilterChange={onFilterChange}
                onRequestDeleteAll={onRequestDeleteAll}
                isDeleteAllDisabled={isDeleteAllDisabled}
                hasSelection={hasSelection}
            />
        </div>
    );
};
