import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';

import { useVirtualizer } from '@tanstack/react-virtual';
import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Input } from '@proton/atoms/Input/Input';
import { Checkbox, useModalStateObject, useNotifications } from '@proton/components';

import FavoritesUpsellPrompt from '../../components/Guest/FavoritesUpsellPrompt';
import { ChatHistoryLoadingSkeleton } from '../../components/ChatHistoryLoadingSkeleton';
import { LumoLink } from '../../components/Links/LumoLink';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import ConfirmDeleteModal from '../../components/Modals/ConfirmDeleteModal';
import { ProjectIcon } from '../../components/ProjectIcon/ProjectIcon';
import { useConversationStar } from '../../hooks/useConversationStar';
import { useDriveFolderIndexing } from '../../hooks/useDriveFolderIndexing';
import { useIsChatHistoryHydrating } from '../../hooks/useIsChatHistoryHydrating';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useSearchService } from '../../hooks/useSearchService';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { ConversationDeleteFlow } from '../../layouts/sidepanel/ConversationDeleteFlow';
import { ConversationExpirationIndicator } from '../../layouts/sidepanel/ConversationExpirationIndicator';
import { ConversationSidebarActions } from '../../layouts/sidepanel/ConversationSidebarActions';
import { useConversation } from '../../providers/ConversationProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoDispatch, useLumoMemoSelector, useLumoSelector, useLumoStore } from '../../redux/hooks';
import { selectConversations, selectConversationsHaveGeneratedImages } from '../../redux/selectors';
import {
    changeConversationTitle,
    pushConversationRequest,
    toggleConversationStarred,
} from '../../redux/slices/core/conversations';
import { selectSpaceMap } from '../../redux/slices/core/spaces';
import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';
import type { Conversation, ConversationId } from '../../types';
import { sendConversationDeleteEvent, sendConversationEditTitleEvent } from '../../util/telemetry';
import { AllChatsHeaderBar } from './AllChatsHeaderBar';
import { AllChatsHeaderNewChatButton } from './AllChatsHeaderNewChatButton';
import { deleteConversationsWithSemantics } from './deleteConversationsWithSemantics';
import type { AllChatsEmptyVariant, AllChatsFilterValue } from './filterAllChatsConversations';
import { filterAllChatsConversations, getAllChatsEmptyVariant } from './filterAllChatsConversations';
import { formatChatRelativeDate } from './formatChatRelativeDate';
import { AllChatsMobileBulkActions } from './mobile/AllChatsMobileBulkActions';
import { AllChatsMobileHeaderBar } from './mobile/AllChatsMobileHeaderBar';
import type { AllChatsRowData } from './selectAllChatsRowData';
import { selectAllChatsRowDataMap } from './selectAllChatsRowData';
import { AllChatsBulkActionButtons } from './shared/AllChatsBulkActionButtons';
import { AllChatsFilterSortMenu } from './shared/AllChatsFilterSortMenu';

import './AllChatsView.scss';

const ROW_HEIGHT = 68;

// Stable reference so falling back to it doesn't defeat memo() on ConversationRow.
const EMPTY_ROW_DATA: AllChatsRowData = { isProject: false };

type FilterValue = AllChatsFilterValue;

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

interface AllChatsEmptyStateProps {
    variant: AllChatsEmptyVariant;
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

