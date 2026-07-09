import { memo, useMemo, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';

import { useVirtualizer } from '@tanstack/react-virtual';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';

import { MenuDropdown } from '../../components/Composer/components/MenuDropdown';
import { LumoLink } from '../../components/Links/LumoLink';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useLumoUserSettings } from '../../hooks';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { ChatHistoryGroupByMenu } from '../../layouts/sidepanel/ChatHistoryGroupByMenu';
import ConversationActionsDropdown from '../../layouts/sidepanel/ConversationActionsDropdown';
import { sortConversationsByField } from '../../layouts/sidepanel/helpers';
import { useConversation } from '../../providers/ConversationProvider';
import { useSearchModal } from '../../providers/SearchModalProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectHistoryConversationsSorted, selectStarredConversationsSorted } from '../../redux/selectors';
import type { Conversation } from '../../types';

import './AllChatsView.scss';

const ROW_HEIGHT = 56;

type FilterValue = 'all' | 'favorites';

const formatTimestamp = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
    });
};

interface ConversationRowProps {
    conversation: Conversation;
    isSelected: boolean;
    dateField: 'updatedAt' | 'createdAt';
}

const ConversationRow = memo(({ conversation, isSelected, dateField }: ConversationRowProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isActionsMounted, setIsActionsMounted] = useState(false);
    const [isActionsOpen, setIsActionsOpen] = useState(false);
    const ellipsisRef = useRef<HTMLButtonElement>(null);

    const label = conversation.title.trim() || c('collider_2025:Button').t`Untitled chat`;
    const timestamp = formatTimestamp(conversation[dateField]);

    return (
        <div
            className="lumo-chat-list-item relative flex items-center min-w-0 overflow-hidden rounded-lg transition-colors"
            style={{ height: `${ROW_HEIGHT}px` }}
        >
            <LumoLink
                to={`/c/${conversation.id}`}
                className="absolute inset-0"
                aria-current={isSelected ? 'page' : undefined}
            />
            <div className="relative z-1 flex items-center gap-3 px-4 w-full pointer-events-none">
                <span className="flex-1 text-ellipsis overflow-hidden min-w-0">{label}</span>
                {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
                <div
                    className="relative shrink-0 flex items-center pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span
                        className={`lumo-chat-list-item-timestamp text-sm color-weak${isDropdownOpen ? ' is-hidden' : ''}`}
                    >
                        {timestamp}
                    </span>
                    <div
                        className={`lumo-chat-list-item-ellipsis absolute inset-0 flex items-center justify-center${isDropdownOpen ? ' is-open' : ''}`}
                    >
                        <Button
                            ref={ellipsisRef}
                            icon
                            shape="ghost"
                            size="small"
                            aria-label={c('collider_2025:Action').t`More options`}
                            onMouseEnter={() => setIsActionsMounted(true)}
                            onClick={() => {
                                setIsActionsOpen(true);
                                setIsDropdownOpen(true);
                            }}
                        >
                            <LumoIcon name="Ellipsis" size={16} />
                        </Button>
                    </div>
                </div>
            </div>
            {isActionsMounted && (
                <ConversationActionsDropdown
                    conversation={conversation}
                    anchorRef={ellipsisRef}
                    isOpen={isActionsOpen}
                    onClose={() => {
                        setIsActionsOpen(false);
                        setIsDropdownOpen(false);
                    }}
                />
            )}
        </div>
    );
});

ConversationRow.displayName = 'ConversationRow';

interface FilterDropdownProps {
    filter: FilterValue;
    onFilterChange: (value: FilterValue) => void;
}

const FilterDropdown = ({ filter, onFilterChange }: FilterDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);

    return (
        <>
            <Button
                ref={anchorRef}
                shape="ghost"
                size="small"
                aria-label={c('collider_2025:Button').t`Filter chats`}
                onClick={() => setIsOpen((open) => !open)}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <span className="flex items-center gap-1 text-semibold">
                    <span>
                        {filter === 'favorites'
                            ? c('collider_2025:Option').t`Favorites`
                            : c('collider_2025:Option').t`All`}
                    </span>
                    <LumoIcon name="ChevronDown" width={12} height={12} className="color-weak shrink-0" />
                </span>
            </Button>

            <MenuDropdown isOpen={isOpen} anchorRef={anchorRef} onClose={() => setIsOpen(false)} placement="bottom-end">
                <DropdownMenuButton
                    className="justify-start"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                        onFilterChange('all');
                        setIsOpen(false);
                    }}
                >
                    <div className="flex items-center gap-3 w-full">
                        <span className="text-sm font-medium flex-1 text-left">{c('collider_2025:Option').t`All`}</span>
                        <span className={`flex items-center shrink-0 ${filter !== 'all' ? 'visibility-hidden' : ''}`}>
                            <LumoIcon name="Check" size={16} className="color-primary" />
                        </span>
                    </div>
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="justify-start"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                        onFilterChange('favorites');
                        setIsOpen(false);
                    }}
                >
                    <div className="flex items-center gap-3 w-full">
                        <span className="text-sm font-medium flex-1 text-left">{c('collider_2025:Option')
                            .t`Favorites`}</span>
                        <span
                            className={`flex items-center shrink-0 ${filter !== 'favorites' ? 'visibility-hidden' : ''}`}
                        >
                            <LumoIcon name="Check" size={16} className="color-primary" />
                        </span>
                    </div>
                </DropdownMenuButton>
            </MenuDropdown>
        </>
    );
};

