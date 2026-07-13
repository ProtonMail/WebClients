import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';

import { useVirtualizer } from '@tanstack/react-virtual';
import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';

import FavoritesUpsellPrompt from '../../components/Guest/FavoritesUpsellPrompt';
import { LumoLink } from '../../components/Links/LumoLink';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useLumoUserSettings } from '../../hooks';
import { useConversationStar } from '../../hooks/useConversationStar';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { ConversationDeleteFlow } from '../../layouts/sidepanel/ConversationDeleteFlow';
import { useConversation } from '../../providers/ConversationProvider';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectConversations } from '../../redux/selectors';
import { changeConversationTitle, pushConversationRequest } from '../../redux/slices/core/conversations';
import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';
import type { Conversation } from '../../types';
import { sendConversationEditTitleEvent } from '../../util/telemetry';
import { formatChatRelativeDate } from './formatChatRelativeDate';
import type { AllChatsRowData } from './selectAllChatsRowData';
import { selectAllChatsRowDataMap } from './selectAllChatsRowData';

import './AllChatsView.scss';

const ROW_HEIGHT = 68;

type FilterValue = 'all' | 'favorites';

interface AllChatsEmptyStateProps {
    variant: 'no-chats' | 'no-favorites' | 'no-results';
}

const AllChatsEmptyState = ({ variant }: AllChatsEmptyStateProps) => {
    const content = (() => {
        if (variant === 'no-favorites') {
            return {
                icon: 'Star' as const,
                heading: c('collider_2025:Title').t`No favorites yet`,
                subline: c('collider_2025:Info').t`Star a chat to find it here quickly.`,
            };
        }

        if (variant === 'no-results') {
            return {
                icon: 'Search' as const,
                heading: c('collider_2025:Title').t`No matching chats`,
                subline: c('collider_2025:Info').t`Try a different search term.`,
            };
        }

        return {
            icon: 'MessageCircle' as const,
            heading: c('collider_2025:Title').t`No chats yet`,
            subline: c('collider_2025:Info').t`Start a new chat to see it here.`,
        };
    })();

    return (
        <div className="all-chats-empty flex flex-column items-center justify-center gap-2 h-full px-6">
            <div className="flex items-center justify-center rounded-full bg-weak p-4">
                <LumoIcon name={content.icon} size={24} className="color-weak" />
            </div>
            <h2 className="text-lg text-semibold m-0">{content.heading}</h2>
            <p className="text-sm color-weak m-0">{content.subline}</p>
        </div>
    );
};

interface AllChatsToolbarProps {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    filter: FilterValue;
    onFilterChange: (value: FilterValue) => void;
    sortField: ChatHistoryDateField;
    onSortFieldChange: (value: ChatHistoryDateField) => void;
}

const AllChatsToolbar = ({
    searchQuery,
    onSearchQueryChange,
    filter,
    onFilterChange,
    sortField,
    onSortFieldChange,
}: AllChatsToolbarProps) => {
    return (
        <div className="all-chats-toolbar flex flex-row flex-nowrap items-center w-full px-4 py-3 shrink-0">
            <Input
                className="all-chats-search flex-1 min-w-0"
                value={searchQuery}
                onValue={onSearchQueryChange}
                placeholder={c('collider_2025:Placeholder').t`Search chats`}
                aria-label={c('collider_2025:Button').t`Search chats`}
                prefix={<LumoIcon name="Search" size={16} className="color-weak" />}
            />
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <div
                className="all-chats-segmented flex shrink-0"
                role="group"
                aria-label={c('collider_2025:Button').t`Filter chats`}
            >
                <Button
                    className={clsx('all-chats-segmented-button', filter === 'all' && 'is-active')}
                    shape="ghost"
                    size="small"
                    aria-pressed={filter === 'all'}
                    onClick={() => {
                        onFilterChange('all');
                    }}
                >
                    {c('collider_2025:Option').t`All`}
                </Button>
                <Button
                    className={clsx('all-chats-segmented-button', filter === 'favorites' && 'is-active')}
                    shape="ghost"
                    size="small"
                    aria-pressed={filter === 'favorites'}
                    onClick={() => {
                        onFilterChange('favorites');
                    }}
                >
                    {c('collider_2025:Option').t`Favorites`}
                </Button>
            </div>

            <select
                className="all-chats-sort-select shrink-0"
                value={sortField}
                aria-label={c('collider_2025:Title').t`Sort by`}
                onChange={(event) => {
                    onSortFieldChange(event.target.value as ChatHistoryDateField);
                }}
            >
                <option value="updatedAt">{c('collider_2025:Option').t`Recent activity`}</option>
                <option value="createdAt">{c('collider_2025:Option').t`Date created`}</option>
            </select>
        </div>
    );
};

