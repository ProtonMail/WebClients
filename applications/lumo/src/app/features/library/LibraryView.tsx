import { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Input } from '@proton/atoms/Input/Input';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { sendLibraryOpenedEvent } from '../../util/telemetry';
import { useGeneratedGalleryCreations } from '../creations/hooks/useGeneratedGalleryCreations';
import { GalleryView } from '../gallery/GalleryView';
import { LibraryCreationsTab } from './LibraryCreationsTab';
import { LibraryGuestSignInState } from './LibraryGuestSignInState';
import type { LibraryCreationFilter } from './libraryCreations';
import { filterAndSortCreations } from './libraryCreations';
import { useLibraryCreationEntries } from './useLibraryCreationEntries';

import './LibraryView.scss';

type LibraryTab = 'creations' | 'images';

// Cards shown at first and added by each "Show more": fills whole rows at 4, 3 or 2 per row.
const CREATIONS_SHOWN_PER_STEP = 24;

interface LibraryTabButtonProps {
    label: string;
    count?: string;
    isActive: boolean;
    onClick: () => void;
}

const LibraryTabButton = ({ label, count, isActive, onClick }: LibraryTabButtonProps) => {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            className={clsx(
                'library-tab flex flex-row flex-nowrap items-center gap-1.5 px-0.5 pt-2.5 pb-3 lumo-label-large bg-transparent',
                isActive ? 'library-tab--active lumo-color-glyph' : 'lumo-color-glyph-mid'
            )}
            onClick={onClick}
        >
            {label}
            {count && <span className="lumo-body-small lumo-color-glyph-mid">{count}</span>}
        </button>
    );
};

interface CreationsContentProps {
    searchQuery: string;
    creations: ReturnType<typeof useGeneratedGalleryCreations>;
}

const CreationsContent = ({ searchQuery, creations }: CreationsContentProps) => {
    const [filter, setFilter] = useState<LibraryCreationFilter>('all');
    const [shownCount, setShownCount] = useState(CREATIONS_SHOWN_PER_STEP);
    const isSearching = searchQuery.trim().length > 0;
    // Titles and types are inside the encrypted assets, so search and filters need every one.
    const isNarrowing = isSearching || filter !== 'all';

    useEffect(() => {
        setShownCount(CREATIONS_SHOWN_PER_STEP);
    }, [filter, searchQuery]);

    // Items are newest first, the order the cards show in, so the first `shownCount` are on screen.
    const pullIds = useMemo(() => {
        if (isNarrowing) {
            return 'all' as const;
        }
        return new Set(
            creations.items.slice(0, shownCount).map((item) => {
                return item.localId;
            })
        );
    }, [isNarrowing, creations.items, shownCount]);
    const entries = useLibraryCreationEntries(creations.items, pullIds);
    const matches = filterAndSortCreations(entries, { filter, query: searchQuery });
    const pendingSearchCount = isNarrowing
        ? entries.filter((entry) => {
              return entry.isPending;
          }).length
        : 0;

    return (
        <div className="flex-1 min-h-0 overflow-auto">
            <div className="w-full max-w-custom mx-auto pb-10" style={{ '--max-w-custom': '75rem' }}>
                <LibraryCreationsTab
                    entries={entries}
                    visibleEntries={matches.slice(0, shownCount)}
                    hasMore={matches.length > shownCount}
                    onShowMore={() => {
                        setShownCount((count) => {
                            return count + CREATIONS_SHOWN_PER_STEP;
                        });
                    }}
                    pendingSearchCount={pendingSearchCount}
                    status={creations.status}
                    onRetry={creations.retry}
                    filter={filter}
                    onFilterChange={setFilter}
                    isSearching={isSearching}
                />
            </div>
        </div>
    );
};

interface Props {
    isProcessingAttachment: boolean;
    prefillQuery?: string;
}

/**
 * Everything Lumo made across chats: artifacts (Creations, behind artifactsView) and generated
 * images (Images, behind imageTools). The tab lives in the URL so /images can redirect to it.
 */
