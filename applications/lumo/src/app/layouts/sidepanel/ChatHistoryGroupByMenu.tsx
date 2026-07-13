import { clsx } from 'clsx';
import { c } from 'ttag';

import { useLumoUserSettings } from '../../hooks';
import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';
import { ChatHistorySortMenu } from './ChatHistorySortMenu';

import './ChatHistoryGroupByMenu.scss';

const getSortedByLabel = (dateField: ChatHistoryDateField): string => {
    if (dateField === 'updatedAt') {
        return c('collider_2025: Info').t`Sorted by update time`;
    }

    return c('collider_2025: Info').t`Sorted by creation time`;
};

const sortOptions = [
    { value: 'updatedAt' as const, label: c('collider_2025:Option').t`Last updated` },
    { value: 'createdAt' as const, label: c('collider_2025:Option').t`Date created` },
];

interface ChatHistoryGroupByMenuProps {
    /** When true, shows the active sort field as text instead of an icon-only button. */
    showSortedByLabel?: boolean;
}

export const ChatHistoryGroupByMenu = ({ showSortedByLabel = false }: ChatHistoryGroupByMenuProps) => {
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();

    const dateField = lumoUserSettings.chatHistoryDateField ?? 'updatedAt';

    const setDateField = (nextDateField: ChatHistoryDateField) => {
        updateSettings({ chatHistoryDateField: nextDateField, _autoSave: true });
    };

    return (
        <ChatHistorySortMenu
            sortField={dateField}
            onSortFieldChange={setDateField}
            options={sortOptions}
            buttonLabel={getSortedByLabel(dateField)}
            buttonVariant={showSortedByLabel ? 'labeled' : 'icon'}
            buttonClassName={clsx(
                'chat-history-group-by-menu-button shrink-0',
                showSortedByLabel && 'chat-history-group-by-menu-button--labeled'
            )}
            dropdownClassName="chat-history-group-by-menu"
            stopPropagation
        />
    );
};
