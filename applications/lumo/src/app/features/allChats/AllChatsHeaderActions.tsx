import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { ChatHistorySortMenu } from '../../layouts/sidepanel/ChatHistorySortMenu';
import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';
import { AllChatsFilterMenu } from './AllChatsFilterMenu';
import type { AllChatsFilterValue } from './filterAllChatsConversations';

import './AllChatsHeaderActions.scss';

const allChatsSortOptions = [
    { value: 'updatedAt' as const, label: c('collider_2025:Option').t`Recent activity` },
    { value: 'createdAt' as const, label: c('collider_2025:Option').t`Date created` },
];

interface AllChatsHeaderActionsProps {
    hasSelection: boolean;
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

export const AllChatsHeaderActions = ({
    hasSelection,
    sortField,
    onSortFieldChange,
    filter,
    onFilterChange,
    onRequestDeleteAll,
    isDeleteAllDisabled,
    onBulkDelete,
    onBulkFavorite,
    onCancelSelection,
}: AllChatsHeaderActionsProps) => {
    if (hasSelection) {
        return (
            <div className="all-chats-header-actions flex items-center gap-2 flex-nowrap">
                <Button
                    shape="outline"
                    color="danger"
                    size="medium"
                    className="all-chats-header-action-button shrink-0 flex-nowrap items-center gap-1 hidden sm:flex"
                    onClick={onBulkDelete}
                >
                    <LumoIcon name="Trash2" size={14} className="shrink-0" />
                    <span>{c('collider_2025:Action').t`Delete`}</span>
                </Button>
                <Button
                    shape="solid"
                    size="medium"
                    className="all-chats-header-action-button shrink-0 flex flex-nowrap items-center gap-1"
                    onClick={onBulkFavorite}
                >
                    <LumoIcon name="Star" size={14} className="shrink-0" />
                    <span>{c('collider_2025:Action').t`Favorite`}</span>
                </Button>
                <Button
                    shape="solid"
                    color="norm"
                    size="medium"
                    className="all-chats-header-action-button all-chats-header-action-button-primary shrink-0"
                    onClick={onCancelSelection}
                >
                    {c('collider_2025:Action').t`Cancel`}
                </Button>
            </div>
        );
    }

    return (
        <div className="all-chats-header-actions flex items-center gap-2 flex-nowrap">
            <Button
                shape="outline"
                color="danger"
                size="medium"
                className="all-chats-header-action-button shrink-0 flex-nowrap items-center gap-1 hidden sm:flex"
                disabled={isDeleteAllDisabled}
                onClick={onRequestDeleteAll}
            >
                <LumoIcon name="Trash2" size={14} className="shrink-0" />
                <span>{c('collider_2025: Button').t`Delete all`}</span>
            </Button>
            <ChatHistorySortMenu
                sortField={sortField}
                onSortFieldChange={onSortFieldChange}
                options={allChatsSortOptions}
                buttonLabel={c('collider_2025:Title').t`Sort by`}
                buttonClassName="all-chats-header-action-button shrink-0"
                leadingIcon="List"
            />
            <AllChatsFilterMenu filter={filter} onFilterChange={onFilterChange} />
        </div>
    );
};
