import { useState } from 'react';

import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { ImagePreviewOverlay } from '../imageActions/ImagePreviewOverlay';
import { INSPIRATION_SUGGESTIONS } from './inspirationSuggestions';

import './GalleryView.scss';

interface ExploreGalleryGridProps {
    onTryPrompt: (prompt: string) => void;
}

export const ExploreGalleryGrid = ({ onTryPrompt }: ExploreGalleryGridProps) => {
    const [openId, setOpenId] = useState<string | null>(null);
    const activeItem = INSPIRATION_SUGGESTIONS.find((s) => s.id === openId) ?? null;
    const activePrompt = activeItem?.getPrompt() ?? '';

    return (
        <>
            <div className="gallery-explore">
                <h2 className="gallery-explore__title main-text medium">
                    {c('collider_2025:Title').t`Explore images created with ${LUMO_SHORT_APP_NAME}`}
                </h2>
                <div className="gallery-grid">
                    {INSPIRATION_SUGGESTIONS.map((s, index) => (
                        <button
                            key={s.id}
                            type="button"
                            className="gallery-card"
                            onClick={() => setOpenId(s.id)}
                            aria-label={`${c('collider_2025:Label').t`Inspiration image`} ${index + 1}`}
                        >
                            <img
                                src={s.img}
                                alt=""
                                className="gallery-card__image"
                                loading="lazy"
                                decoding="async"
                                fetchPriority={index < 6 ? 'high' : 'low'}
                            />
                        </button>
                    ))}
                </div>
            </div>
            <ImagePreviewOverlay
                isOpen={!!openId}
                imageDataUrl={activeItem?.img ?? ''}
                prompt={activePrompt}
                onClose={() => setOpenId(null)}
                onTryPrompt={() => {
                    onTryPrompt(activePrompt);
                    setOpenId(null);
                }}
            />
        </>
    );
};
