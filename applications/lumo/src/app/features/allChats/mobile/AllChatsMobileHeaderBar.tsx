import type { ChatHistoryDateField } from '../../../redux/slices/lumoUserSettings';
import { AllChatsHeaderSearch } from '../AllChatsHeaderSearch';
import type { AllChatsFilterValue } from '../filterAllChatsConversations';
import { AllChatsFilterSortMenu } from '../shared/AllChatsFilterSortMenu';
import { AllChatsMobileOptionsMenu } from './AllChatsMobileOptionsMenu';

import '../AllChatsHeaderActions.scss';

interface AllChatsMobileHeaderBarProps {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    sortField: ChatHistoryDateField;
    onSortFieldChange: (value: ChatHistoryDateField) => void;
    filter: AllChatsFilterValue;
    onFilterChange: (value: AllChatsFilterValue) => void;
    isSelectionMode: boolean;
    onSelectionModeChange: (enabled: boolean) => void;
}

export const AllChatsMobileHeaderBar = ({
    searchQuery,
    onSearchQueryChange,
    sortField,
    onSortFieldChange,
    filter,
    onFilterChange,
    isSelectionMode,
    onSelectionModeChange,
}: AllChatsMobileHeaderBarProps) => {
    return (
        <div className="all-chats-mobile-header-bar all-chats-header-bar flex flex-1 items-center min-w-0 w-full md:px-10">
            <div
                className="all-chats-header-bar-inner flex flex-1 items-center gap-2 mx-auto w-full max-w-custom min-w-0"
                style={{ '--max-w-custom': '900px' }}
            >
                <div className="all-chats-header-search-slot flex-1 min-w-0">
                    <AllChatsHeaderSearch searchQuery={searchQuery} onSearchQueryChange={onSearchQueryChange} />
                </div>
                <div className="all-chats-mobile-header-bar-actions flex items-center gap-2 shrink-0">
                    <AllChatsMobileOptionsMenu
                        isSelectionMode={isSelectionMode}
                        onSelectionModeChange={onSelectionModeChange}
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
        </div>
    );
};
