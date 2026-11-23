import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import type { DrawingMode } from '../../features/drawingcanvas/types';
import { GalleryImageCard } from './GalleryImageCard';
import { GalleryMasonryGrid } from './GalleryMasonryGrid';
import type { GallerySection } from './hooks/useGeneratedGalleryImages';

import './GalleryView.scss';

interface CreatedGridProps {
    sections: GallerySection[];
    status: 'idle' | 'loading' | 'loaded' | 'error';
    hasMore: boolean;
    loadMore: () => void;
    onExport: (imageData: string, mode: DrawingMode, description: string) => void;
}

export const CreatedGrid = ({ sections, status, hasMore, loadMore, onExport }: CreatedGridProps) => {
    const allItems = sections.flatMap((s) => s.items);

    if (status === 'loading' && allItems.length === 0) {
        return (
            <div className="gallery-created gap-4">
                <div className="gallery-loading gap-3 py-8">
                    <CircleLoader size="medium" />
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="gallery-created gap-4">
                <div className="gallery-error gap-3 py-8">
                    <LumoIcon
                        name="CircleExclamationPoint"
                        size={24}
                        className="gallery-error__icon lumo-color-signal-warning"
                    />
                    <p>{c('collider_2025:Error').t`Failed to load images. Please try again.`}</p>
                </div>
            </div>
        );
    }

    if (allItems.length === 0) {
        return null;
    }

    return (
        <div className="gallery-created gap-4">
            <GalleryMasonryGrid>
                {allItems.map((item) => (
                    <GalleryImageCard
                        key={item.localId}
                        attachmentId={item.localId}
                        createdAt={item.createdAt}
                        onExport={onExport}
                        imageSrcOverride={(item as any)._testImageSrc}
                    />
                ))}
            </GalleryMasonryGrid>

            {hasMore && (
                <div className="gallery-load-more pt-1 pb-2">
                    <Button shape="outline" color="weak" onClick={loadMore} loading={status === 'loading'}>
                        {c('collider_2025:Button').t`Load more`}
                    </Button>
                </div>
            )}
        </div>
    );
};
