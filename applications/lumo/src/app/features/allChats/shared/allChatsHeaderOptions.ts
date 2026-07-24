import { c } from 'ttag';

import type { IconName } from '../../../components/LumoIcon/LumoIcon';
import type { ChatHistoryDateField } from '../../../redux/slices/lumoUserSettings';
import type { AllChatsFilterValue } from '../filterAllChatsConversations';

export const allChatsMenuFilterOptions: {
    value: AllChatsFilterValue;
    label: string;
    icon: IconName;
}[] = [
    { value: 'all', label: c('collider_2025:Option').t`All`, icon: 'List' },
    { value: 'projects', label: c('collider_2025:Option').t`From projects`, icon: 'FolderOpen' },
    { value: 'favorites', label: c('collider_2025:Option').t`Favorited`, icon: 'Star' },
];

export const allChatsSortOptions: { value: ChatHistoryDateField; label: string }[] = [
    { value: 'updatedAt', label: c('collider_2025:Option').t`Last updated` },
    { value: 'createdAt', label: c('collider_2025:Option').t`Date created` },
];
