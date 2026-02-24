import React from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import type { FolderIndexingStatus } from '../../../types/documents';

interface IndexingStatusBannerProps {
    indexingStatus: FolderIndexingStatus | null;
    isIndexing: boolean;
    /** Render as inline element (for settings panel) */
    inline?: boolean;
}

export const IndexingStatusBanner: React.FC<IndexingStatusBannerProps> = ({
    indexingStatus,
    isIndexing,
    inline = false,
}) => {
    if (!isIndexing || !indexingStatus) {
        return null;
    }

    const { status, progress } = indexingStatus;
    const percentage = progress.total > 0 ? Math.round((progress.indexed / progress.total) * 100) : 0;

    const progressText = progress.total > 0
        ? `${progress.indexed}/${progress.total} files (${percentage}%)`
        : 'Preparing...';

    // Subtle inline style (no background)
    if (inline) {
        return (
            <div className="w-full py-2 mt-2 flex items-center gap-2">
                <CircleLoader size="small" className="shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm color-weak">
                            {status === 'indexing'
                                ? c('collider_2025:Status').t`Indexing`
                                : status === 'complete'
                                  ? c('collider_2025:Status').t`Complete`
                                  : c('collider_2025:Status').t`Error`}
                        </span>
                        <span className="text-sm color-hint">
                            {progressText}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Subtle banner for Drive Browser (no heavy background)
    return (
        <div className="mx-4 mb-2 py-2 flex items-center gap-2">
            <CircleLoader size="small" className="shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm color-weak">
                        {status === 'indexing'
                            ? c('collider_2025:Status').t`Indexing for search`
                            : status === 'complete'
                              ? c('collider_2025:Status').t`Indexing complete`
                              : c('collider_2025:Status').t`Indexing error`}
                    </span>
                    <span className="text-sm color-hint">
                        {progressText}
                    </span>
                </div>
                <div className="h-0.5 bg-weak rounded-full overflow-hidden mt-1" style={{ maxWidth: '300px' }}>
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
