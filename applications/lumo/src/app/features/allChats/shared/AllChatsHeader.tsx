import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { AllChatsFilterValue, AllChatsSortValue } from '../filterAllChatsConversations';
import { AllChatsBulkActionButtons } from './AllChatsBulkActionButtons';
import { AllChatsFilterChips } from './AllChatsFilterChips';
import { AllChatsSortMenu } from './AllChatsSortMenu';

interface TitleProps {
    title: string;
    count: number;
    as?: 'h1' | 'h2';
}

/** Title with the chat count. Also used in the layout header on small screens. */
export const AllChatsTitle = ({ title, count, as: Heading = 'h1' }: TitleProps) => {
    return (
        <div className="flex flex-nowrap items-baseline gap-2 min-w-0">
            <Heading className="text-4xl text-semibold m-0 text-ellipsis">{title}</Heading>
            <span className="text-lg text-semibold color-weak shrink-0">{count}</span>
        </div>
    );
};

interface Props {
    title: string;
    titleAs?: 'h1' | 'h2';
    /** False when the title is shown elsewhere, like the layout header on small screens. */
    showTitle: boolean;
    conversationCount: number;
    searchSlot?: ReactNode;
    isMobileLayout: boolean;

    filter: AllChatsFilterValue;
    onFilterChange: (value: AllChatsFilterValue) => void;
    excludedFilters?: AllChatsFilterValue[];
    sort: AllChatsSortValue;
    onSortChange: (value: AllChatsSortValue) => void;
    showSelectButton: boolean;
    onToggleSelectionMode: () => void;

    isSelectionMode: boolean;
    selectedCount: number;
    allSelected: boolean;
    someSelected: boolean;
    showSelectAll: boolean;
    onToggleSelectAll: () => void;
    onBulkDelete: () => void;
    onBulkFavorite: () => void;
    onBulkMove: (spaceId: string, projectName: string) => void;
    showBulkMove: boolean;
    canBulkMove: boolean;
    onCancelSelection: () => void;
}

export const AllChatsHeader = ({
    title,
    titleAs,
    showTitle,
    conversationCount,
    searchSlot,
    isMobileLayout,
    filter,
    onFilterChange,
    excludedFilters,
    sort,
    onSortChange,
    showSelectButton,
    onToggleSelectionMode,
    isSelectionMode,
    selectedCount,
    allSelected,
    someSelected,
    showSelectAll,
    onToggleSelectAll,
    onBulkDelete,
    onBulkFavorite,
    onBulkMove,
    showBulkMove,
    canBulkMove,
    onCancelSelection,
}: Props) => {
    const showTitleRow = showTitle || !!searchSlot;

    return (
        <div className="all-chats-header flex flex-column flex-nowrap gap-3 md:gap-4 shrink-0 mb-2 md:mb-6">
            {showTitleRow ? (
                <div className="flex flex-column md:flex-row md:flex-nowrap md:items-center gap-3">
                    {showTitle ? (
                        // flex-1 only in the row layout: in the stacked (column) layout a zero flex
                        // basis collapses the title and the chips draw over it.
                        <div className="md:flex-1 min-w-0">
                            <AllChatsTitle title={title} count={conversationCount} as={titleAs} />
                        </div>
                    ) : null}
                    {searchSlot}
                </div>
            ) : null}

            {/* 32px, as in Select mode, so switching doesn't move the list. Only grows if long
                translations make the chips wrap. */}
            <div className="flex flex-nowrap items-center gap-2 min-h-custom" style={{ '--min-h-custom': '2rem' }}>
                {isSelectionMode ? (
                    <>
                        <div className="flex flex-1 flex-nowrap items-center gap-3 min-w-0 pl-3">
                            {showSelectAll ? (
                                <Checkbox
                                    checked={allSelected}
                                    indeterminate={someSelected}
                                    onChange={onToggleSelectAll}
                                    aria-label={
                                        allSelected
                                            ? c('collider_2025:Action').t`Deselect all`
                                            : c('collider_2025:Action').t`Select all`
                                    }
                                />
                            ) : null}
                            <span className="font-medium text-ellipsis">
                                {c('collider_2025:Label').t`${selectedCount} selected`}
                            </span>
                        </div>
                        {/* Small screens put the actions in a bar at the bottom, in thumb reach. */}
                        {isMobileLayout ? null : (
                            <AllChatsBulkActionButtons
                                variant="toolbar"
                                disabled={selectedCount === 0}
                                showMove={showBulkMove}
                                canMove={canBulkMove}
                                onFavorite={onBulkFavorite}
                                onMove={onBulkMove}
                                onDelete={onBulkDelete}
                            />
                        )}
                        <Button
                            shape="outline"
                            color="weak"
                            size="small"
                            className="shrink-0"
                            onClick={onCancelSelection}
                        >
                            {c('collider_2025:Action').t`Done`}
                        </Button>
                    </>
                ) : (
                    <>
                        <AllChatsFilterChips
                            filter={filter}
                            onFilterChange={onFilterChange}
                            excludedFilters={excludedFilters}
                            className="flex-1"
                        />
                        <AllChatsSortMenu sort={sort} onSortChange={onSortChange} iconOnly={isMobileLayout} />
                        {showSelectButton ? (
                            // Icon only on small screens, so the chips fit beside Sort and Select.
                            <Button
                                shape="ghost"
                                size="small"
                                icon={isMobileLayout}
                                className="shrink-0 flex flex-nowrap items-center gap-2 font-medium"
                                aria-label={isMobileLayout ? c('collider_2025:Action').t`Select` : undefined}
                                title={isMobileLayout ? c('collider_2025:Action').t`Select` : undefined}
                                onClick={onToggleSelectionMode}
                            >
                                <LumoIcon name="ListChecks" size={16} className="shrink-0" />
                                {isMobileLayout ? null : c('collider_2025:Action').t`Select`}
                            </Button>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
};
