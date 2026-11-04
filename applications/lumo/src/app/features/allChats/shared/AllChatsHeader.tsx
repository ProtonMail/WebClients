import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';

import type { ChatHistoryDateField } from '../../../redux/slices/lumoUserSettings';
import type { AllChatsFilterValue } from '../filterAllChatsConversations';
import { AllChatsBulkActionButtons } from './AllChatsBulkActionButtons';
import { AllChatsFilterSortMenu } from './AllChatsFilterSortMenu';

import '../AllChatsHeaderActions.scss';

interface AllChatsHeaderProps {
    title: string;
    titleAs?: 'h1' | 'h2';
    conversationCount: number;
    allSelected: boolean;
    someSelected: boolean;
    showSelectAll: boolean;
    onToggleSelectAll: () => void;
    isMobileLayout: boolean;
    isSelectionMode: boolean;
    selectedCount: number;
    showFilterSort: boolean;
    sortField: ChatHistoryDateField;
    onSortFieldChange: (value: ChatHistoryDateField) => void;
    filter: AllChatsFilterValue;
    onFilterChange: (value: AllChatsFilterValue) => void;
    excludedFilters?: AllChatsFilterValue[];
    onBulkDelete: () => void;
    onBulkFavorite: () => void;
    onCancelSelection: () => void;
    showManageButton: boolean;
    onToggleSelectionMode: () => void;
}

export const AllChatsHeader = ({
    title,
    titleAs: Heading = 'h1',
    conversationCount,
    allSelected,
    someSelected,
    showSelectAll,
    onToggleSelectAll,
    isMobileLayout,
    isSelectionMode,
    selectedCount,
    showFilterSort,
    sortField,
    onSortFieldChange,
    filter,
    onFilterChange,
    excludedFilters,
    onBulkDelete,
    onBulkFavorite,
    onCancelSelection,
    showManageButton,
    onToggleSelectionMode,
}: AllChatsHeaderProps) => {
    const hasSelection = selectedCount > 0;

    return (
        <div
            className={clsx(
                'all-chats-header flex items-center gap-3 mb-4 shrink-0',
                (isSelectionMode || showFilterSort || showManageButton) && 'justify-space-between'
            )}
        >
            <div className="flex items-center gap-3 min-w-0 ml-2 md:ml-3">
                {showSelectAll ? (
                    <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={onToggleSelectAll}
                        className="ml-1 md:ml-0"
                        aria-label={
                            allSelected
                                ? c('collider_2025:Action').t`Deselect all`
                                : c('collider_2025:Action').t`Select all`
                        }
                    />
                ) : null}
                <div className="flex items-baseline gap-2 min-w-0">
                    <Heading className="main-text m-0">{title}</Heading>
                    {isSelectionMode && !isMobileLayout ? (
                        <span className="all-chats-selected-count tx-lg">{c('collider_2025:Label')
                            .t`${selectedCount} selected`}</span>
                    ) : null}
                    {!isSelectionMode ? <span className="all-chats-count text-lg">{conversationCount}</span> : null}
                </div>
            </div>
            <div className="all-chats-header-right-actions flex items-center gap-2 shrink-0 flex-nowrap">
                {showFilterSort ? (
                    <AllChatsFilterSortMenu
                        filter={filter}
                        onFilterChange={onFilterChange}
                        sortField={sortField}
                        onSortFieldChange={onSortFieldChange}
                        excludedFilters={excludedFilters}
                    />
                ) : null}
                {showManageButton ? (
                    <Button
                        shape="ghost"
                        size="small"
                        className="all-chats-header-action-button shrink-0 text-sm"
                        onClick={onToggleSelectionMode}
                    >
                        {c('collider_2025:Action').t`Manage chats`}
                    </Button>
                ) : null}
                {isSelectionMode ? (
                    <div className="all-chats-header-selection-actions flex items-center gap-2 shrink-0 flex-nowrap">
                        <AllChatsBulkActionButtons
                            size="small"
                            disabled={!hasSelection}
                            onBulkDelete={onBulkDelete}
                            onBulkFavorite={onBulkFavorite}
                        />
                        {!isMobileLayout ? (
                            <Button
                                shape="solid"
                                color="norm"
                                size="small"
                                className="all-chats-header-action-button shrink-0"
                                onClick={onCancelSelection}
                            >
                                {c('collider_2025:Action').t`Cancel`}
                            </Button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
};
