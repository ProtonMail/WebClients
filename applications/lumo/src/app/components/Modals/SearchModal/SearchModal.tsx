import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHistory } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { IcBrandProtonDriveFilled } from '@proton/icons/icons/IcBrandProtonDriveFilled';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { formatIntlDate } from '@proton/shared/lib/date/formatIntlDate';

import { getProjectCategory } from '../../../features/projects/constants';
import { useLumoPlan } from '../../../hooks/useLumoPlan';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useLumoSelector } from '../../../redux/hooks';
import { SearchService } from '../../../services/search/searchService';
import type { SearchResult } from '../../../services/search/types';
import type { Attachment } from '../../../types';
import { useNativeComposerVisibilityApi } from '../../Composer/hooks/useNativeComposerVisibilityApi';
import { FilePreviewPanel } from '../../Files/Common/FilePreviewPanel';
import { LumoIcon } from '../../LumoIcon/LumoIcon';
import { ProjectIcon as ProjectIconComponent } from '../../ProjectIcon/ProjectIcon';

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
            return formatIntlDate(date, { month: 'short', day: 'numeric' });
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
                if (minutes <= 1) {
                    return c('Time').t`Just now`;
                }
                // translator: Relative age of a chat. ${minutes} is elapsed minutes (≥2 here; "Just now" covers 0–1). Singular/plural for locale rules.
                return c('Time').ngettext(msgid`${minutes} minute ago`, `${minutes} minutes ago`, minutes);
            }
            // translator: Relative age of a chat. ${hours} is the number of elapsed hours.
            return c('Time').ngettext(msgid`${hours} hour ago`, `${hours} hours ago`, hours);
        } else if (age < oneWeek) {
            const days = Math.floor(age / oneDay);
            if (days === 1) {
                return c('Time').t`Yesterday`;
            }
            // translator: Relative age of a chat. ${days} is elapsed days (≥2 here; "Yesterday" covers 1). Singular/plural for locale rules.
            return c('Time').ngettext(msgid`${days} day ago`, `${days} days ago`, days);
        } else {
            const date = new Date(timestamp);
            return formatIntlDate(date, { month: 'short', day: 'numeric' });
        }
    };

    const getProjectCategoryInfo = (categoryId?: string) => {
        if (!categoryId) return null;
        return getProjectCategory(categoryId);
    };

    const projectIconId = result.type === 'conversation' || result.type === 'message' ? result.projectIcon : undefined;
    const projectCategory = projectIconId ? getProjectCategoryInfo(projectIconId) : null;
    const projectIconElement = projectCategory ? (
        <ProjectIconComponent iconId={projectIconId} size={12} className="mr-1" />
    ) : null;

    // Highlight search terms in text (case-insensitive, avoids global-regex lastIndex bugs)
    const highlightText = (text: string, searchQuery: string) => {
        if (!searchQuery.trim() || !text) return text;

        const normalizedQuery = searchQuery.toLowerCase();
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let searchIndex = 0;

        while (true) {
            const matchIndex = text.toLowerCase().indexOf(normalizedQuery, searchIndex);
            if (matchIndex === -1) {
                if (lastIndex < text.length) {
                    parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
                }
                break;
            }

            if (matchIndex > lastIndex) {
                parts.push(<span key={lastIndex}>{text.slice(lastIndex, matchIndex)}</span>);
            }

            const matchEnd = matchIndex + searchQuery.length;
            parts.push(
                <mark key={matchIndex} className="search-highlight">
                    {text.slice(matchIndex, matchEnd)}
                </mark>
            );

            lastIndex = matchEnd;
            searchIndex = matchIndex + 1;
        }

        return parts.length > 0 ? parts : text;
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
                    <div className="search-result-title">{highlightText(result.documentName || '', query)}</div>
                    {result.matchContext && (
                        <div className="search-result-preview search-result-context">
                            {highlightText(result.matchContext, query)}
                        </div>
                    )}
                    {result.documentPreview && (
                        <div className="search-result-preview search-result-folder-path">
                            <LumoIcon name="Folder" width={12} height={12} className="mr-1" color="var(--text-norm)" />
                            {result.documentPreview}
                        </div>
                    )}
                </div>
                <div className="search-result-meta">
                    <IcBrandProtonDriveFilled size={3} className="color-weak mr-1" />
                    <span className="search-result-date">{formatDate(result.timestamp, query)}</span>
                </div>
            </button>
        );
    }

    if (result.type === 'project') {
        return (
            <button
                className="search-result-item search-result-item-project"
                onClick={handleClick}
                title={c('Action').t`Open project`}
            >
                <div className="search-result-icon">
                    <ProjectIconComponent iconId={result.projectIcon} size={16} className="color-norm" />
                </div>
                <div className="search-result-content">
                    <div className="search-result-title">{highlightText(result.projectName || '', query)}</div>
                    {result.projectDescription && (
                        <div className="search-result-preview">{highlightText(result.projectDescription, query)}</div>
                    )}
                </div>
                <div className="search-result-date">{formatDate(result.timestamp, query)}</div>
            </button>
        );
    }

    return (
        <button className="search-result-item" onClick={handleClick} title={c('Action').t`Open conversation`}>
            <div className="search-result-content">
                {result.projectName && (
                    <div className="search-result-preview search-result-folder-path">
                        {projectIconElement}
                        {result.projectName}
                    </div>
                )}
                <div className="search-result-title">{highlightText(result.conversationTitle || '', query)}</div>
                {result.type === 'message' && result.messagePreview && (
                    <div className="search-result-preview">{highlightText(result.messagePreview, query)}</div>
                )}
            </div>
            <div className="search-result-date">{formatDate(result.timestamp, query)}</div>
        </button>
    );
};

