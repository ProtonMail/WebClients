import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Input } from '@proton/atoms/Input/Input';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useGeneratedGalleryCreations } from '../creations/hooks/useGeneratedGalleryCreations';
import { GalleryView } from '../gallery/GalleryView';
import { LibraryCreationsTab } from './LibraryCreationsTab';
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
                'library-tab flex flex-row flex-nowrap items-center gap-2 px-1 pb-3 border-none bg-transparent',
                isActive ? 'library-tab--active color-norm text-semibold' : 'color-weak'
            )}
            onClick={onClick}
        >
            {label}
            {count && <span className="color-hint font-normal">{count}</span>}
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
            <div className="library-inner px-6 pb-8">
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
    const { artifactsView, imageTools } = useLumoFlags();
    const creations = useGeneratedGalleryCreations({ enabled: artifactsView });
    const [searchQuery, setSearchQuery] = useState('');

    const requestedTab = new URLSearchParams(location.search).get('tab');
    const activeTab: LibraryTab = (requestedTab === 'images' && imageTools) || !artifactsView ? 'images' : 'creations';

    const selectTab = (tab: LibraryTab) => {
        history.replace({ search: tab === 'images' ? '?tab=images' : '' });
    };

    const creationsCount = creations.status === 'loaded' ? `${creations.items.length}` : undefined;

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }}>
            <div className="flex flex-column flex-1 min-h-0">
                <div className="library-inner shrink-0 px-6 pt-8">
                    <div className="flex flex-row flex-wrap items-start justify-space-between gap-4 mb-6">
                        <div className="flex flex-column gap-1">
                            <h1 className="text-3xl text-bold m-0">{c('collider_2025:Title').t`Library`}</h1>
                            <p className="m-0 color-weak">
                                {c('collider_2025:Info')
                                    .t`Creations and images ${LUMO_SHORT_APP_NAME} made in your chats.`}
                            </p>
                        </div>
                        {activeTab === 'creations' && (
                            // Input grows by default (flex-1), so the wrapper sets its width: its
                            // own row on small screens, a fixed width beside the title above that.
                            <div className="w-full md:w-custom" style={{ '--md-w-custom': '12rem' }}>
                                <Input
                                    value={searchQuery}
                                    onValue={setSearchQuery}
                                    placeholder={c('collider_2025:Placeholder').t`Search library`}
                                    aria-label={c('collider_2025:Label').t`Search library`}
                                    prefix={<LumoIcon name="Search" size={16} className="color-weak" />}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-row gap-6 border-bottom border-weak mb-6" role="tablist">
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
                {activeTab === 'creations' ? (
                    <CreationsContent searchQuery={searchQuery} creations={creations} />
                ) : (
                    <div className="relative flex flex-column flex-1 min-h-0">
                        <GalleryView isProcessingAttachment={isProcessingAttachment} prefillQuery={prefillQuery} />
                    </div>
                )}
            </div>
        </LumoLayoutWithDrawer>
    );
};
