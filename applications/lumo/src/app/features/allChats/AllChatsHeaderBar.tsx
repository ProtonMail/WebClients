import { clsx } from 'clsx';

import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';
import { AllChatsHeaderActions } from './AllChatsHeaderActions';
import { AllChatsHeaderSearch } from './AllChatsHeaderSearch';
import type { AllChatsFilterValue } from './filterAllChatsConversations';

import './AllChatsHeaderActions.scss';

interface AllChatsHeaderBarProps {
    hasSelection: boolean;
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
    onBulkDelete: () => void;
    onBulkFavorite: () => void;
    onCancelSelection: () => void;
}

export const AllChatsHeaderBar = ({
    hasSelection,
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
    onBulkDelete,
    onBulkFavorite,
    onCancelSelection,
}: AllChatsHeaderBarProps) => {
    const showHeaderSearch = !hasSelection;

    return (
        <div className="all-chats-header-bar flex flex-1 items-center gap-2 min-w-0">
            {showHeaderSearch ? (
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
            ) : null}
            <AllChatsHeaderActions
                hasSelection={hasSelection}
                sortField={sortField}
                onSortFieldChange={onSortFieldChange}
                filter={filter}
                onFilterChange={onFilterChange}
                onRequestDeleteAll={onRequestDeleteAll}
                isDeleteAllDisabled={isDeleteAllDisabled}
                onBulkDelete={onBulkDelete}
                onBulkFavorite={onBulkFavorite}
                onCancelSelection={onCancelSelection}
            />
        </div>
    );
};