        if (variant === 'no-projects') {
            return {
                icon: 'FolderOpen' as const,
                heading: c('collider_2025:Title').t`No project chats yet`,
                subline: c('collider_2025:Info').t`Chats from your projects will appear here.`,
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
        <div className="flex flex-column items-center justify-center gap-2 h-full px-6 mx-auto">
            <div className="all-chats-empty-icon flex items-center justify-center rounded-full p-4">
                <LumoIcon name={content.icon} size={24} />
            </div>
            <h2 className="text-lg text-semibold m-0">{content.heading}</h2>
            <p className="text-sm color-weak m-0">{content.subline}</p>
        </div>
    );
};

interface ConversationRowProps {
    conversation: Conversation;
    rowData: AllChatsRowData;
    isActive: boolean;
    isBulkSelected: boolean;
    showBulkSelectCheckbox: boolean;
    onToggleBulkSelect: (conversationId: ConversationId) => void;
    sortField: ChatHistoryDateField;
}

const ConversationRow = memo(
    ({
        conversation,
        rowData,
        isActive,
        isBulkSelected,
        showBulkSelectCheckbox,
        onToggleBulkSelect,
        sortField,
    }: ConversationRowProps) => {
        const dispatch = useLumoDispatch();
        const [isRenaming, setIsRenaming] = useState(false);
        const [draftTitle, setDraftTitle] = useState(conversation.title);
        const [deleteRequested, setDeleteRequested] = useState(false);
        const renameInputRef = useRef<HTMLInputElement>(null);

        const { handleStarToggle, showFavoritesUpsellModal, favoritesUpsellModalProps, isStarred } =
            useConversationStar({
                conversation,
                location: 'sidebar',
            });

        const label = conversation.title.trim() || c('collider_2025:Button').t`Untitled chat`;
        const timestamp = formatChatRelativeDate(conversation[sortField]);
        const { isProject, projectIcon, projectName } = rowData;
        const projectLabel = projectName?.trim() || c('collider_2025:Label').t`Untitled project`;

        const renderProjectLink = (placementClassName: string) => {
            if (!isProject) {
                return null;
            }

            return (
                <ButtonLike
                    as={LumoLink}
                    to={`/projects/${conversation.spaceId}`}
                    shape="ghost"
                    color="weak"
                    size="small"
                    className={clsx('all-chats-row-project-link all-chats-row-interactive min-w-0', placementClassName)}
                    aria-label={c('collider_2025:Action').t`Go to project`}
                    title={projectLabel}
                    onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                        event.stopPropagation();
                    }}
                >
                    <ProjectIcon iconId={projectIcon} size={12} className="shrink-0" />
                    <span className="all-chats-row-project-link-name">{projectLabel}</span>
                </ButtonLike>
            );
        };

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
                className={clsx(
                    'all-chats-row group relative flex items-center gap-3 px-3 min-w-0 overflow-hidden',
                    deleteRequested && 'all-chats-row-actions-pinned',
                    isBulkSelected && 'all-chats-row-bulk-selected'
                )}
                style={{ height: `${ROW_HEIGHT}px` }}
            >
                {!isRenaming && (
                    <LumoLink
                        to={`/c/${conversation.id}`}
                        className="all-chats-row-link absolute inset-0 button button-ghost-weak"
                        aria-current={isActive ? 'page' : undefined}
                    />
                )}

                {showBulkSelectCheckbox ? (
                    <Checkbox
                        checked={isBulkSelected}
                        onChange={() => {
                            onToggleBulkSelect(conversation.id);
                        }}
                        onClick={(event) => {
                            event.stopPropagation();
                        }}
                        className="all-chats-row-select all-chats-row-interactive relative z-1 shrink-0"
                        aria-label={c('collider_2025:Action').t`Select conversation`}
                    />
                ) : null}

                <div className="all-chats-row-body relative z-1 flex-1 min-w-0 pointer-events-none">
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
                        <div className="all-chats-row-title flex items-center gap-3 min-w-0">
                            <div className="all-chats-row-title-content min-w-0">
                                <div className="all-chats-row-title-main flex flex-nowrap items-center gap-2 min-w-0">
                                    <span className="all-chats-row-title-text text-ellipsis overflow-hidden whitespace-nowrap min-w-0">
                                        {label}
                                    </span>
                                    {renderProjectLink('all-chats-row-project-link-desktop')}
                                    <ConversationExpirationIndicator
                                        conversation={conversation}
                                        className="all-chats-row-interactive shrink-0"
                                    />
                                    <Button
                                        icon
                                        shape="ghost"
                                        size="small"
                                        className={clsx(
                                            'all-chats-row-star all-chats-row-interactive shrink-0',
                                            isStarred && 'is-favorited'
                                        )}
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
                                            strokeWidth={isStarred ? 1.3 : 2}
                                        />
                                    </Button>
                                </div>
                                <div className="all-chats-row-date-mobile">
                                    <span className="all-chats-row-date-mobile-time shrink-0">{timestamp}</span>
                                    {renderProjectLink('all-chats-row-project-link-mobile')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {!isRenaming ? (
                    <div className="all-chats-row-meta relative z-2 shrink-0 flex items-center justify-end self-stretch">
                        <span className="all-chats-row-date">{timestamp}</span>
                        <div className="all-chats-row-actions">
                            <div className="all-chats-row-actions-desktop shrink-0">
                                <Button
                                    icon
                                    shape="ghost"
                                    size="small"
                                    className="shrink-0"
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
                                    className="shrink-0"
                                    shape="ghost"
                                    size="small"
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
                            <div className="all-chats-row-actions-mobile shrink-0">
                                <ConversationSidebarActions
                                    conversation={conversation}
                                    onRename={startRenaming}
                                    includeStarOption={false}
                                />
                            </div>
                        </div>
                    </div>
                ) : null}

                {deleteRequested ? (
                    <ConversationDeleteFlow
                        conversation={conversation}
                        navigateAfterDelete={false}
                        onClose={() => {
                            setDeleteRequested(false);
                        }}
                    />
                ) : null}

                {showFavoritesUpsellModal ? <FavoritesUpsellPrompt {...favoritesUpsellModalProps} /> : null}
            </div>
        );
    }
);

