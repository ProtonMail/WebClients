import { AllChatsHeaderSearch } from './AllChatsHeaderSearch';

import './AllChatsHeaderActions.scss';

interface AllChatsHeaderBarProps {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
}

export const AllChatsHeaderBar = ({ searchQuery, onSearchQueryChange }: AllChatsHeaderBarProps) => {
    return (
        <div className="all-chats-header-bar all-chats-header-bar--desktop flex flex-1 items-center min-w-0 w-full px-4 md:px-10">
            <div className="all-chats-content-column flex items-center min-w-0 w-full">
                <AllChatsHeaderSearch searchQuery={searchQuery} onSearchQueryChange={onSearchQueryChange} />
            </div>
        </div>
    );
};