export const AllChatsView = () => {
    const favorites = useLumoSelector(selectStarredConversationsSorted, shallowEqual);
    const history = useLumoSelector(selectHistoryConversationsSorted, shallowEqual);
    const { lumoUserSettings } = useLumoUserSettings();
    const chatHistoryDateField = lumoUserSettings.chatHistoryDateField ?? 'updatedAt';
    const { conversationId } = useConversation();
    const { openSearchModal } = useSearchModal();

    const [filter, setFilter] = useState<FilterValue>('all');

    const dateColumnLabel =
        chatHistoryDateField === 'createdAt'
            ? c('collider_2025:Label').t`Created`
            : c('collider_2025:Label').t`Updated`;

    const combined = useMemo(
        () => sortConversationsByField([...favorites, ...history], chatHistoryDateField),
        [favorites, history, chatHistoryDateField]
    );

    const filteredConversations = useMemo<Conversation[]>(() => {
        if (filter === 'favorites') {
            return combined.filter((c) => c.starred === true);
        }
        return combined;
    }, [combined, filter]);

    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: filteredConversations.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 5,
    });

    const virtualItems = virtualizer.getVirtualItems();

    const isEmpty = filteredConversations.length === 0;

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }}>
            <div className="flex flex-column flex-nowrap flex-1 px-4 md:px-10 min-h-0">
                {/* Page header */}
                <div
                    className="flex flex-row flex-nowrap items-center justify-space-between w-full my-4 mx-auto max-w-custom"
                    style={{ '--max-w-custom': '900px' } as React.CSSProperties}
                >
                    <h1 className="main-text">{c('collider_2025:Title').t`Chats`}</h1>
                    <div className="flex items-center gap-1 shrink-0">
                        <FilterDropdown filter={filter} onFilterChange={setFilter} />
                        <ChatHistoryGroupByMenu showSortedByLabel={true} />
                        <Button
                            icon
                            shape="ghost"
                            size="small"
                            aria-label={c('collider_2025:Button').t`Search chats`}
                            onClick={openSearchModal}
                        >
                            <LumoIcon name="Search" size={16} />
                        </Button>
                    </div>
                </div>

                {/* Content area */}
                <div
                    className="flex flex-column flex-1 w-full mx-auto min-h-0 max-w-custom"
                    style={{ '--max-w-custom': '900px' } as React.CSSProperties}
                >
                    {/* Column header */}
                    <div className="flex items-center justify-space-between px-2 py-1 border-bottom border-weak shrink-0">
                        <span className="color-hint font-semibold uppercase">{c('collider_2025:Label').t`Title`}</span>
                        <span className="color-hint font-semibold uppercase">{dateColumnLabel}</span>
                    </div>

                    {/* Virtual list */}
                    <div ref={parentRef} className="flex-1 overflow-auto min-h-0">
                        {isEmpty ? (
                            <div className="flex items-center justify-center h-full color-weak text-sm">
                                {filter === 'favorites'
                                    ? c('collider_2025:Info').t`No favorites yet. Star a chat to find it here quickly.`
                                    : c('collider_2025:Info').t`No chats yet.`}
                            </div>
                        ) : (
                            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
                                {virtualItems.map((virtualItem) => {
                                    const conversation = filteredConversations[virtualItem.index];
                                    return (
                                        <div
                                            key={conversation.id}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                height: `${virtualItem.size}px`,
                                                transform: `translateY(${virtualItem.start}px)`,
                                            }}
                                        >
                                            <ConversationRow
                                                conversation={conversation}
                                                isSelected={conversation.id === conversationId}
                                                dateField={chatHistoryDateField}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </LumoLayoutWithDrawer>
    );
};