interface SearchModalInnerProps {
    onClose: () => void;
}

const SearchModalInner = ({ onClose }: SearchModalInnerProps) => {
    // The search overlay covers the whole viewport, including the area the native
    // composer is drawn over on large screens. Hide it while the modal is mounted.
    useNativeComposerVisibilityApi({ hideComposer: true });

    const history = useHistory();
    const [user] = useUser();
    const { hasLumoPlus } = useLumoPlan();
    // Select only the slices needed for search; memoize to keep stable references
    const conversations = useLumoSelector((state) => state.conversations);
    const messages = useLumoSelector((state) => state.messages);
    const spaces = useLumoSelector((state) => state.spaces);
    const searchState = React.useMemo(() => ({ conversations, messages, spaces }), [conversations, messages, spaces]);
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
            // translator: Error shown when loading or searching chat history.
            setError(err instanceof Error ? err.message : c('collider_2025:Label').t`Failed to load conversations`);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [searchState, user?.ID, hasLumoPlus]);

    // Load conversations on mount
    useEffect(() => {
        if (hasLoadedOnceRef.current) return;
        hasLoadedOnceRef.current = true;
        void loadAllConversations();
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
    const performSearch = useCallback(
        async (searchQuery: string) => {
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
                // translator: Error shown when loading or searching chat history.
                setError(err instanceof Error ? err.message : c('collider_2025:Label').t`Search failed`);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        },
        [searchState, loadAllConversations, user?.ID, hasLumoPlus]
    );

    // Handle search input changes with debouncing
    const handleSearchChange = (value: string) => {
        setQuery(value);

        // Clear existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce search
        searchTimeoutRef.current = setTimeout(() => {
            void performSearch(value);
        }, 300);
    };

    // Handle result selection
    const handleSelectResult = useCallback(
        async (conversationId?: string, messageId?: string, documentId?: string, projectId?: string) => {
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
        },
        [history, onClose]
    );

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
        const conversations = results.filter((r) => r.type === 'conversation' || r.type === 'message');
        const projects = results.filter((r) => r.type === 'project');
        const documents = results.filter((r) => r.type === 'document');

        const groups: Record<string, SearchResult[]> = {};

        // Add projects group if there are any
        if (projects.length > 0) {
            groups.projects = projects.sort((a, b) => b.timestamp - a.timestamp);
        }

        // Add document group if there are any (only in debug mode)
        if (documents.length > 0 && isDebugMode) {
            groups.drive = documents.sort((a, b) => b.timestamp - a.timestamp);
        }

        // Group conversations by time with better labels
        if (conversations.length > 0) {
            const now = Date.now();
            const oneDay = 86400000;
            const twoDays = oneDay * 2;
            const oneWeek = oneDay * 7;
            const oneYear = oneDay * 365;

            conversations.forEach((result) => {
                const age = now - result.timestamp;
                let group = 'older';

                if (age < oneDay) {
                    group = 'today';
                } else if (age < twoDays) {
                    group = 'yesterday';
                } else if (age < oneWeek) {
                    group = 'lastWeek';
                } else if (age < oneYear) {
                    group = 'thisYear';
                }

                if (!groups[group]) groups[group] = [];
                groups[group].push(result);
            });
        }

        return groups;
    }, [results, isDebugMode]);
    const groupLabels: Record<string, string> = {
        // translator: Search result group heading for projects.
        projects: c('collider_2025:Label').t`Projects`,
        // translator: Search result group heading for today's conversations.
        today: c('collider_2025:Label').t`Today`,
        // translator: Search result group heading for yesterday's conversations.
        yesterday: c('collider_2025:Label').t`Yesterday`,
        // translator: Search result group heading for conversations from the last week.
        lastWeek: c('collider_2025:Label').t`Last 7 Days`,
        // translator: Search result group heading for conversations from this year.
        thisYear: c('collider_2025:Label').t`This Year`,
        // translator: Search result group heading for older conversations.
        older: c('collider_2025:Label').t`Older`,
        // translator: Search result group heading for Drive files.
        drive: c('collider_2025:Label').t`Files in Drive`,
    };
    const groupOrder = Object.keys(groupLabels);

    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div className="search-modal-container" onKeyDown={handleKeyDown}>
            {/* Search Input */}
            <div className="search-modal-input-wrapper">
                <IcMagnifier size={4.5} className="search-modal-input-icon" />
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
                        <LumoIcon name="Info" className="search-modal-error-icon" />
                        <p className="search-modal-error-text">{error}</p>
                    </div>
                )}

                {!error && query.trim() && !isSearching && results.length === 0 && (
                    <div className="search-modal-empty">
                        <p className="search-modal-empty-text">{c('Info').t`No results found for "${query}"`}</p>
                    </div>
                )}

                {results.length > 0 &&
                    groupOrder.map((groupName) => {
                        const groupResults = groupedResults[groupName];
                        if (!groupResults || groupResults.length === 0) return null;

                        return (
                            <div key={groupName} className="search-modal-section">
                                <div className="search-modal-section-header">
                                    <span className="search-modal-section-title">{groupLabels[groupName]}</span>
                                </div>
                                {groupResults.map((result, index) => {
                                    const key =
                                        result.type === 'document'
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

            {/* Document Preview Panel */}
            {documentPreview && (
                <div className="search-modal-preview-panel">
                    <FilePreviewPanel
                        attachment={documentPreview}
                        onBack={() => setDocumentPreview(null)}
                        onClose={() => setDocumentPreview(null)}
                    />
                </div>
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
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <div className="search-modal-overlay" onClick={onClose}>
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
            <div className="search-modal-spotlight" onClick={(e) => e.stopPropagation()}>
                <SearchModalInner onClose={onClose} />
            </div>
        </div>,
        document.body
    );
};
