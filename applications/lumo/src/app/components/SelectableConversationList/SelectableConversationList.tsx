import { useCallback, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Checkbox, Icon } from '@proton/components';

import type { Conversation, ConversationId } from '../../types';

import './SelectableConversationList.scss';

export interface ConversationGroup {
    title: string;
    conversations: Conversation[];
    headerAction?: React.ReactNode; // Optional action to show next to the title
}

export interface SelectableConversationListProps {
    /** Grouped conversations to display */
    groups: ConversationGroup[];
    /** Callback when a conversation is clicked (navigated to) */
    onConversationClick: (conversationId: ConversationId) => void;
    /** Callback when selected conversations should be deleted */
    onDeleteSelected: (conversationIds: ConversationId[]) => Promise<void>;
    /** Optional: Render custom actions for each conversation */
    renderConversationActions?: (conversation: Conversation) => React.ReactNode;
    /** Optional: Empty state component */
    emptyState?: React.ReactNode;
    /** Optional: Whether to show the date for each conversation */
    showDate?: boolean;
    /** Optional: Class name for the container */
    className?: string;
}

/**
 * Reusable component for displaying a list of conversations with selection capabilities.
 * Can be used in:
 * - Project detail view (for project conversations)
 * - General conversation management (for all conversations)
 */
export const SelectableConversationList = ({
    groups,
    onConversationClick,
    onDeleteSelected,
    renderConversationActions,
    emptyState,
    showDate = true,
    className = '',
}: SelectableConversationListProps) => {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<ConversationId>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    // Get all conversation IDs from all groups
    const allConversationIds = groups.flatMap((group) => group.conversations.map((c) => c.id));
    const totalConversations = allConversationIds.length;
    const selectedCount = selectedIds.size;
    const allSelected = totalConversations > 0 && selectedCount === totalConversations;

    const toggleSelectionMode = useCallback(() => {
        setIsSelectionMode((prev) => !prev);
        setSelectedIds(new Set());
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allConversationIds));
        }
    }, [allSelected, allConversationIds]);

    const toggleSelectConversation = useCallback((conversationId: ConversationId) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(conversationId)) {
                newSet.delete(conversationId);
            } else {
                newSet.add(conversationId);
            }
            return newSet;
        });
    }, []);

    const handleDeleteSelected = useCallback(async () => {
        if (selectedIds.size === 0) return;

        setIsDeleting(true);
        try {
            await onDeleteSelected(Array.from(selectedIds));
            setSelectedIds(new Set());
            setIsSelectionMode(false);
        } finally {
            setIsDeleting(false);
        }
    }, [selectedIds, onDeleteSelected]);

    const handleConversationClick = useCallback(
        (conversationId: ConversationId) => {
            if (isSelectionMode) {
                toggleSelectConversation(conversationId);
            } else {
                onConversationClick(conversationId);
            }
        },
        [isSelectionMode, toggleSelectConversation, onConversationClick]
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
        });
    };

    if (totalConversations === 0 && emptyState) {
        return <>{emptyState}</>;
    }

    return (
        <div className={`selectable-conversation-list flex flex-column flex-nowrap ${className}`}>
            {/* Header row */}
            <div
                className={`selectable-conversation-list-header flex items-center justify-between mb-2 ${isSelectionMode ? 'is-selection-mode' : ''}`}
            >
                <span className="text-md color-weak">
                    {totalConversations}
                    {c('collider_2025:Info').ngettext(msgid` Chat in Project`, ` Chats in Project`, totalConversations)}
                </span>
                <button
                    className="selectable-conversation-select-link text-sm color-weak bg-transparent border-none cursor-pointer hover:underline"
                    onClick={toggleSelectionMode}
                >
                    {isSelectionMode ? c('collider_2025:Action').t`Cancel` : c('collider_2025:Action').t`Manage chats`}
                </button>
            </div>

            {/* Action row - only shown in selection mode */}
            {isSelectionMode && (
                <div className="selectable-conversation-list-actions flex items-center gap-2 mb-3">
                    <Button size="small" shape="ghost" onClick={toggleSelectAll} className="text-sm">
                        {allSelected
                            ? c('collider_2025:Action').t`Deselect all`
                            : c('collider_2025:Action').t`Select all`}
                    </Button>
                    {selectedCount > 0 && (
                        <Button
                            size="small"
                            color="danger"
                            shape="ghost"
                            onClick={handleDeleteSelected}
                            loading={isDeleting}
                            disabled={isDeleting}
                            className="text-sm"
                        >
                            <Icon name="trash" className="mr-1" size={3} />
                            {c('collider_2025:Action').t`Delete`} ({selectedCount})
                        </Button>
                    )}
                </div>
            )}

            {/* Conversation groups */}
            <div className="selectable-conversation-list-content">
                {groups.map(
                    (group) =>
                        group.conversations.length > 0 && (
                            <div key={group.title} className="selectable-conversation-group">
                                <div className="flex items-center mb-2">
                                    <h3 className="selectable-conversation-group-title text-sm color-weak mb-0">
                                        {group.title}
                                    </h3>
                                    {group.headerAction && (
                                        <>
                                            <div className="flex-1"></div>
                                            <div>{group.headerAction}</div>
                                        </>
                                    )}
                                </div>
                                <div className="selectable-conversation-group-items">
                                    {group.conversations.map((conversation) => {
                                        const isSelected = selectedIds.has(conversation.id);
                                        const title =
                                            conversation.title?.trim() || c('collider_2025:Label').t`Untitled chat`;

                                        return (
                                            <div
                                                key={conversation.id}
                                                className={`selectable-conversation-item flex items-center mb-3 p-2 rounded ${
                                                    isSelected ? 'is-selected' : ''
                                                }`}
                                            >
                                                {isSelectionMode && (
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectConversation(conversation.id)}
                                                        className="mr-2"
                                                        aria-label={c('collider_2025:Action').t`Select conversation`}
                                                    />
                                                )}
                                                <button
                                                    className="selectable-conversation-button flex items-center flex-1 text-left"
                                                    onClick={() => handleConversationClick(conversation.id)}
                                                    aria-label={
                                                        isSelectionMode
                                                            ? c('collider_2025:Action').t`Toggle selection`
                                                            : c('collider_2025:Action').t`Open conversation`
                                                    }
                                                >
                                                    <div className="selectable-conversation-content flex flex-column">
                                                        <span className="selectable-conversation-title text-md">
                                                            {title}
                                                        </span>
                                                        {showDate && (
                                                            <span className="selectable-conversation-date text-xs color-weak">
                                                                {formatDate(conversation.createdAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                                {!isSelectionMode && renderConversationActions?.(conversation)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                )}
            </div>
        </div>
    );
};

export default SelectableConversationList;
