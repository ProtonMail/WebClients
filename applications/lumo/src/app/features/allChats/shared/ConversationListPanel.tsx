import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';

import { useVirtualizer } from '@tanstack/react-virtual';
import { clsx } from 'clsx';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import { ChatHistoryLoadingSkeleton } from '../../../components/ChatHistoryLoadingSkeleton';
import FavoritesUpsellPrompt from '../../../components/Guest/FavoritesUpsellPrompt';
import ConfirmDeleteModal from '../../../components/Modals/ConfirmDeleteModal';
import { useDriveFolderIndexing } from '../../../hooks/useDriveFolderIndexing';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useMoveConversationsToProject } from '../../../hooks/useMoveConversationsToProject';
import { useSearchService } from '../../../hooks/useSearchService';
import { useConversation } from '../../../providers/ConversationProvider';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectConversations } from '../../../redux/selectors';
import { pushConversationRequest, toggleConversationStarred } from '../../../redux/slices/core/conversations';
import { selectSpaceMap } from '../../../redux/slices/core/spaces';
import type { Conversation, ConversationId } from '../../../types';
import { sendConversationDeleteEvent } from '../../../util/telemetry';
import { deleteConversationsWithSemantics } from '../deleteConversationsWithSemantics';
import type { AllChatsFilterValue, AllChatsSortValue } from '../filterAllChatsConversations';
import type { AllChatsRowData } from '../selectAllChatsRowData';
import { selectAllChatsRowDataMap } from '../selectAllChatsRowData';
import { AllChatsBulkActionButtons } from './AllChatsBulkActionButtons';
import { AllChatsHeader } from './AllChatsHeader';
import { CONVERSATION_ROW_HEIGHT, CONVERSATION_ROW_HEIGHT_COMPACT, ConversationRow } from './ConversationRow';

import './ConversationListPanel.scss';

// Stable reference so falling back to it doesn't defeat memo() on ConversationRow.
const EMPTY_ROW_DATA: AllChatsRowData = { isProject: false };

const filterValidSelections = (
    selectedIds: Set<ConversationId>,
    validConversationIds: ConversationId[]
): Set<ConversationId> => {
    const validIds = new Set(validConversationIds);
    const next = new Set<ConversationId>();

    for (const id of selectedIds) {
        if (validIds.has(id)) {
            next.add(id);
        }
    }

    return next;
};

interface ConversationListPanelProps {
    title: string;
    titleAs?: 'h1' | 'h2';
    /** False when the page shows the title elsewhere, like the layout header on small screens. */
    showTitle?: boolean;
    /** Search field shown beside the title (below it on small screens). */
    searchSlot?: React.ReactNode;
    /** Conversations to display, already filtered and sorted. */
    conversations: Conversation[];
    /** Conversations that may stay selected; defaults to `conversations`. Lets a search narrow the list without dropping the selection. */
    selectableConversationIds?: ConversationId[];
    filter: AllChatsFilterValue;
    onFilterChange: (value: AllChatsFilterValue) => void;
    excludedFilters?: AllChatsFilterValue[];
    sort: AllChatsSortValue;
    onSortChange: (value: AllChatsSortValue) => void;
    isSelectionMode: boolean;
    onSelectionModeChange: (enabled: boolean) => void;
    isMobileLayout: boolean;
    isLoading: boolean;
    emptyState: React.ReactNode;
    showProjectLink?: boolean;
    /** Offer "Move to project" for chats that already live in a project (off in the All chats list). */
    allowMovingProjectChats?: boolean;
    className?: string;
}