ConversationRow.displayName = 'ConversationRow';

interface AllChatsHeaderProps {
    conversationCount: number;
    allSelected: boolean;
    someSelected: boolean;
    showSelectAll: boolean;
    onToggleSelectAll: () => void;
    isMobileLayout?: boolean;
    isSelectionMode?: boolean;
    selectedCount?: number;
    sortField?: ChatHistoryDateField;
    onSortFieldChange?: (value: ChatHistoryDateField) => void;
    filter?: AllChatsFilterValue;
    onFilterChange?: (value: AllChatsFilterValue) => void;
    onBulkDelete?: () => void;
    onBulkFavorite?: () => void;
    onCancelSelection?: () => void;
}

const AllChatsHeader = ({
    conversationCount,
    allSelected,
    someSelected,
    showSelectAll,
    onToggleSelectAll,
    isMobileLayout = false,
    isSelectionMode = false,
    selectedCount = 0,
    sortField,
    onSortFieldChange,
    filter,
    onFilterChange,
    onBulkDelete,
    onBulkFavorite,
    onCancelSelection,
}: AllChatsHeaderProps) => {
    const hasSelection = selectedCount > 0;
    const showSelectionActions = isMobileLayout ? isSelectionMode : hasSelection;
    const showConversationCount = isMobileLayout ? !isSelectionMode : !hasSelection;
    const showFilterSort =
        !isMobileLayout && !hasSelection && filter !== undefined && onFilterChange && sortField && onSortFieldChange;

    return (
        <div
            className={clsx(
                'all-chats-header flex items-center gap-3 mb-4 shrink-0',
                (showSelectionActions || showFilterSort) && 'justify-space-between'
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
                    <h1 className="main-text m-0">{c('collider_2025:Title').t`Chats`}</h1>
                    {hasSelection && !isMobileLayout ? (
                        <span className="all-chats-selected-count tx-lg">{c('collider_2025:Label')
                            .t`${selectedCount} selected`}</span>
                    ) : null}
                    {showConversationCount ? (
                        <span className="all-chats-count text-lg">{conversationCount}</span>
                    ) : null}
                </div>
            </div>
            {showFilterSort ? (
                <AllChatsFilterSortMenu
                    filter={filter}
                    onFilterChange={onFilterChange}
                    sortField={sortField}
                    onSortFieldChange={onSortFieldChange}
                />
            ) : null}
            {showSelectionActions && onBulkDelete && onBulkFavorite ? (
                <div className="all-chats-header-selection-actions flex items-center gap-2 shrink-0 flex-nowrap">
                    <AllChatsBulkActionButtons
                        size="small"
                        disabled={isMobileLayout && !hasSelection}
                        onBulkDelete={onBulkDelete}
                        onBulkFavorite={onBulkFavorite}
                    />
                    {!isMobileLayout && onCancelSelection ? (
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
    );
};

export const AllChatsView = () => {
    const dispatch = useLumoDispatch();
    const store = useLumoStore();
    const getState = useCallback(() => store.getState(), [store]);
    const { createNotification } = useNotifications();
    const conversationsMap = useLumoSelector(selectConversations, shallowEqual);
    const spacesMap = useLumoSelector(selectSpaceMap, shallowEqual);
    const rowDataMap = useLumoSelector(selectAllChatsRowDataMap, shallowEqual);
    const { hasLumoPlus } = useLumoPlan();
    const { conversationId } = useConversation();
    const isGuest = useIsGuest();
    const favoritesUpsellModal = useModalStateObject();
    const confirmDeleteModal = useModalStateObject();
    const { removeIndexedFoldersBySpace } = useDriveFolderIndexing();
    const searchService = useSearchService();
    const { isSmallScreen: isMobileLayout } = useIsLumoSmallScreen();
    const isChatHistoryHydrating = useIsChatHistoryHydrating();

    const [filter, setFilter] = useState<FilterValue>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<ChatHistoryDateField>('updatedAt');
    const [selectedIds, setSelectedIds] = useState<Set<ConversationId>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredConversations = useMemo<Conversation[]>(() => {
        return filterAllChatsConversations({
            conversations: Object.values(conversationsMap),
            filter,
            searchQuery,
            rowDataMap,
            sortField,
            hasLumoPlus,
            getState,
        });
    }, [conversationsMap, sortField, filter, hasLumoPlus, rowDataMap, searchQuery, getState]);

    const filteredConversationIds = useMemo(() => {
        return filteredConversations.map((conversation) => {
            return conversation.id;
        });
    }, [filteredConversations]);

    const selectionValidConversationIds = useMemo(() => {
        return filterAllChatsConversations({
            conversations: Object.values(conversationsMap),
            filter,
            searchQuery: '',
            rowDataMap,
            sortField,
            hasLumoPlus,
            getState,
        }).map((conversation) => {
            return conversation.id;
        });
    }, [conversationsMap, filter, sortField, hasLumoPlus, rowDataMap, getState]);

    useEffect(() => {
        setSelectedIds((previousSelectedIds) => {
            const nextSelectedIds = filterValidSelections(previousSelectedIds, selectionValidConversationIds);

            if (nextSelectedIds.size === previousSelectedIds.size) {
                return previousSelectedIds;
            }

            return nextSelectedIds;
        });
    }, [selectionValidConversationIds]);

    const selectedCount = selectedIds.size;
    const allSelected = filteredConversations.length > 0 && selectedCount === filteredConversations.length;
    const someSelected = selectedCount > 0 && !allSelected;
    const selectedConversationIds = useMemo(() => {
        return Array.from(selectedIds);
    }, [selectedIds]);
    const hasGeneratedImages = useLumoMemoSelector(selectConversationsHaveGeneratedImages, [selectedConversationIds]);

    const toggleSelectAll = useCallback(() => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredConversationIds));
        }
    }, [allSelected, filteredConversationIds]);

    const toggleSelectConversation = useCallback((conversationId: ConversationId) => {
        setSelectedIds((previousSelectedIds) => {
            const nextSelectedIds = new Set(previousSelectedIds);

            if (nextSelectedIds.has(conversationId)) {
                nextSelectedIds.delete(conversationId);
            } else {
                nextSelectedIds.add(conversationId);
            }

            return nextSelectedIds;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const handleSelectionModeChange = useCallback((enabled: boolean) => {
        setIsSelectionMode(enabled);

        if (!enabled) {
            setSelectedIds(new Set());
        }
    }, []);

    const handleCancelSelection = useCallback(() => {
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    }, []);

    const handleFilterChange = useCallback((value: FilterValue) => {
        setFilter(value);
    }, []);

    const handleSearchQueryChange = useCallback((value: string) => {
        setSearchQuery(value);
    }, []);

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

        const conversationIds = Array.from(selectedIds);

        setIsDeleting(true);

        try {
            for (const _conversationId of conversationIds) {
                sendConversationDeleteEvent();
            }

            await deleteConversationsWithSemantics({
                conversationIds,
                conversationsMap,
                spacesMap,
                dispatch,
                removeIndexedFoldersBySpace,
                removeSearchDocumentsBySpace: (spaceId) => {
                    if (searchService) {
                        searchService.removeDocumentsBySpace(spaceId);
                    }
                },
            });

            createNotification({
                text:
                    conversationIds.length > 1
                        ? c('Success').jt`Conversations deleted`
                        : c('Success').jt`Conversation deleted`,
            });
            setSelectedIds(new Set());
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
        removeIndexedFoldersBySpace,
        searchService,
        selectedIds,
        spacesMap,
    ]);

    const layoutHeader = useMemo(() => {
        const sharedHeaderProps = {
            searchQuery,
            onSearchQueryChange: handleSearchQueryChange,
            sortField,
            onSortFieldChange: setSortField,
            filter,
            onFilterChange: handleFilterChange,
        };

        return {
            component: isMobileLayout ? (
                <AllChatsMobileHeaderBar
                    {...sharedHeaderProps}
                    isSelectionMode={isSelectionMode}
                    onSelectionModeChange={handleSelectionModeChange}
                />
            ) : (
                <AllChatsHeaderBar searchQuery={searchQuery} onSearchQueryChange={handleSearchQueryChange} />
            ),
            rightButton: isMobileLayout ? undefined : <AllChatsHeaderNewChatButton />,
        };
    }, [
        filter,
        handleFilterChange,
        handleSearchQueryChange,
        handleSelectionModeChange,
        isMobileLayout,
        isSelectionMode,
        searchQuery,
        sortField,
    ]);

    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: filteredConversations.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 8,
    });

    const virtualItems = virtualizer.getVirtualItems();

    const emptyVariant = getAllChatsEmptyVariant(searchQuery, filter);

    const isEmpty = !isChatHistoryHydrating && filteredConversations.length === 0;

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }} header={layoutHeader}>
            <div className="all-chats-page all-chats-view">
                <div className="all-chats-page-main flex flex-column flex-1 min-h-0 px-4 md:pt-6 md:px-10">
                    <div className="all-chats-content-column flex flex-column flex-1 min-h-0">
                        <AllChatsHeader
                            conversationCount={filteredConversations.length}
                            allSelected={allSelected}
                            someSelected={someSelected}
                            showSelectAll={
                                !isChatHistoryHydrating &&
                                filteredConversations.length > 0 &&
                                (!isMobileLayout || isSelectionMode)
                            }
                            onToggleSelectAll={toggleSelectAll}
                            isMobileLayout={isMobileLayout}
                            isSelectionMode={isSelectionMode}
                            selectedCount={selectedCount}
                            sortField={sortField}
                            onSortFieldChange={setSortField}
                            filter={filter}
                            onFilterChange={handleFilterChange}
                            onBulkDelete={requestBulkDelete}
                            onBulkFavorite={handleBulkFavorite}
                            onCancelSelection={isMobileLayout ? handleCancelSelection : clearSelection}
                        />

                        <div className="all-chats-panel flex flex-column flex-1 min-h-0 overflow-hidden">
                            <div
                                ref={parentRef}
                                className={clsx(
                                    'flex-1 overflow-auto min-h-0 pb-2',
                                    isMobileLayout && isSelectionMode && 'all-chats-list-with-mobile-bulk-actions',
                                    !isMobileLayout && selectedCount > 0 && 'all-chats-has-bulk-selection'
                                )}
                            >
                                {isChatHistoryHydrating ? (
                                    <ChatHistoryLoadingSkeleton
                                        rows={12}
                                        className="flex flex-column gap-2 px-2 pt-4"
                                    />
                                ) : isEmpty ? (
                                    <AllChatsEmptyState variant={emptyVariant} />
                                ) : (
                                    <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
                                        {virtualItems.map((virtualItem) => {
                                            const conversation = filteredConversations[virtualItem.index];
                                            const rowData = rowDataMap[conversation.id] ?? EMPTY_ROW_DATA;

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
                                                        isActive={conversation.id === conversationId}
                                                        isBulkSelected={selectedIds.has(conversation.id)}
                                                        showBulkSelectCheckbox={!isMobileLayout || isSelectionMode}
                                                        onToggleBulkSelect={toggleSelectConversation}
                                                        sortField={sortField}
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
            </div>

            {favoritesUpsellModal.render && <FavoritesUpsellPrompt {...favoritesUpsellModal.modalProps} />}

            {confirmDeleteModal.render && (
                <ConfirmDeleteModal
                    {...confirmDeleteModal.modalProps}
                    handleDelete={handleConfirmBulkDelete}
                    count={selectedCount}
                    hasGeneratedImages={hasGeneratedImages}
                    loading={isDeleting}
                />
            )}

            {isMobileLayout && isSelectionMode ? (
                <AllChatsMobileBulkActions onCancelSelection={handleCancelSelection} />
            ) : null}
        </LumoLayoutWithDrawer>
    );
};