interface ConversationRowProps {
    conversation: Conversation;
    rowData: AllChatsRowData;
    isSelected: boolean;
    sortField: ChatHistoryDateField;
}

const ConversationRow = memo(({ conversation, rowData, isSelected, sortField }: ConversationRowProps) => {
    const dispatch = useLumoDispatch();
    const [isRenaming, setIsRenaming] = useState(false);
    const [draftTitle, setDraftTitle] = useState(conversation.title);
    const [deleteRequested, setDeleteRequested] = useState(false);
    const renameInputRef = useRef<HTMLInputElement>(null);

    const { handleStarToggle, showFavoritesUpsellModal, favoritesUpsellModalProps, isStarred } = useConversationStar({
        conversation,
        location: 'sidebar',
    });

    const label = conversation.title.trim() || c('collider_2025:Button').t`Untitled chat`;
    const timestamp = formatChatRelativeDate(conversation[sortField]);
    const { icon, preview } = rowData;

    const startRenaming = useCallback(() => {
        setDraftTitle(conversation.title);
        setIsRenaming(true);
        requestAnimationFrame(() => {
            renameInputRef.current?.focus();
            renameInputRef.current?.select();
        });
    }, [conversation.title]);

    const cancelRenaming = useCallback(() => {
        setDraftTitle(conversation.title);
        setIsRenaming(false);
    }, [conversation.title]);

    const commitRename = useCallback(() => {
        const nextTitle = draftTitle.trim() || c('collider_2025:Button').t`Untitled chat`;

        if (nextTitle !== conversation.title) {
            dispatch(
                changeConversationTitle({
                    id: conversation.id,
                    title: nextTitle,
                    spaceId: conversation.spaceId,
                    persist: true,
                })
            );
            dispatch(pushConversationRequest({ id: conversation.id }));
            sendConversationEditTitleEvent('sidebar');
        }

        setDraftTitle(nextTitle);
        setIsRenaming(false);
    }, [conversation.id, conversation.spaceId, conversation.title, dispatch, draftTitle]);

    const handleRenameKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                commitRename();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                cancelRenaming();
            }
        },
        [cancelRenaming, commitRename]
    );

    return (
        <div
            className="all-chats-row group relative flex items-center gap-3 px-3 min-w-0 overflow-hidden"
            style={{ height: `${ROW_HEIGHT}px` }}
        >
            {!isRenaming && (
                <LumoLink
                    to={`/c/${conversation.id}`}
                    className="all-chats-row-link absolute inset-0"
                    aria-current={isSelected ? 'page' : undefined}
                />
            )}

            <div className="all-chats-row-tile relative z-1 shrink-0 flex items-center justify-center pointer-events-none">
                <LumoIcon name={icon} size={18} />
            </div>

            <div className="relative z-1 flex-1 min-w-0 pointer-events-none">
                {isRenaming ? (
                    <Input
                        ref={renameInputRef}
                        className="all-chats-row-rename-input all-chats-row-interactive"
                        value={draftTitle}
                        onValue={setDraftTitle}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={commitRename}
                        aria-label={c('collider_2025:Action').t`Rename chat`}
                    />
                ) : (
                    <>
                        <div className="all-chats-row-title text-ellipsis overflow-hidden whitespace-nowrap">
                            {label}
                        </div>
                        {preview ? (
                            <div className="all-chats-row-preview text-ellipsis overflow-hidden whitespace-nowrap">
                                {preview}
                            </div>
                        ) : null}
                    </>
                )}
            </div>

            <div className="relative z-1 flex items-center gap-1 shrink-0 pointer-events-none">
                <div
                    className={clsx(
                        'all-chats-row-actions flex items-center gap-0.5',
                        (isRenaming || deleteRequested) && 'is-visible'
                    )}
                >
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        className="all-chats-row-interactive"
                        aria-label={c('collider_2025:Action').t`Rename chat`}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            startRenaming();
                        }}
                    >
                        <LumoIcon name="Pencil" size={15} />
                    </Button>
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        className="all-chats-row-interactive"
                        aria-label={c('collider_2025:Action').t`Delete chat`}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setDeleteRequested(true);
                        }}
                    >
                        <LumoIcon name="Trash2" size={15} />
                    </Button>
                </div>

                <Button
                    icon
                    shape="ghost"
                    size="small"
                    className={clsx('all-chats-row-star all-chats-row-interactive', isStarred && 'is-favorited')}
                    aria-label={
                        isStarred
                            ? c('collider_2025:Action').t`Remove from favorites`
                            : c('collider_2025:Action').t`Add to favorites`
                    }
                    aria-pressed={!!isStarred}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleStarToggle();
                    }}
                >
                    <LumoIcon
                        name="Star"
                        size={16}
                        fill={isStarred ? 'currentColor' : 'none'}
                        strokeWidth={isStarred ? 0 : 2}
                    />
                </Button>

                <span className="all-chats-row-date">{timestamp}</span>
            </div>

            {deleteRequested ? (
                <ConversationDeleteFlow
                    conversation={conversation}
                    onClose={() => {
                        setDeleteRequested(false);
                    }}
                />
            ) : null}

            {showFavoritesUpsellModal ? <FavoritesUpsellPrompt {...favoritesUpsellModalProps} /> : null}
        </div>
    );
});

