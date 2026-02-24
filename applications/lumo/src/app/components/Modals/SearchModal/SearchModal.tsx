import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Icon } from '@proton/components/index';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import { useLumoSelector } from '../../../redux/hooks';
import { SearchService } from '../../../services/search/searchService';
import type { SearchResult } from '../../../services/search/types';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useLumoPlan } from '../../../hooks/useLumoPlan';
import type { Attachment } from '../../../types';
import { FileContentModal } from '../../Files';
import {getProjectCategory} from "../../../features/projects/constants";

import './SearchModal.scss';

interface SearchResultItemProps {
    result: SearchResult;
    query: string;
    onSelect: (conversationId?: string, messageId?: string, documentId?: string, projectId?: string) => void;
}

const SearchResultItem = ({ result, query, onSelect }: SearchResultItemProps) => {
    const handleClick = () => {
        if (result.type === 'document') {
            onSelect(undefined, undefined, result.documentId);
        } else if (result.type === 'message') {
            onSelect(result.conversationId, result.messageId);
        } else if (result.type === 'project') {
            onSelect(undefined, undefined, undefined, result.projectId);
        } else {
            onSelect(result.conversationId);
        }
    };

    const formatDate = (timestamp: number, query: string) => {
        // If there's a search query, show relative time
        if (query.trim()) {
            const date = new Date(timestamp);
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            const day = date.getDate();
            return `${month} ${day}`;
        }

        // Otherwise show relative time for recent, absolute for older
        const now = Date.now();
        const age = now - timestamp;
        const oneDay = 86400000;
        const oneWeek = oneDay * 7;

        if (age < oneDay) {
            const hours = Math.floor(age / (1000 * 60 * 60));
            if (hours < 1) {
                const minutes = Math.floor(age / (1000 * 60));
                return minutes <= 1 ? c('Time').t`Just now` : c('Time').t`${minutes} minutes ago`;
            }
            return hours === 1 ? c('Time').t`1 hour ago` : c('Time').t`${hours} hours ago`;
        } else if (age < oneWeek) {
            const days = Math.floor(age / oneDay);
            return days === 1 ? c('Time').t`Yesterday` : c('Time').t`${days} days ago`;
        } else {
            const date = new Date(timestamp);
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            const day = date.getDate();
            return `${month} ${day}`;
        }
    };

    const getProjectCategoryInfo = (categoryId?: string) => {
        if (!categoryId) return null;
        return getProjectCategory(categoryId);
    };

    const projectCategory = (result.type === 'conversation' || result.type === 'message') && result.projectIcon
        ? getProjectCategoryInfo(result.projectIcon)
        : null;
    const ProjectIcon = projectCategory ? (
        <Icon name={projectCategory.icon as any} size={3} className="mr-1" />
    ) : null;

    // Highlight search terms in text
    const highlightText = (text: string, searchQuery: string) => {
        if (!searchQuery.trim() || !text) return text;

        const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, index) => {
            if (regex.test(part)) {
                return (
                    <mark key={index} className="search-highlight">
                        {part}
                    </mark>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    // Render different UI based on result type
    if (result.type === 'document') {
        return (
            <button
                className="search-result-item search-result-item-document"
                onClick={handleClick}
                title={c('Action').t`Open file preview`}
            >
                <div className="search-result-content">
                    <div className="search-result-title">
                        {highlightText(result.documentName || '', query)}
                    </div>
                    {result.matchContext && (
                        <div className="search-result-preview search-result-context">
                            {highlightText(result.matchContext, query)}
                        </div>
                    )}
                    {result.documentPreview && (
                        <div className="search-result-preview search-result-folder-path">
                            <Icon name="folder" size={3} className="mr-1" color="var(--text-norm)" />
                            {result.documentPreview}
                        </div>
                    )}
                </div>
                <div className="search-result-meta">
                    <Icon name="brand-proton-drive-filled" size={3} className="color-weak mr-1" />
                    <span className="search-result-date">{formatDate(result.timestamp, query)}</span>
                </div>
            </button>
        );
    }

    if (result.type === 'project') {
        const projectCategory = result.projectIcon ? getProjectCategoryInfo(result.projectIcon) : null;
        const projectIconName = projectCategory ? projectCategory.icon : 'folder';

        return (
            <button
                className="search-result-item search-result-item-project"
                onClick={handleClick}
                title={c('Action').t`Open project`}
            >
                <div className="search-result-icon">
                    <Icon name={projectIconName as any} size={4} className={"color-norm"} />
                </div>
                <div className="search-result-content">
                    <div className="search-result-title">
                        {highlightText(result.projectName || '', query)}
                    </div>
                    {result.projectDescription && (
                        <div className="search-result-preview">
                            {highlightText(result.projectDescription, query)}
                        </div>
                    )}
                </div>
                <div className="search-result-date">
                    {formatDate(result.timestamp, query)}
                </div>
            </button>
        );
    }

    return (
        <button
            className="search-result-item"
            onClick={handleClick}
            title={c('Action').t`Open conversation`}
        >

            <div className="search-result-content">
                {result.projectName && (
                    <div className="search-result-preview search-result-folder-path">
                        {ProjectIcon}
                        {result.projectName}
                    </div>
                )}
                <div className="search-result-title">
                    {highlightText(result.conversationTitle || '', query)}
                </div>
                {result.type === 'message' && result.messagePreview && (
                    <div className="search-result-preview">
                        {highlightText(result.messagePreview, query)}
                    </div>
                )}
            </div>
            <div className="search-result-date">
                {formatDate(result.timestamp, query)}
            </div>
        </button>
    );
};

interface SearchModalInnerProps {
    onClose: () => void;
}

const SearchModalInner = ({ onClose }: SearchModalInnerProps) => {
    const history = useHistory();
    const [user] = useUser();
    const { hasLumoPlus } = useLumoPlan();
    // Select only the slices needed for search; memoize to keep stable references
    const conversations = useLumoSelector((state) => state.conversations);
    const messages = useLumoSelector((state) => state.messages);
    const spaces = useLumoSelector((state) => state.spaces);
    const searchState = React.useMemo(
        () => ({ conversations, messages, spaces }),
        [conversations, messages, spaces]
    );
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [documentPreview, setDocumentPreview] = useState<Attachment | null>(null);
    const [isLoadingPreview] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout>();
    // Guard against double-invocation in React 18 StrictMode (dev) to prevent duplicate loads
    const hasLoadedOnceRef = useRef(false);

    // Check if debug mode is enabled (only show file results in debug mode)
    const isDebugMode = localStorage.getItem('lumo_debug_perf') === 'true';

    // Load all conversations on mount and when query is cleared
    const loadAllConversations = useCallback(async () => {
        setIsSearching(true);
        setError(null);

        try {
            const searchService = SearchService.get(user?.ID);
            const allConversations = await searchService.getAllConversations(searchState, {
                hasLumoPlus,
            });
            setResults(allConversations);
        } catch (err) {
            console.error('[SearchModal] Failed to load conversations:', err);
            setError(err instanceof Error ? err.message : 'Failed to load conversations');
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [searchState, user?.ID, hasLumoPlus]);

    // Load conversations on mount
    useEffect(() => {
        if (hasLoadedOnceRef.current) return;
        hasLoadedOnceRef.current = true;
        loadAllConversations();
        // loadAllConversations depends on memoized searchState slices; only reruns when they change
    }, [loadAllConversations]);

    // Focus search input on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Perform search with debouncing
    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            // When query is cleared, show all conversations again
            await loadAllConversations();
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            const searchService = SearchService.get(user?.ID);
            const searchResults = await searchService.searchAsync(searchQuery, searchState, {
                hasLumoPlus,
            });
            setResults(searchResults);
        } catch (err) {
            console.error('[SearchModal] Search failed:', err);
            setError(err instanceof Error ? err.message : 'Search failed');
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [searchState, loadAllConversations, user?.ID, hasLumoPlus]);

    // Handle search input changes with debouncing
    const handleSearchChange = (value: string) => {
        setQuery(value);

        // Clear existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce search
        searchTimeoutRef.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    };

    // Handle result selection
    const handleSelectResult = useCallback(async (conversationId?: string, messageId?: string, documentId?: string, projectId?: string) => {
        if (projectId) {
            // Navigate to project
            history.push(`/projects/${projectId}`);
            onClose();
        } else if (conversationId) {
            // Navigate to conversation
            const searchParams = new URLSearchParams();
            if (messageId) {
                searchParams.set('messageId', messageId);
            }
            const queryString = searchParams.toString();
            history.push(`/c/${conversationId}${queryString ? `?${queryString}` : ''}`);

            onClose();
        }
    }, [history, onClose]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
        // TODO: Add arrow key navigation through results
    };

    // Group results by time period with better labels
    const groupedResults = React.useMemo(() => {
        if (results.length === 0) return {};

        // First separate by type
        const conversations = results.filter(r => r.type === 'conversation' || r.type === 'message');
        const projects = results.filter(r => r.type === 'project');
        const documents = results.filter(r => r.type === 'document');

        const groups: Record<string, SearchResult[]> = {};

        // Add projects group if there are any
        if (projects.length > 0) {
            groups.Projects = projects.sort((a, b) => b.timestamp - a.timestamp);
        }

        // Add document group if there are any (only in debug mode)
        if (documents.length > 0 && isDebugMode) {
            groups['Files in Drive'] = documents.sort((a, b) => b.timestamp - a.timestamp);
        }

        // Group conversations by time with better labels
        if (conversations.length > 0) {
            const now = Date.now();
            const oneDay = 86400000;
            const twoDays = oneDay * 2;
            const oneWeek = oneDay * 7;
            const oneYear = oneDay * 365;

            conversations.forEach(result => {
                const age = now - result.timestamp;
                let group = 'Older';

                if (age < oneDay) group = 'Today';
                else if (age < twoDays) group = 'Yesterday';
                else if (age < oneWeek) group = 'Last 7 Days';
                else if (age < oneYear) group = 'This Year';

                if (!groups[group]) groups[group] = [];
                groups[group].push(result);
            });
        }

        return groups;
    }, [results, isDebugMode]);

    const groupOrder = [
        'Projects',
        'Today',
        'Yesterday',
        'Last 7 Days',
        'This Year',
        'Older',
        'Files in Drive'
    ];

    return (
        <div className="search-modal-container" onKeyDown={handleKeyDown}>
            {/* Search Input */}
            <div className="search-modal-input-wrapper">
                <Icon name="magnifier" size={4.5} className="search-modal-input-icon" />
                <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={c('Placeholder').t`Search...`}
                    className="search-modal-input"
                    autoFocus
                />
                {isSearching && (
                    <div className="search-modal-loading">
                        <CircleLoader size="small" />
                    </div>
                )}
            </div>

            {/* Search Results */}
            <div className="search-modal-results">

                {/* Empty state hint - only show when no results and no query */}
                {!query.trim() && results.length === 0 && !isSearching && (
                    <div className="search-modal-empty-hint">
                        {c('Info').t`No conversations yet. Start a new chat to begin.`}
                    </div>
                )}

                {error && (
                    <div className="search-modal-error">
                        <Icon name="exclamation-circle" className="search-modal-error-icon" />
                        <p className="search-modal-error-text">{error}</p>
                    </div>
                )}

                {!error && query.trim() && !isSearching && results.length === 0 && (
                    <div className="search-modal-empty">
                        <p className="search-modal-empty-text">
                            {c('Info').t`No results found for "${query}"`}
                        </p>
                    </div>
                )}

                {results.length > 0 && groupOrder.map(groupName => {
                    const groupResults = groupedResults[groupName];
                    if (!groupResults || groupResults.length === 0) return null;

                    return (
                        <div key={groupName} className="search-modal-section">
                            <div className="search-modal-section-header">
                                <span className="search-modal-section-title">{groupName}</span>
                            </div>
                            {groupResults.map((result, index) => {
                                const key = result.type === 'document'
                                    ? `doc-${result.documentId}-${index}`
                                    : result.type === 'message'
                                    ? `msg-${result.conversationId}-${result.messageId}-${index}`
                                    : result.type === 'project'
                                    ? `proj-${result.projectId}-${index}`
                                    : `conv-${result.conversationId}-${index}`;
                                return (
                                    <SearchResultItem
                                        key={key}
                                        result={result}
                                        query={query}
                                        onSelect={handleSelectResult}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Document Preview Modal */}
            {documentPreview && (
                <FileContentModal
                    attachment={documentPreview}
                    onClose={() => setDocumentPreview(null)}
                    open={!!documentPreview}
                />
            )}

            {/* Loading indicator for preview */}
            {isLoadingPreview && (
                <div className="search-modal-overlay" style={{ zIndex: 10001 }}>
                    <div className="flex flex-column items-center justify-center gap-4">
                        <CircleLoader size="medium" />
                        <p className="color-norm">{c('Info').t`Loading file preview...`}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export interface SearchModalProps {
    open: boolean;
    onClose: () => void;
}

export const SearchModal = ({ open, onClose }: SearchModalProps) => {
    const isGuest = useIsGuest();

    useEffect(() => {
        if (!open) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    if (isGuest || !open) {
        return null;
    }

    // Render in a portal at the document root to escape sidebar container
    return createPortal(
        <div className="search-modal-overlay" onClick={onClose}>
            <div className="search-modal-spotlight" onClick={(e) => e.stopPropagation()}>
                <SearchModalInner onClose={onClose} />
            </div>
        </div>,
        document.body
    );
};
