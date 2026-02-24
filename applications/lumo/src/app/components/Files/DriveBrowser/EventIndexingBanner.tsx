import React from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

interface EventIndexingBannerProps {
    isIndexing: boolean;
    currentFile?: string;
    processedCount?: number;
    totalCount?: number;
    /** Render as inline element (for settings panel) */
    inline?: boolean;
}

export const EventIndexingBanner: React.FC<EventIndexingBannerProps> = ({ 
    isIndexing, 
    currentFile,
    processedCount = 0,
    totalCount = 0,
    inline = false,
}) => {
    if (!isIndexing) {
        return null;
    }

    const percentage = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;
    const progressText = totalCount > 0 
        ? `${processedCount}/${totalCount} files (${percentage}%)`
        : currentFile || 'Preparing...';

    // Subtle inline style (no background)
    if (inline) {
        return (
            <div className="w-full py-2 mt-2 flex items-center gap-2">
                <CircleLoader size="small" className="shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm color-weak">
                            {c('collider_2025:Status').t`Indexing`}
                        </span>
                        <span className="text-sm color-hint">
                            {progressText}
                        </span>
                    </div>
                    {totalCount > 0 && (
                        <div className="h-0.5 bg-weak rounded-full overflow-hidden mt-1" style={{ maxWidth: '200px' }}>
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    )}
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
                        {c('collider_2025:Status').t`Indexing for search`}
                    </span>
                    <span className="text-sm color-hint">
                        {progressText}
                    </span>
                </div>
                {totalCount > 0 && (
                    <div className="h-0.5 bg-weak rounded-full overflow-hidden mt-1" style={{ maxWidth: '300px' }}>
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