ConversationRow.displayName = 'ConversationRow';

export const AllChatsView = () => {
    const conversationsMap = useLumoSelector(selectConversations, shallowEqual);
    const rowDataMap = useLumoSelector(selectAllChatsRowDataMap, shallowEqual);
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const chatHistoryDateField = lumoUserSettings.chatHistoryDateField ?? 'updatedAt';
    const { conversationId } = useConversation();

    const [filter, setFilter] = useState<FilterValue>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const allConversations = useMemo(() => {
        return Object.values(conversationsMap).filter((conversation) => {
            return !conversation.ghost;
        });
    }, [conversationsMap]);

    const filteredConversations = useMemo<Conversation[]>(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        let items = allConversations;

        if (filter === 'favorites') {
            items = items.filter((conversation) => {
                return conversation.starred === true;
            });
        }

        if (normalizedQuery) {
            items = items.filter((conversation) => {
                const title = (conversation.title || '').toLowerCase();
                const preview = (rowDataMap[conversation.id]?.preview || '').toLowerCase();
                return title.includes(normalizedQuery) || preview.includes(normalizedQuery);
            });
        }

        return [...items].sort((left, right) => {
            return new Date(right[chatHistoryDateField]).getTime() - new Date(left[chatHistoryDateField]).getTime();
        });
    }, [allConversations, chatHistoryDateField, filter, rowDataMap, searchQuery]);

    const handleSortFieldChange = useCallback(
        (nextSortField: ChatHistoryDateField) => {
            updateSettings({
                chatHistoryDateField: nextSortField,
                _autoSave: true,
            });
        },
        [updateSettings]
    );

    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: filteredConversations.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 8,
    });

    const virtualItems = virtualizer.getVirtualItems();

    const emptyVariant = (() => {
        if (searchQuery.trim()) {
            return 'no-results' as const;
        }
        if (filter === 'favorites') {
            return 'no-favorites' as const;
        }
        return 'no-chats' as const;
    })();

    const isEmpty = filteredConversations.length === 0;

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }}>
            <div className="all-chats-view flex flex-column flex-nowrap flex-1 px-4 md:px-10 min-h-0 py-4">
                <div
                    className="flex flex-column flex-1 w-full mx-auto min-h-0 max-w-custom"
                    style={{ '--max-w-custom': '900px' } as React.CSSProperties}
                >
                    <div className="flex items-baseline gap-2 mb-4 shrink-0">
                        <h1 className="main-text m-0">{c('collider_2025:Title').t`Chats`}</h1>
                        <span className="all-chats-count">{filteredConversations.length}</span>
                    </div>

                    <div className="all-chats-panel flex flex-column flex-1 min-h-0 overflow-hidden">
                        <AllChatsToolbar
                            searchQuery={searchQuery}
                            onSearchQueryChange={setSearchQuery}
                            filter={filter}
                            onFilterChange={setFilter}
                            sortField={chatHistoryDateField}
                            onSortFieldChange={handleSortFieldChange}
                        />

                        <div ref={parentRef} className="flex-1 overflow-auto min-h-0 px-2 pb-2">
                            {isEmpty ? (
                                <AllChatsEmptyState variant={emptyVariant} />
                            ) : (
                                <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
                                    {virtualItems.map((virtualItem) => {
                                        const conversation = filteredConversations[virtualItem.index];
                                        const rowData = rowDataMap[conversation.id] ?? {
                                            preview: '',
                                            hasImages: false,
                                            icon: 'MessageCircle' as const,
                                            isProject: false,
                                        };

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
                                                    rowData={rowData}
                                                    isSelected={conversation.id === conversationId}
                                                    sortField={chatHistoryDateField}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </LumoLayoutWithDrawer>
    );
};
