import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Icon } from '@proton/components';
import lumoCookie from '@proton/styles/assets/img/lumo/lumo-image-examples/lumo-cookie.png';

import type { DrawingMode } from '../../features/drawingcanvas/types';
import { GalleryImageCard } from './GalleryImageCard';
import type { GalleryImageItem, GallerySection } from './hooks/useGeneratedGalleryImages';

import './GalleryView.scss';

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

const makeItem = (index: number, daysAgo: number): GalleryImageItem =>
    ({
        localId: `local-${index}`,
        localSpaceId: `space-${(index % 3) + 1}`,
        remoteId: `remote-${index}`,
        createdAt: new Date(now - daysAgo * DAY),
        // lumoCookie is used as a placeholder image source in manual testing
        _testImageSrc: lumoCookie,
    }) as any;

export const FAKE_GALLERY_SECTIONS: GallerySection[] = [
    {
        label: 'Last 7 days',
        items: [
            makeItem(1, 1),
            makeItem(2, 2),
            makeItem(3, 2),
            makeItem(4, 3),
            makeItem(5, 4),
            makeItem(6, 5),
            makeItem(7, 5),
            makeItem(8, 6),
            makeItem(9, 6),
            makeItem(10, 7),
        ],
    },
    {
        label: 'Last 30 days',
        items: [
            makeItem(11, 8),
            makeItem(12, 10),
            makeItem(13, 12),
            makeItem(14, 14),
            makeItem(15, 16),
            makeItem(16, 18),
            makeItem(17, 20),
            makeItem(18, 22),
            makeItem(19, 25),
            makeItem(20, 28),
        ],
    },
    {
        label: 'Older',
        items: [
            makeItem(21, 31),
            makeItem(22, 35),
            makeItem(23, 40),
            makeItem(24, 45),
            makeItem(25, 50),
            makeItem(26, 60),
            makeItem(27, 75),
            makeItem(28, 90),
            makeItem(29, 120),
            makeItem(30, 180),
        ],
    },
];

interface CreatedGridProps {
    sections: GallerySection[];
    status: 'idle' | 'loading' | 'loaded' | 'error';
    hasMore: boolean;
    loadMore: () => void;
    onExport: (imageData: string, mode: DrawingMode, description: string) => void;
}

export const CreatedGrid = ({ sections, status, hasMore, loadMore, onExport }: CreatedGridProps) => {
    const allItems = sections.flatMap((s) => s.items);
    // const allItems = FAKE_GALLERY_SECTIONS.flatMap((s) => s.items)

    if (status === 'loading' && allItems.length === 0) {
        return (
            <div className="gallery-created">
                <div className="gallery-loading">
                    <CircleLoader size="medium" />
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="gallery-created">
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
            <div className="gallery-grid">
                {allItems.map((item) => (
                    <GalleryImageCard
                        key={item.localId}
                        attachmentId={item.localId}
                        createdAt={item.createdAt}
                        onExport={onExport}
                        imageSrcOverride={(item as any)._testImageSrc}
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