export const ConversationListPanel = ({
    title,
    titleAs,
    showTitle = true,
    searchSlot,
    conversations,
    selectableConversationIds,
    filter,
    onFilterChange,
    excludedFilters,
    sort,
    onSortChange,
    isSelectionMode,
    onSelectionModeChange,
    isMobileLayout,
    isLoading,
    emptyState,
    showProjectLink = true,
    allowMovingProjectChats = false,
    className,
}: ConversationListPanelProps) => {
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const conversationsMap = useLumoSelector(selectConversations, shallowEqual);
    const spacesMap = useLumoSelector(selectSpaceMap, shallowEqual);
    const rowDataMap = useLumoSelector(selectAllChatsRowDataMap, shallowEqual);
    const { conversationId } = useConversation();
    const isGuest = useIsGuest();
    const { moveToProject: isMoveToProjectEnabled } = useLumoFlags();
    const { moveToProject } = useMoveConversationsToProject();
    const favoritesUpsellModal = useModalStateObject();
    const confirmDeleteModal = useModalStateObject();
    const { removeIndexedFoldersBySpace } = useDriveFolderIndexing();
    const searchService = useSearchService();

    const [selectedIds, setSelectedIds] = useState<Set<ConversationId>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    const conversationIds = useMemo(() => {
        return conversations.map((conversation) => {
            return conversation.id;
        });
    }, [conversations]);

    const validSelectionIds = selectableConversationIds ?? conversationIds;

    useEffect(() => {
        setSelectedIds((previousSelectedIds) => {
            const nextSelectedIds = filterValidSelections(previousSelectedIds, validSelectionIds);

            if (nextSelectedIds.size === previousSelectedIds.size) {
                return previousSelectedIds;
            }

            return nextSelectedIds;
        });
    }, [validSelectionIds]);

    useEffect(() => {
        if (!isSelectionMode) {
            setSelectedIds(new Set());
        }
    }, [isSelectionMode]);

    const selectedCount = selectedIds.size;
    const allSelected = conversations.length > 0 && selectedCount === conversations.length;
    const someSelected = selectedCount > 0 && !allSelected;
    const toggleSelectAll = useCallback(() => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(conversationIds));
        }
    }, [allSelected, conversationIds]);

    const toggleSelectConversation = useCallback((id: ConversationId) => {
        setSelectedIds((previousSelectedIds) => {
            const nextSelectedIds = new Set(previousSelectedIds);

            if (nextSelectedIds.has(id)) {
                nextSelectedIds.delete(id);
            } else {
                nextSelectedIds.add(id);
            }

            return nextSelectedIds;
        });
    }, []);

    const handleCancelSelection = useCallback(() => {
        onSelectionModeChange(false);
    }, [onSelectionModeChange]);

    const toggleSelectionMode = useCallback(() => {
        onSelectionModeChange(!isSelectionMode);
    }, [isSelectionMode, onSelectionModeChange]);

    const handleBulkFavorite = useCallback(() => {
        if (isGuest) {
            favoritesUpsellModal.openModal(true);
            return;
        }

        for (const id of selectedIds) {
            const conversation = conversationsMap[id];

            if (conversation && !conversation.starred) {
                dispatch(toggleConversationStarred(id));
                dispatch(pushConversationRequest({ id }));
            }
        }
    }, [conversationsMap, dispatch, favoritesUpsellModal, isGuest, selectedIds]);

    // Same rule as the ⋯ menu: lists that hide Move for project chats (All chats) skip them here too.
    const movableIds = useMemo(() => {
        return Array.from(selectedIds).filter((id) => {
            const conversation = conversationsMap[id];
            if (!conversation || conversation.ghost || conversation.scheduleRun) {
                return false;
            }
            return allowMovingProjectChats || !rowDataMap[id]?.isProject;
        });
    }, [allowMovingProjectChats, conversationsMap, rowDataMap, selectedIds]);

    const handleBulkMove = useCallback(
        (spaceId: string, projectName: string) => {
            const ids = movableIds.filter((id) => {
                return conversationsMap[id]?.spaceId !== spaceId;
            });
            // The moves run in the background with their own messages, so the list goes back to browsing.
            onSelectionModeChange(false);
            void moveToProject(ids, spaceId, projectName);
        },
        [conversationsMap, moveToProject, movableIds, onSelectionModeChange]
    );
    const showBulkMove = isMoveToProjectEnabled && !isGuest;

    const requestBulkDelete = useCallback(() => {
        if (selectedIds.size === 0) {
            return;
        }

        confirmDeleteModal.openModal(true);
    }, [confirmDeleteModal, selectedIds]);

    const handleConfirmBulkDelete = useCallback(async () => {
        if (selectedIds.size === 0) {
            return;
        }

        const idsToDelete = Array.from(selectedIds);

        setIsDeleting(true);

        try {
            for (const _id of idsToDelete) {
                sendConversationDeleteEvent();
            }

            await deleteConversationsWithSemantics({
                conversationIds: idsToDelete,
                conversationsMap,
                spacesMap,
                dispatch,
                removeIndexedFoldersBySpace,
                removeSearchDocumentsBySpace: (spaceId) => {
                    if (searchService) {
                        void searchService.removeDocumentsBySpace(spaceId);
                    }
                },
            });

            createNotification({
                text:
                    idsToDelete.length > 1
                        ? c('Success').jt`Conversations deleted`
                        : c('Success').jt`Conversation deleted`,
            });
            onSelectionModeChange(false);
            confirmDeleteModal.openModal(false);
        } catch (error) {
            createNotification({ text: <>{error}</>, type: 'error' });
        } finally {
            setIsDeleting(false);
        }
    }, [
        confirmDeleteModal,
        conversationsMap,
        createNotification,
        dispatch,
        onSelectionModeChange,
        removeIndexedFoldersBySpace,
        searchService,
        selectedIds,
        spacesMap,
    ]);

    const parentRef = useRef<HTMLDivElement>(null);

    const rowHeight = isMobileLayout ? CONVERSATION_ROW_HEIGHT_COMPACT : CONVERSATION_ROW_HEIGHT;

    const virtualizer = useVirtualizer({
        count: conversations.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 8,
    });

    // Rows change height when the layout crosses the small-screen breakpoint.
    useEffect(() => {
        virtualizer.measure();
    }, [rowHeight, virtualizer]);

    const virtualItems = virtualizer.getVirtualItems();
    const isEmpty = !isLoading && conversations.length === 0;

    return (
        <div className={clsx('conversation-list-panel flex flex-column flex-1 min-h-0', className)}>
            <AllChatsHeader
                title={title}
                titleAs={titleAs}
                showTitle={showTitle}
                conversationCount={conversations.length}
                searchSlot={searchSlot}
                isMobileLayout={isMobileLayout}
                filter={filter}
                onFilterChange={onFilterChange}
                excludedFilters={excludedFilters}
                sort={sort}
                onSortChange={onSortChange}
                showSelectButton={!isLoading && !isEmpty}
                onToggleSelectionMode={toggleSelectionMode}
                isSelectionMode={isSelectionMode}
                selectedCount={selectedCount}
                allSelected={allSelected}
                someSelected={someSelected}
                showSelectAll={!isLoading && conversations.length > 0}
                onToggleSelectAll={toggleSelectAll}
                onBulkDelete={requestBulkDelete}
                onBulkMove={handleBulkMove}
                showBulkMove={showBulkMove}
                canBulkMove={movableIds.length > 0}
                onBulkFavorite={handleBulkFavorite}
                onCancelSelection={handleCancelSelection}
            />

            <div className="all-chats-panel flex flex-column flex-1 min-h-0 overflow-hidden">
                {/* Leaves room for the bottom bar in Select mode on small screens. */}
                <div
                    ref={parentRef}
                    className={clsx(
                        'flex-1 overflow-auto min-h-0',
                        isMobileLayout && isSelectionMode ? 'pb-20' : 'pb-2'
                    )}
                >
                    {isLoading ? (
                        <ChatHistoryLoadingSkeleton rows={12} className="flex flex-column gap-2 px-2 pt-4" />
                    ) : isEmpty ? (
                        emptyState
                    ) : (
                        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
                            {virtualItems.map((virtualItem) => {
                                const conversation = conversations[virtualItem.index];

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
                                            rowData={rowDataMap[conversation.id] ?? EMPTY_ROW_DATA}
                                            isActive={conversation.id === conversationId}
                                            isBulkSelected={selectedIds.has(conversation.id)}
                                            isSelectionMode={isSelectionMode}
                                            onToggleBulkSelect={toggleSelectConversation}
                                            showProjectLink={showProjectLink}
                                            allowMovingProjectChats={allowMovingProjectChats}
                                            isCompact={isMobileLayout}
                                            isLast={virtualItem.index === conversations.length - 1}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {isMobileLayout && isSelectionMode ? (
                <div className="all-chats-bulk-bar fixed bottom-0 left-0 right-0 z-50 flex flex-nowrap gap-2 px-4 pt-2 bg-norm">
                    <AllChatsBulkActionButtons
                        variant="bar"
                        disabled={selectedCount === 0}
                        showMove={showBulkMove}
                        canMove={movableIds.length > 0}
                        onFavorite={handleBulkFavorite}
                        onMove={handleBulkMove}
                        onDelete={requestBulkDelete}
                    />
                </div>
            ) : null}

            {favoritesUpsellModal.render && <FavoritesUpsellPrompt {...favoritesUpsellModal.modalProps} />}

            {confirmDeleteModal.render && (
                <ConfirmDeleteModal
                    {...confirmDeleteModal.modalProps}
                    handleDelete={handleConfirmBulkDelete}
                    count={selectedCount}
                    loading={isDeleting}
                />
            )}
        </div>
    );
};
