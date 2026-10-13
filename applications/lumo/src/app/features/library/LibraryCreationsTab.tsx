import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { LibraryCreationCard } from './LibraryCreationCard';
import type { LibraryCreationEntry, LibraryCreationFilter } from './libraryCreations';
import { getLibraryFilterLabel } from './libraryCreations';

const BASE_FILTERS: LibraryCreationFilter[] = ['all', 'document', 'code', 'webpage'];

interface Props {
    entries: LibraryCreationEntry[];
    visibleEntries: LibraryCreationEntry[];
    status: 'idle' | 'loading' | 'loaded' | 'error';
    hasMore: boolean;
    onLoadMore: () => void;
    filter: LibraryCreationFilter;
    onFilterChange: (filter: LibraryCreationFilter) => void;
    isSearching: boolean;
}

export const LibraryCreationsTab = ({
    entries,
    visibleEntries,
    status,
    hasMore,
    onLoadMore,
    filter,
    onFilterChange,
    isSearching,
}: Props) => {
    // Slides only get a chip once there is a deck to filter to.
    const hasPresentations = entries.some((entry) => {
        return entry.artifactType === 'presentation';
    });
    const filters: LibraryCreationFilter[] = hasPresentations ? [...BASE_FILTERS, 'presentation'] : BASE_FILTERS;

    if (status === 'loading' && entries.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <CircleLoader size="medium" />
            </div>
        );
    }

    if (status === 'error' && entries.length === 0) {
        return <p className="color-danger text-sm">{c('collider_2025:Error').t`Could not load creations.`}</p>;
    }

    if (status === 'loaded' && entries.length === 0) {
        return (
            <p className="color-weak text-sm">
                {c('collider_2025:Info').t`Documents, code and webpages created in your chats will appear here.`}
            </p>
        );
    }

    return (
        <div className="flex flex-column gap-6">
            <fieldset className="flex flex-row flex-wrap gap-2 border-none p-0 m-0">
                <legend className="sr-only">{c('collider_2025:Label').t`Filter by type`}</legend>
                {filters.map((option) => {
                    const isActive = option === filter;
                    return (
                        <Button
                            key={option}
                            shape="outline"
                            color="weak"
                            size="small"
                            pill
                            className={clsx('flex flex-row flex-nowrap items-center gap-1', isActive && 'bg-weak')}
                            aria-pressed={isActive}
                            onClick={() => {
                                onFilterChange(option);
                            }}
                        >
                            {isActive && <LumoIcon name="Check" size={14} />}
                            {getLibraryFilterLabel(option)}
                        </Button>
                    );
                })}
            </fieldset>

            {visibleEntries.length === 0 ? (
                <p className="color-weak text-sm">
                    {isSearching
                        ? c('collider_2025:Info').t`No creations match your search.`
                        : c('collider_2025:Info').t`No creations of this type yet.`}
                </p>
            ) : (
                <div
                    className="grid-auto-fill gap-6"
                    style={{ '--min-grid-template-column-size': '16rem' } as React.CSSProperties}
                >
                    {visibleEntries.map((entry) => {
                        return <LibraryCreationCard key={entry.item.localId} entry={entry} />;
                    })}
                </div>
            )}

            {hasMore && (
                <div className="flex justify-center">
                    <Button shape="outline" color="weak" onClick={onLoadMore} loading={status === 'loading'}>
                        {c('collider_2025:Action').t`Load more`}
                    </Button>
                </div>
            )}
        </div>
    );
};
