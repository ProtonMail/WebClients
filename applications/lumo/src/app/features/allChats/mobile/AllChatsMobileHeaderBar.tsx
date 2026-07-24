import { clsx } from 'clsx';

import type { ChatHistoryDateField } from '../../../redux/slices/lumoUserSettings';
import { AllChatsHeaderSearch } from '../AllChatsHeaderSearch';
import type { AllChatsFilterValue } from '../filterAllChatsConversations';
import { AllChatsFilterSortMenu } from '../shared/AllChatsFilterSortMenu';
import { AllChatsMobileOptionsMenu } from './AllChatsMobileOptionsMenu';

import '../AllChatsHeaderActions.scss';

interface AllChatsMobileHeaderBarProps {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    isSearchOpen: boolean;
    onSearchOpenChange: (isOpen: boolean) => void;
    sortField: ChatHistoryDateField;
    onSortFieldChange: (value: ChatHistoryDateField) => void;
    filter: AllChatsFilterValue;
    onFilterChange: (value: AllChatsFilterValue) => void;
    isSelectionMode: boolean;
    onSelectionModeChange: (enabled: boolean) => void;
    onRequestDeleteAll: () => void;
    isDeleteAllDisabled: boolean;
}

export const AllChatsMobileHeaderBar = ({
    searchQuery,
    onSearchQueryChange,
    isSearchOpen,
    onSearchOpenChange,
    sortField,
    onSortFieldChange,
    filter,
    onFilterChange,
    isSelectionMode,
    onSelectionModeChange,
    onRequestDeleteAll,
    isDeleteAllDisabled,
}: AllChatsMobileHeaderBarProps) => {
    return (
        <div className="all-chats-mobile-header-bar all-chats-header-bar flex flex-1 items-center gap-2 min-w-0 w-full">
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
            <div className="all-chats-mobile-header-bar-actions flex items-center gap-2 shrink-0">
                <AllChatsMobileOptionsMenu
                    isSelectionMode={isSelectionMode}
                    onSelectionModeChange={onSelectionModeChange}
                    onRequestDeleteAll={onRequestDeleteAll}
                    isDeleteAllDisabled={isDeleteAllDisabled}
                />
                <AllChatsFilterSortMenu
                    filter={filter}
                    onFilterChange={onFilterChange}
                    sortField={sortField}
                    onSortFieldChange={onSortFieldChange}
                    forIcon={true}
                />
            </div>
        </div>
    );
};
