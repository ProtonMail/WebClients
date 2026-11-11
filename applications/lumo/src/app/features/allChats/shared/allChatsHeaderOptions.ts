import { c } from 'ttag';

import type { AllChatsFilterValue, AllChatsSortValue } from '../filterAllChatsConversations';

export const getAllChatsFilterOptions = (): { value: AllChatsFilterValue; label: string }[] => {
    return [
        { value: 'all', label: c('collider_2025:Option').t`All` },
        { value: 'favorites', label: c('collider_2025:Option').t`Favorites` },
        { value: 'projects', label: c('collider_2025:Option').t`From projects` },
    ];
};

export const getAllChatsSortOptions = (): { value: AllChatsSortValue; label: string }[] => {
    return [
        { value: 'newest', label: c('collider_2025:Option').t`Newest first` },
        { value: 'oldest', label: c('collider_2025:Option').t`Oldest first` },
        // translator: Sort chats alphabetically by name.
        { value: 'name', label: c('collider_2025:Option').t`Name (A–Z)` },
    ];
};
