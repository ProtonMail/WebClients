import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { Icon } from '@proton/components';

import { GALLERY_PROMPT_SUGGESTIONS, type GalleryPromptSuggestion } from './promptSuggestions';

import './GalleryView.scss';

const SUGGESTIONS_PER_PAGE = 4;

function pickSuggestions(pool: GalleryPromptSuggestion[], exclude: GalleryPromptSuggestion[]): GalleryPromptSuggestion[] {
    const excludeIds = new Set(exclude.map((s) => s.id));
    const remaining = pool.filter((s) => !excludeIds.has(s.id));
    const source = remaining.length >= SUGGESTIONS_PER_PAGE ? remaining : pool;
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, SUGGESTIONS_PER_PAGE);
}

const SuggestionCard = ({
    suggestion,
    onClick,
}: {
    suggestion: GalleryPromptSuggestion;
    onClick: (s: GalleryPromptSuggestion) => void;
}) => (
    <button className="gallery-suggestion-card" onClick={() => onClick(suggestion)} type="button">
        <span className="gallery-suggestion-card__thumb" aria-hidden>
            <span className="gallery-suggestion-card__emoji">{suggestion.icon}</span>
        </span>
        <span className="gallery-suggestion-card__label">
            {suggestion.title}
            {suggestion.action === 'sketch' && (
                <Icon name="pen" size={3} className="gallery-suggestion-card__action-icon" />
            )}
            {suggestion.action === 'edit_image' && (
                <Icon name="arrow-up-line" size={3} className="gallery-suggestion-card__action-icon" />
            )}
        </span>
    </button>
);

export const DiscoverPanel = ({ onSuggestionClick }: { onSuggestionClick: (s: GalleryPromptSuggestion) => void }) => {
    const [visible, setVisible] = useState<GalleryPromptSuggestion[]>(() =>
        pickSuggestions(GALLERY_PROMPT_SUGGESTIONS, [])
    );

    const handleShuffle = useCallback(() => {
        setVisible((prev) => pickSuggestions(GALLERY_PROMPT_SUGGESTIONS, prev));
    }, []);

    return (
        <div className="gallery-discover">
            <div className="gallery-discover__header">
                <span className="gallery-discover__title">
                    {c('collider_2025:Label').t`Discover what Lumo can create`}
                </span>
                <button
                    className="gallery-discover__shuffle"
                    onClick={handleShuffle}
                    type="button"
                    title={c('collider_2025:Action').t`Shuffle suggestions`}
                >
                    <Icon name="arrows-rotate" size={4} />
                </button>
            </div>
            <div className="gallery-discover__grid">
                {visible.map((s) => (
                    <SuggestionCard key={s.id} suggestion={s} onClick={onSuggestionClick} />
                ))}
            </div>
        </div>
    );
};
