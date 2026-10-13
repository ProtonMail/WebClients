import { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useGeneratedGalleryCreations } from '../creations/hooks/useGeneratedGalleryCreations';
import { GalleryView } from '../gallery/GalleryView';
import { LibraryCreationsTab } from './LibraryCreationsTab';
import type { LibraryCreationFilter, LibrarySortOrder } from './libraryCreations';
import { filterAndSortCreations } from './libraryCreations';
import { useLibraryCreationEntries } from './useLibraryCreationEntries';

import './LibraryView.scss';

type LibraryTab = 'creations' | 'images';

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
    sort: LibrarySortOrder;
    creations: ReturnType<typeof useGeneratedGalleryCreations>;
}

const CreationsContent = ({ searchQuery, sort, creations }: CreationsContentProps) => {
    const [filter, setFilter] = useState<LibraryCreationFilter>('all');
    const entries = useLibraryCreationEntries(creations.items);
    const visibleEntries = filterAndSortCreations(entries, { filter, query: searchQuery, sort });

    return (
        <div className="flex-1 min-h-0 overflow-auto">
            <div className="library-inner px-6 pb-8">
                <LibraryCreationsTab
                    entries={entries}
                    visibleEntries={visibleEntries}
                    status={creations.status}
                    hasMore={creations.hasMore}
                    onLoadMore={() => {
                        void creations.loadMore();
                    }}
                    filter={filter}
                    onFilterChange={setFilter}
                    isSearching={searchQuery.trim().length > 0}
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
    const [sort, setSort] = useState<LibrarySortOrder>('newest');

    const requestedTab = new URLSearchParams(location.search).get('tab');
    const activeTab: LibraryTab = (requestedTab === 'images' && imageTools) || !artifactsView ? 'images' : 'creations';

    const selectTab = (tab: LibraryTab) => {
        history.replace({ search: tab === 'images' ? '?tab=images' : '' });
    };

    // The count covers what has loaded so far; "+" when older creations can still load.
    const creationsCount =
        creations.status === 'loaded' ? `${creations.items.length}${creations.hasMore ? '+' : ''}` : undefined;

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }}>
            <div className="flex flex-column flex-1 min-h-0">
                <div className="library-inner shrink-0 px-6 pt-8">
                    <div className="flex flex-row flex-wrap items-start justify-space-between gap-4 mb-6">
                        <div className="flex flex-column gap-1">
                            <h1 className="text-3xl text-bold m-0">{c('collider_2025:Title').t`Library`}</h1>
                            <p className="m-0 color-weak">
                                {c('collider_2025:Info')
                                    .t`Artifacts and images ${LUMO_SHORT_APP_NAME} created in your chats.`}
                            </p>
                        </div>
                        {activeTab === 'creations' && (
                            <div className="flex flex-row flex-nowrap items-center gap-2">
                                <Input
                                    className="w-custom"
                                    style={{ '--w-custom': '16rem' }}
                                    value={searchQuery}
                                    onValue={setSearchQuery}
                                    placeholder={c('collider_2025:Placeholder').t`Search library`}
                                    aria-label={c('collider_2025:Label').t`Search library`}
                                    prefix={<LumoIcon name="Search" size={16} className="color-weak" />}
                                />
                                <Button
                                    shape="outline"
                                    color="weak"
                                    className="shrink-0 flex flex-row flex-nowrap items-center gap-2"
                                    onClick={() => {
                                        setSort((current) => {
                                            return current === 'newest' ? 'oldest' : 'newest';
                                        });
                                    }}
                                >
                                    <LumoIcon name="ArrowUpDown" size={16} />
                                    {sort === 'newest'
                                        ? c('collider_2025:Action').t`Newest first`
                                        : c('collider_2025:Action').t`Oldest first`}
                                </Button>
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
                    <CreationsContent searchQuery={searchQuery} sort={sort} creations={creations} />
                ) : (
                    <div className="relative flex flex-column flex-1 min-h-0">
                        <GalleryView isProcessingAttachment={isProcessingAttachment} prefillQuery={prefillQuery} />
                    </div>
                )}
            </div>
        </LumoLayoutWithDrawer>
    );
};