export const LibraryView = ({ isProcessingAttachment, prefillQuery }: Props) => {
    const history = useHistory();
    const location = useLocation();
    const isGuest = useIsGuest();
    const { artifactsView, imageTools } = useLumoFlags();
    const creations = useGeneratedGalleryCreations({ enabled: artifactsView && !isGuest });
    const [searchQuery, setSearchQuery] = useState('');

    const requestedTab = new URLSearchParams(location.search).get('tab');
    const activeTab: LibraryTab = (requestedTab === 'images' && imageTools) || !artifactsView ? 'images' : 'creations';

    useNativeComposerVisibilityApi({ hideComposer: isGuest || activeTab === 'creations' });

    const selectTab = (tab: LibraryTab) => {
        history.replace({ search: tab === 'images' ? '?tab=images' : '' });
    };

    const creationsCount = creations.status === 'loaded' ? `${creations.items.length}` : undefined;

    // Once per visit, after the list settles, so empty Libraries can be told apart.
    const hasReportedOpenRef = useRef(false);
    useEffect(() => {
        if (!artifactsView || hasReportedOpenRef.current) {
            return;
        }
        if (isGuest) {
            hasReportedOpenRef.current = true;
            sendLibraryOpenedEvent({
                tab: activeTab,
                hasCreations: false,
            });
            return;
        }
        if (creations.status !== 'loaded' && creations.status !== 'error') {
            return;
        }
        hasReportedOpenRef.current = true;
        sendLibraryOpenedEvent({
            tab: activeTab,
            hasCreations: creations.status === 'loaded' ? creations.items.length > 0 : undefined,
        });
    }, [artifactsView, isGuest, creations.status, creations.items.length, activeTab]);

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }}>
            <div className="flex flex-column flex-1 min-h-0 px-8 pt-2">
                <div className="shrink-0 w-full max-w-custom mx-auto" style={{ '--max-w-custom': '75rem' }}>
                    <div className="flex flex-row flex-wrap items-start justify-space-between gap-4 mb-6">
                        <div className="flex flex-column gap-1">
                            <h1 className="m-0 lumo-headline-small">{c('collider_2025:Title').t`Library`}</h1>
                            <p className="m-0 lumo-body-medium lumo-color-glyph-mid">
                                {c('collider_2025:Info')
                                    .t`Creations and images ${LUMO_SHORT_APP_NAME} made in your chats.`}
                            </p>
                        </div>
                        {activeTab === 'creations' && !isGuest && (
                            // Input grows by default (flex-1), so the wrapper sets its width: its
                            // own row on small screens, a fixed width beside the title above that.
                            <div className="w-full md:w-custom" style={{ '--md-w-custom': '12rem' }}>
                                <Input
                                    className="lumo-search-field"
                                    dir="auto"
                                    value={searchQuery}
                                    onValue={setSearchQuery}
                                    placeholder={c('collider_2025:Placeholder').t`Search library`}
                                    aria-label={c('collider_2025:Label').t`Search library`}
                                    prefix={<LumoIcon name="Search" size={16} className="lumo-color-glyph-mid" />}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-row gap-6 mb-6 border-bottom lumo-border" role="tablist">
                        {artifactsView && (
                            <LibraryTabButton
                                label={c('collider_2025:Tab').t`Creations`}
                                count={creationsCount}
                                isActive={activeTab === 'creations'}
                                onClick={() => {
                                    selectTab('creations');
                                }}
                            />
                        )}
                        {imageTools && (
                            <LibraryTabButton
                                label={c('collider_2025:Tab').t`Images`}
                                isActive={activeTab === 'images'}
                                onClick={() => {
                                    selectTab('images');
                                }}
                            />
                        )}
                    </div>
                </div>
                {isGuest ? (
                    <div className="flex-1 min-h-0 overflow-auto">
                        <LibraryGuestSignInState />
                    </div>
                ) : activeTab === 'creations' ? (
                    <CreationsContent searchQuery={searchQuery} creations={creations} />
                ) : (
                    <div
                        className="relative flex flex-column flex-1 w-full max-w-custom min-h-0 mx-auto"
                        style={{ '--max-w-custom': '75rem' }}
                    >
                        <GalleryView
                            layout="embedded"
                            isProcessingAttachment={isProcessingAttachment}
                            prefillQuery={prefillQuery}
                        />
                    </div>
                )}
            </div>
        </LumoLayoutWithDrawer>
    );
};
