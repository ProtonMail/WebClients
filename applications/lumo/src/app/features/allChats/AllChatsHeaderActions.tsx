import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { NewChatButton } from '../../components/Buttons/NewChatButton';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';
import type { AllChatsFilterValue } from './filterAllChatsConversations';
import { AllChatsFilterSortMenu } from './shared/AllChatsFilterSortMenu';

import './AllChatsHeaderActions.scss';

interface AllChatsHeaderActionsProps {
    sortField: ChatHistoryDateField;
    onSortFieldChange: (value: ChatHistoryDateField) => void;
    filter: AllChatsFilterValue;
    onFilterChange: (value: AllChatsFilterValue) => void;
    onRequestDeleteAll: () => void;
    isDeleteAllDisabled: boolean;
    hasSelection: boolean;
}

export const AllChatsHeaderActions = ({
    sortField,
    onSortFieldChange,
    filter,
    onFilterChange,
    onRequestDeleteAll,
    isDeleteAllDisabled,
    hasSelection,
}: AllChatsHeaderActionsProps) => {
    return (
        <div className="all-chats-header-actions flex items-center gap-2 flex-nowrap">
            {!hasSelection ? (
                <Button
                    shape="outline"
                    color="weak"
                    size="medium"
                    className="all-chats-header-action-button shrink-0 flex-nowrap items-center gap-1 hidden sm:flex"
                    disabled={isDeleteAllDisabled}
                    onClick={onRequestDeleteAll}
                >
                    <LumoIcon name="Flame" size={14} className="shrink-0" />
                    <span>{c('collider_2025: Button').t`Delete all`}</span>
                </Button>
            ) : null}
            <AllChatsFilterSortMenu
                filter={filter}
                onFilterChange={onFilterChange}
                sortField={sortField}
                onSortFieldChange={onSortFieldChange}
            />
            <NewChatButton
                buttonProps={{
                    shape: 'solid',
                    size: 'medium',
                    color: 'norm',
                    className: 'shrink-0 flex flex-row flex-nowrap items-center gap-1',
                }}
            >
                <LumoIcon name="Plus" size={14} aria-label={c('collider_2025: Link').t`New chat`} />
                <span>{c('collider_2025: Button').t`New chat`}</span>
            </NewChatButton>
        </div>
    );
};
