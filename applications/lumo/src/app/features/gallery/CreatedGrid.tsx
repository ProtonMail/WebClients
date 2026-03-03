import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components';

import type { DrawingMode } from '../../features/drawingcanvas/types';
import { GalleryImageCard } from './GalleryImageCard';
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
            <div className="gallery-created">
                <h2 className="gallery-created__title">{c('collider_2025:Title').t`What you created`}</h2>
                <div className="gallery-loading">
                    <CircleLoader size="medium" />
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="gallery-created">
                <h2 className="gallery-created__title">{c('collider_2025:Title').t`What you created`}</h2>
                <div className="gallery-error">
                    <Icon name="exclamation-circle" size={6} className="gallery-error__icon" />
                    <p>{c('collider_2025:Error').t`Failed to load images. Please try again.`}</p>
                </div>
            </div>
        );
    }

    if (allItems.length === 0) {
        return null;
    }

    return (
        <div className="gallery-created">
            <h2 className="gallery-created__title">{c('collider_2025:Title').t`What you created`}</h2>
            <div className="gallery-grid">
                {allItems.map((item) => (
                    <GalleryImageCard
                        key={item.localId}
                        attachmentId={item.localId}
                        createdAt={item.createdAt}
                        onExport={onExport}
                    />
                ))}
            </div>

            {hasMore && (
                <div className="gallery-load-more">
                    <Button shape="outline" color="weak" onClick={loadMore} loading={status === 'loading'}>
                        {c('collider_2025:Button').t`Load more`}
                    </Button>
                </div>
            )}
        </div>
    );
};
